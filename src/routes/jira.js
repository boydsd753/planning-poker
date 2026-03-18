'use strict';

const express    = require('express');
const router     = express.Router();
const { jiraSessions, rooms } = require('../state');
const { httpRequest }  = require('../utils');
const { adfToText, adfToHtml } = require('../ai');

function jiraFetch(session, apiPath) {
  const fullPath = `/ex/jira/${session.cloudId}${apiPath}`;
  return httpRequest('api.atlassian.com', `Bearer ${session.accessToken}`, 'GET', fullPath, null);
}

function jiraPut(session, apiPath, body) {
  return httpRequest('api.atlassian.com', `Bearer ${session.accessToken}`, 'PUT', `/ex/jira/${session.cloudId}${apiPath}`, body);
}

function jiraPost(session, apiPath, body) {
  return httpRequest('api.atlassian.com', `Bearer ${session.accessToken}`, 'POST', `/ex/jira/${session.cloudId}${apiPath}`, body);
}

// Returns true if a refresh was performed (so callers can sync updated tokens back to client)
async function refreshIfNeeded(session) {
  if (Date.now() < session.expiresAt - 5 * 60 * 1000) return false;
  if (!session.refreshToken) throw new Error('No refresh token — user must re-link Jira.');
  console.log('[jira oauth] access token expiring, refreshing…');
  const tokenRes = await httpRequest('auth.atlassian.com', null, 'POST', '/oauth/token', {
    grant_type:    'refresh_token',
    client_id:     process.env.ATLASSIAN_CLIENT_ID,
    client_secret: process.env.ATLASSIAN_CLIENT_SECRET,
    refresh_token: session.refreshToken,
  });
  if (tokenRes.status !== 200) throw new Error('Token refresh failed — user must re-link Jira.');
  const { access_token, refresh_token, expires_in } = JSON.parse(tokenRes.body);
  session.accessToken  = access_token;
  if (refresh_token) session.refreshToken = refresh_token;
  session.expiresAt    = Date.now() + (expires_in || 3600) * 1000;
  console.log(`[jira oauth] token refreshed, next expiry in ${expires_in || 3600}s`);
  return true;
}

function sessionSnapshot(session) {
  return { accessToken: session.accessToken, refreshToken: session.refreshToken, expiresAt: session.expiresAt, cloudId: session.cloudId, domain: session.domain };
}

