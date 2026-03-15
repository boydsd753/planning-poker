'use strict';

const express = require('express');
const router  = express.Router();
const { jiraSessions } = require('../state');
const { httpRequest }  = require('../utils');

function jiraFetch(session, apiPath) {
  const fullPath = `/ex/jira/${session.cloudId}${apiPath}`;
  console.log(`[jira fetch] GET https://api.atlassian.com${fullPath}`);
  console.log(`[jira fetch] token: Bearer ${session.accessToken.slice(0, 40)}...`);
  return httpRequest('api.atlassian.com', `Bearer ${session.accessToken}`, 'GET', fullPath, null);
}

function jiraPut(session, apiPath, body) {
  return httpRequest('api.atlassian.com', `Bearer ${session.accessToken}`, 'PUT', `/ex/jira/${session.cloudId}${apiPath}`, body);
}

function jiraPost(session, apiPath, body) {
  return httpRequest('api.atlassian.com', `Bearer ${session.accessToken}`, 'POST', `/ex/jira/${session.cloudId}${apiPath}`, body);
}

async function refreshIfNeeded(session) {
  // Refresh when within 5 minutes of expiry
  if (Date.now() < session.expiresAt - 5 * 60 * 1000) return;
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
  if (refresh_token) session.refreshToken = refresh_token; // Atlassian may rotate it
  session.expiresAt    = Date.now() + (expires_in || 3600) * 1000;
  console.log(`[jira oauth] token refreshed, next expiry in ${expires_in || 3600}s`);
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

module.exports = router;