function jiraRoute(method, route, handler) {
  router[method](route, async (req, res) => {
    const sessionId = req.headers['x-jira-session'];
    const session = jiraSessions[sessionId];
    console.log(`[jira route] ${method.toUpperCase()} ${route} sessionId=${sessionId?.slice(0,10)} found=${!!session}`);
    if (!session) return res.status(401).json({ error: 'Not authenticated with Jira.' });
    try {
      await refreshIfNeeded(session);
      await handler(req, res, session);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}

// ── Jira API proxy ──────────────────────────────────────────────────────────

jiraRoute('get', '/api/jira/projects', async (req, res, session) => {
  const { status, body } = await jiraFetch(session, '/rest/api/3/project?maxResults=50');
  console.log(`[jira projects] status=${status}`);
  if (status !== 200) { console.log('[jira projects] body=', body); return res.status(status).json({ error: `Jira returned ${status}` }); }
  const projects = (JSON.parse(body) || []).map(p => ({ id: p.id, key: p.key, name: p.name }));
  res.json({ projects });
});

jiraRoute('get', '/api/jira/issues', async (req, res, session) => {
  const projectKey = req.query.projectKey;
  if (!projectKey) return res.status(400).json({ error: 'projectKey required' });
  const filter = req.query.filter || 'all';
  let jql;
  if (filter === 'activeSprint') {
    jql = `project = "${projectKey}" AND sprint in openSprints() AND status not in (Done, Closed, Resolved) ORDER BY created DESC`;
  } else if (filter === 'backlog') {
    jql = `project = "${projectKey}" AND (sprint is EMPTY OR sprint not in openSprints()) AND status not in (Done, Closed, Resolved) ORDER BY created DESC`;
  } else {
    jql = `project = "${projectKey}" AND status not in (Done, Closed, Resolved) ORDER BY created DESC`;
  }

  const PAGE = 100;
  let nextPageToken = undefined;
  const allIssues = [];

  do {
    const searchBody = { jql, fields: ['summary', 'status', 'issuetype', 'labels', 'fixVersions', 'priority', 'parent', 'customfield_15945', 'customfield_15944', 'timetracking'], maxResults: PAGE };
    if (nextPageToken) searchBody.nextPageToken = nextPageToken;
    console.log(`[jira issues] fetching page token=${nextPageToken || 'first'}`);
    const { status, body } = await jiraPost(session, '/rest/api/3/search/jql', searchBody);
    if (status !== 200) { console.log('[jira issues] body=', body); return res.status(status).json({ error: `Jira returned ${status}`, detail: body }); }
    const parsed = JSON.parse(body);
    (parsed.issues || []).forEach(i => allIssues.push({
      key:             i.key,
      title:           `${i.key}: ${i.fields.summary}`,
      status:          i.fields.status?.name || '',
      type:            i.fields.issuetype?.name || '',
      labels:          i.fields.labels || [],
      fixVersions:     (i.fields.fixVersions || []).map(v => v.name),
      priority:        i.fields.priority?.name || '',
      epic:            i.fields.parent?.fields?.issuetype?.name === 'Epic' ? i.fields.parent?.key : '',
      devEstimate:     i.fields['customfield_15945'] != null ? String(i.fields['customfield_15945']) : '',
      qaEstimate:      i.fields['customfield_15944'] != null ? String(i.fields['customfield_15944']) : '',
      originalEstimate: i.fields.timetracking?.originalEstimateSeconds != null
        ? String(i.fields.timetracking.originalEstimateSeconds / 3600)
        : '',
    }));
    nextPageToken = parsed.nextPageToken;
  } while (nextPageToken);

  res.json({ issues: allIssues, total: allIssues.length });
});

// Full ticket details for a single issue
jiraRoute('get', '/api/jira/issue/:key', async (req, res, session) => {
  const key = req.params.key.toUpperCase();

  const { status, body } = await jiraFetch(session, `/rest/api/3/issue/${key}?fields=*all&expand=names`);
  if (status !== 200) return res.status(status).json({ error: `Jira returned ${status}` });

  const parsed = JSON.parse(body);
  const f      = parsed.fields;
  const names  = parsed.names || {}; // fieldId → display name

  // Skip fields that are objects/structures we handle explicitly or that are noise
  const SKIP_FIELDS = new Set([
    'summary','description','status','issuetype','priority','labels','fixVersions',
    'parent','subtasks','issuelinks','comment','attachment','assignee','reporter',
    'creator','created','updated','lastViewed','watches','votes','worklog','components',
    'environment','timetracking','timespent','timeestimate','timeoriginalestimate',
    'aggregatetimespent','aggregatetimeestimate','aggregatetimeoriginalestimate',
    'aggregateprogress','progress','versions','project','customfield_15945','customfield_15944',
  ]);

  // Build a lookup map: numeric ID and filename → attachment object
  // ADF media nodes use UUIDs (not numeric IDs), so we match by __fileName attr
  const attachmentMap = {};
  for (const a of (f.attachment || [])) {
    if (a.id)       attachmentMap[`id:${a.id}`]         = a;
    if (a.filename) attachmentMap[`fn:${a.filename}`]   = a;
  }

  // Collect extra ADF / text custom fields by display name
  const extraSections = [];
  for (const [fieldId, val] of Object.entries(f)) {
    if (SKIP_FIELDS.has(fieldId)) continue;
    if (val === null || val === undefined) continue;
    const label = names[fieldId];
    if (!label) continue;

    if (typeof val === 'object' && val.type === 'doc') {
      const text = adfToText(val).trim();
      if (text) extraSections.push({ label, fieldId, html: adfToHtml(val, attachmentMap), text });
    } else if (typeof val === 'string' && val.trim()) {
      extraSections.push({ label, fieldId, html: `<p>${val.trim().replace(/\n/g, '<br>')}</p>`, text: val.trim() });
    } else if (typeof val === 'number') {
      extraSections.push({ label, fieldId, html: `<p>${val}</p>`, text: String(val) });
    }
  }

  const description     = f.description ? adfToHtml(f.description, attachmentMap) : '';
  const descriptionText = f.description ? adfToText(f.description).trim() : '';

  const comments = (f.comment?.comments || []).slice(-10).map(c => ({
    author: c.author?.displayName || 'Unknown',
    html:   adfToHtml(c.body, attachmentMap),
    date:   c.created?.slice(0, 10),
  }));

  const attachments = (f.attachment || []).map(a => ({
    name:     a.filename,
    mimeType: a.mimeType || '',
    size:     a.size,
    id:       a.id,
    isImage:  /^image\//i.test(a.mimeType || ''),
  }));

  const linkedIssues = (f.issuelinks || []).map(l => {
    const linked = l.inwardIssue || l.outwardIssue;
    const dir    = l.inwardIssue ? l.type?.inward : l.type?.outward;
    return linked ? `${dir}: ${linked.key} — ${linked.fields?.summary || ''}` : null;
  }).filter(Boolean);

  const subtasks = (f.subtasks || []).map(s =>
    `${s.key}: ${s.fields?.summary || ''} [${s.fields?.status?.name || ''}]`
  );

  res.json({
    key,
    summary:         f.summary || '',
    description,
    descriptionText,
    extraSections,
    status:          f.status?.name || '',
    type:            f.issuetype?.name || '',
    priority:        f.priority?.name || '',
    labels:          f.labels || [],
    fixVersions:     (f.fixVersions || []).map(v => v.name),
    components:      (f.components || []).map(c => c.name),
    assignee:        f.assignee?.displayName || '',
    epic:            f.parent?.fields?.issuetype?.name === 'Epic' ? `${f.parent.key}: ${f.parent.fields?.summary || ''}` : '',
    devEstimate:     f['customfield_15945'] != null ? String(f['customfield_15945']) : '',
    qaEstimate:      f['customfield_15944'] != null ? String(f['customfield_15944']) : '',
    originalEstimate: f.timetracking?.originalEstimateSeconds != null
      ? String(f.timetracking.originalEstimateSeconds / 3600) : '',
    comments,
    attachments,
    linkedIssues,
    subtasks,
  });
});

// Proxy Jira attachment images — accepts numeric IDs and UUIDs (ADF media nodes use UUIDs)
router.get('/api/jira/attachment/:id', async (req, res) => {
  const { id } = req.params;
  if (!/^[\da-f-]+$/i.test(id)) return res.status(400).end();
  const sessionId = req.headers['x-jira-session'] || req.query.s;
  const session   = jiraSessions[sessionId];
  if (!session) return res.status(401).end();
  try {
    await refreshIfNeeded(session);
    const fullPath = `/ex/jira/${session.cloudId}/rest/api/3/attachment/content/${id}`;
    const { status, body, headers } = await httpRequest('api.atlassian.com', `Bearer ${session.accessToken}`, 'GET', fullPath, null, true);
    if (status !== 200) return res.status(status).end();
    const ct = headers?.['content-type'] || 'application/octet-stream';
    res.setHeader('Content-Type', ct);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.end(body);
  } catch (err) {
    res.status(500).end();
  }
});


// Room-proxied issue fetch — uses the room host's Jira session, no client auth required
router.get('/api/jira/room/:roomCode/issue/:key', async (req, res) => {
  const room = rooms[req.params.roomCode];
  if (!room) return res.status(404).json({ error: 'Room not found.' });
  const session = jiraSessions[room.jiraSessionId];
  if (!session) return res.status(401).json({ error: 'No Jira session linked to this room.' });
  // Re-use the existing issue handler logic by faking the session into req and calling the same logic
  try {
    await refreshIfNeeded(session);
    const key = req.params.key.toUpperCase();
    const { status, body } = await jiraFetch(session, `/rest/api/3/issue/${key}?fields=*all&expand=names`);
    if (status !== 200) return res.status(status).json({ error: `Jira returned ${status}` });
    const sessionId = room.jiraSessionId;
    const result = await (async () => {
      const parsed = JSON.parse(body);
      const f      = parsed.fields;
      const names  = parsed.names || {};
      const SKIP_FIELDS = new Set([
        'summary','description','status','issuetype','priority','labels','fixVersions',
        'parent','subtasks','issuelinks','comment','attachment','assignee','reporter',
        'creator','created','updated','lastViewed','watches','votes','worklog','components',
        'environment','timetracking','timespent','timeestimate','timeoriginalestimate',
        'aggregatetimespent','aggregatetimeestimate','aggregatetimeoriginalestimate',
        'aggregateprogress','progress','versions','project','customfield_15945','customfield_15944',
      ]);
      const attachmentMap = {};
      for (const a of (f.attachment || [])) {
        if (a.id)       attachmentMap[`id:${a.id}`]       = a;
        if (a.filename) attachmentMap[`fn:${a.filename}`] = a;
      }
      const extraSections = [];
      for (const [fieldId, val] of Object.entries(f)) {
        if (SKIP_FIELDS.has(fieldId)) continue;
        if (val === null || val === undefined) continue;
        const label = names[fieldId];
        if (!label) continue;
        if (typeof val === 'object' && val.type === 'doc') {
          const text = adfToText(val).trim();
          if (text) extraSections.push({ label, fieldId, html: adfToHtml(val, attachmentMap), text });
        } else if (typeof val === 'string' && val.trim()) {
          extraSections.push({ label, fieldId, html: `<p>${val.trim().replace(/\n/g, '<br>')}</p>`, text: val.trim() });
        } else if (typeof val === 'number') {
          extraSections.push({ label, fieldId, html: `<p>${val}</p>`, text: String(val) });
        }
      }
      const description     = f.description ? adfToHtml(f.description, attachmentMap) : '';
      const descriptionText = f.description ? adfToText(f.description).trim() : '';
      const comments = (f.comment?.comments || []).slice(-10).map(c => ({
        author: c.author?.displayName || 'Unknown',
        html:   adfToHtml(c.body, attachmentMap),
        date:   c.created?.slice(0, 10),
      }));
      const attachments = (f.attachment || []).map(a => ({
        name:     a.filename,
        mimeType: a.mimeType || '',
        size:     a.size,
        id:       a.id,
        isImage:  /^image\//i.test(a.mimeType || ''),
      }));
      const linkedIssues = (f.issuelinks || []).map(l => {
        const linked = l.inwardIssue || l.outwardIssue;
        const dir    = l.inwardIssue ? l.type?.inward : l.type?.outward;
        return linked ? `${dir}: ${linked.key} — ${linked.fields?.summary || ''}` : null;
      }).filter(Boolean);
      const subtasks = (f.subtasks || []).map(s =>
        `${s.key}: ${s.fields?.summary || ''} [${s.fields?.status?.name || ''}]`
      );
      return {
        key,
        summary:         f.summary || '',
        description,
        descriptionText,
        extraSections,
        status:          f.status?.name || '',
        type:            f.issuetype?.name || '',
        priority:        f.priority?.name || '',
        labels:          f.labels || [],
        fixVersions:     (f.fixVersions || []).map(v => v.name),
        components:      (f.components || []).map(c => c.name),
        assignee:        f.assignee?.displayName || '',
        epic:            f.parent?.fields?.issuetype?.name === 'Epic' ? `${f.parent.key}: ${f.parent.fields?.summary || ''}` : '',
        devEstimate:     f['customfield_15945'] != null ? String(f['customfield_15945']) : '',
        qaEstimate:      f['customfield_15944'] != null ? String(f['customfield_15944']) : '',
        originalEstimate: f.timetracking?.originalEstimateSeconds != null
          ? String(f.timetracking.originalEstimateSeconds / 3600) : '',
        comments,
        attachments,
        linkedIssues,
        subtasks,
        _roomSessionId: sessionId,
      };
    })();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Room-proxied attachment — uses the room host's Jira session, no client auth required
router.get('/api/jira/room/:roomCode/attachment/:id', async (req, res) => {
  const { id, roomCode } = req.params;
  if (!/^[\da-f-]+$/i.test(id)) return res.status(400).end();
  const room = rooms[roomCode];
  if (!room) return res.status(404).end();
  const session = jiraSessions[room.jiraSessionId];
  if (!session) return res.status(401).end();
  try {
    await refreshIfNeeded(session);
    const fullPath = `/ex/jira/${session.cloudId}/rest/api/3/attachment/content/${id}`;
    const { status, body, headers } = await httpRequest('api.atlassian.com', `Bearer ${session.accessToken}`, 'GET', fullPath, null, true);
    if (status !== 200) return res.status(status).end();
    const ct = headers?.['content-type'] || 'application/octet-stream';
    res.setHeader('Content-Type', ct);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.end(body);
  } catch {
    res.status(500).end();
  }
});

jiraRoute('post', '/api/jira/update-issue', async (req, res, session) => {
  const { issueKey, devEstimate, qaEstimate, originalEstimate } = req.body || {};
  if (!issueKey) return res.status(400).json({ error: 'issueKey required' });
  const toNum = v => (v !== '' && v !== null && v !== undefined) ? Number(v) : null;
  const fields = {};
  const devNum  = toNum(devEstimate);
  const qaNum   = toNum(qaEstimate);
  const origNum = toNum(originalEstimate);
  if (devNum  !== null) fields['customfield_15945'] = devNum;
  if (qaNum   !== null) fields['customfield_15944'] = qaNum;
  if (origNum !== null) fields['timetracking'] = { originalEstimate: `${origNum}h` };
  const { status, body } = await jiraPut(session, `/rest/api/3/issue/${issueKey}`, { fields });
  if (status !== 204) return res.status(status).json({ error: `Jira returned ${status}`, detail: body });
  res.json({ ok: true });
});

// Update a single field (summary, description, or any ADF/text custom field)
jiraRoute('post', '/api/jira/update-field', async (req, res, session) => {
  const { issueKey, fieldId, text, adf } = req.body || {};
  if (!issueKey || !fieldId || (text === undefined && adf === undefined))
    return res.status(400).json({ error: 'issueKey, fieldId, and text or adf required' });

  let value;
  if (fieldId === 'summary') {
    value = String(text ?? '').slice(0, 255);
  } else if (adf && typeof adf === 'object') {
    value = adf; // client sent fully-formed ADF — use as-is
  } else {
    // Fallback: convert plain text to ADF paragraphs
    const paragraphs = String(text).split('\n').map(line => ({
      type: 'paragraph',
      content: line.trim() ? [{ type: 'text', text: line }] : [],
    }));
    value = { version: 1, type: 'doc', content: paragraphs };
  }

  const { status, body } = await jiraPut(session, `/rest/api/3/issue/${issueKey}`, { fields: { [fieldId]: value } });
  if (status !== 204) return res.status(status).json({ error: `Jira returned ${status}`, detail: body });
  res.json({ ok: true });
});

// Add a comment to an issue
jiraRoute('post', '/api/jira/comment', async (req, res, session) => {
  const { issueKey, text } = req.body || {};
  if (!issueKey || !text?.trim()) return res.status(400).json({ error: 'issueKey and text required' });

  const body = {
    body: {
      version: 1, type: 'doc',
      content: String(text).split('\n').map(line => ({
        type: 'paragraph',
        content: line.trim() ? [{ type: 'text', text: line }] : [],
      })),
    },
  };
  const { status, body: resBody } = await jiraPost(session, `/rest/api/3/issue/${issueKey}/comment`, body);
  if (status !== 201) return res.status(status).json({ error: `Jira returned ${status}`, detail: resBody });
  const c = JSON.parse(resBody);
  res.json({ author: c.author?.displayName || 'You', date: c.created?.slice(0, 10), text: text.trim() });
});

module.exports = { router, refreshIfNeeded, sessionSnapshot };
