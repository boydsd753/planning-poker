require('dotenv').config();
const express = require('express');
const http = require('http');
const https = require('https');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ── Security Headers ─────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    "connect-src 'self' wss: ws:",
    "frame-ancestors 'none'",
  ].join('; '));
  next();
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/health', (req, res) => res.sendStatus(200));
app.get('/privacy', (req, res) => res.sendFile(path.join(__dirname, 'public', 'privacy.html')));

// ── Jira OAuth ──────────────────────────────────────────────────────────────
const jiraSessions = {}; // sessionId → { accessToken, cloudId, domain }

function httpRequest(hostname, authHeader, method, path, body) {
  console.log(`[http] ${method} https://${hostname}${path}`);
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const headers = { Accept: 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;
    if (bodyStr) { headers['Content-Type'] = 'application/json'; headers['Content-Length'] = Buffer.byteLength(bodyStr); }
    const req = https.request({ hostname, path, method, headers }, res => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

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
  app[method](route, async (req, res) => {
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

// OAuth — redirect to Atlassian login
app.get('/auth/jira', (req, res) => {
  const state = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  jiraSessions[`state_${state}`] = { expires: Date.now() + 5 * 60 * 1000 };
  const scopes = 'read:jira-work write:jira-work read:issue:jira write:issue:jira read:issue-details:jira offline_access';
  const redirectUri = `${process.env.APP_URL}/auth/jira/callback`;
  const url = `https://auth.atlassian.com/authorize?audience=api.atlassian.com`
    + `&client_id=${process.env.ATLASSIAN_CLIENT_ID}`
    + `&scope=${encodeURIComponent(scopes)}`
    + `&redirect_uri=${encodeURIComponent(redirectUri)}`
    + `&state=${state}&response_type=code&prompt=consent`;
  res.redirect(url);
});

// OAuth — Atlassian redirects back here with code
app.get('/auth/jira/callback', async (req, res) => {
  const { code, state, error } = req.query;
  const stateKey = `state_${state}`;

  const fail = msg => res.send(`<script>window.opener?.postMessage({jiraError:${JSON.stringify(msg)}},location.origin);window.close();</script>`);

  if (error) return fail(error);
  if (!jiraSessions[stateKey] || jiraSessions[stateKey].expires < Date.now()) return fail('Invalid or expired state.');
  delete jiraSessions[stateKey];

  try {
    // Exchange code for access token
    const redirectUri = `${process.env.APP_URL}/auth/jira/callback`;
    const tokenRes = await httpRequest('auth.atlassian.com', null, 'POST', '/oauth/token', {
      grant_type: 'authorization_code',
      client_id: process.env.ATLASSIAN_CLIENT_ID,
      client_secret: process.env.ATLASSIAN_CLIENT_SECRET,
      code, redirect_uri: redirectUri,
    });
    if (tokenRes.status !== 200) return fail('Token exchange failed.');
    const { access_token, refresh_token, expires_in } = JSON.parse(tokenRes.body);

    // Get their Jira cloud ID + domain
    const resourcesRes = await httpRequest('api.atlassian.com', `Bearer ${access_token}`, 'GET', '/oauth/token/accessible-resources', null);
    const resources = JSON.parse(resourcesRes.body);
    if (!resources.length) return fail('No Jira sites found for this account.');
    const { id: cloudId, url } = resources[0];
    const domain = url.replace('https://', '');
    // Decode JWT payload to log granted scopes
    try {
      const payload = JSON.parse(Buffer.from(access_token.split('.')[1], 'base64url').toString());
      console.log(`[jira oauth] granted scopes:`, payload.scope || payload.scp || '(none found)');
    } catch {}
    console.log(`[jira oauth] cloudId=${cloudId} domain=${domain} token_length=${access_token?.length}`);

    // Store session
    const sessionId = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    jiraSessions[sessionId] = {
      accessToken:  access_token,
      refreshToken: refresh_token || null,
      expiresAt:    Date.now() + (expires_in || 3600) * 1000,
      cloudId,
      domain,
    };

    res.send(`<script>window.opener?.postMessage({jiraSession:${JSON.stringify(sessionId)},jiraDomain:${JSON.stringify(domain)}},location.origin);window.close();</script>`);
  } catch (err) {
    fail(err.message);
  }
});

// ── Jira API proxy ──────────────────────────────────────────────────────────
jiraRoute('get', '/api/jira/projects', async (req, res, session) => {
  const { status, body } = await jiraFetch(session, '/rest/api/3/project?maxResults=50');
  console.log(`[jira projects] status=${status}`);
  if (status !== 200) { console.log('[jira projects] body=', body); return res.status(status).json({ error: `Jira returned ${status}` }); }
  const projects = (JSON.parse(body) || []).map(p => ({ id: p.id, key: p.key, name: p.name }));
  res.json({ projects });
});

jiraRoute('get', '/api/jira/issues', async (req, res, session) => {
  const maxResults = Math.min(Number(req.query.maxResults) || 100, 100);
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

  const searchBody = { jql, fields: ['summary', 'status', 'issuetype'], maxResults };
  console.log(`[jira issues] POST /rest/api/3/search jql=${jql}`);
  const { status, body } = await jiraPost(session, '/rest/api/3/search/jql', searchBody);
  console.log(`[jira issues] status=${status} body=${body}`);
  if (status !== 200) { console.log('[jira issues] body=', body); return res.status(status).json({ error: `Jira returned ${status}`, detail: body }); }
  const parsed = JSON.parse(body);
  const issues = (parsed.issues || []).map(i => ({
    key:    i.key,
    title:  `${i.key}: ${i.fields.summary}`,
    status: i.fields.status?.name || '',
    type:   i.fields.issuetype?.name || '',
  }));
  res.json({ issues, total: parsed.total });
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

const rooms = {};

const DEFAULT_SETTINGS = {
  gameName:     '',
  deck:         'fibonacci',
  whoCanReveal: 'host',
  autoReveal:   false,
  showAverage:  true,
  countdown:    true,
};

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function sanitizeSettings(raw = {}) {
  return {
    gameName:     String(raw.gameName    ?? DEFAULT_SETTINGS.gameName).trim().slice(0, 60),
    deck:         ['fibonacci','modified','tshirt','powers2','sequential'].includes(raw.deck)
                    ? raw.deck : DEFAULT_SETTINGS.deck,
    whoCanReveal: ['host','all'].includes(raw.whoCanReveal) ? raw.whoCanReveal : DEFAULT_SETTINGS.whoCanReveal,
    autoReveal:   Boolean(raw.autoReveal  ?? DEFAULT_SETTINGS.autoReveal),
    showAverage:  Boolean(raw.showAverage ?? DEFAULT_SETTINGS.showAverage),
    countdown:    Boolean(raw.countdown   ?? DEFAULT_SETTINGS.countdown),
  };
}

io.on('connection', (socket) => {
  console.log(`[connect]    ${socket.id}`);

  socket.on('create-room', ({ name, settings, role }) => {
    let roomCode;
    do { roomCode = generateRoomCode(); } while (rooms[roomCode]);

    rooms[roomCode] = {
      id: roomCode,
      players: {},
      revealed: false,
      settings: sanitizeSettings(settings),
      timer: { running: false, startedAt: null, elapsed: 0 },
      issues: [],
      activeIssueId: null,
    };

    rooms[roomCode].players[socket.id] = {
      id: socket.id,
      name: String(name).trim().slice(0, 20) || 'Anonymous',
      card: null,
      isAdmin: true,
      isSpectator: false,
      role: ['dev','qa'].includes(role) ? role : 'dev',
    };

    socket.join(roomCode);
    socket.roomCode = roomCode;
    socket.emit('room-joined', { roomCode });
    io.to(roomCode).emit('room-update', rooms[roomCode]);
    console.log(`[create]     ${socket.id} created ${roomCode}`);
  });

  socket.on('join-room', ({ name, roomCode, isSpectator, role }) => {
    const code = String(roomCode).toUpperCase().trim();
    const room = rooms[code];
    if (!room) { socket.emit('error-msg', 'Room not found. Check the code and try again.'); return; }

    room.players[socket.id] = {
      id: socket.id,
      name: String(name).trim().slice(0, 20) || 'Anonymous',
      card: null,
      isAdmin: false,
      isSpectator: Boolean(isSpectator),
      role: ['dev','qa'].includes(role) ? role : 'dev',
    };

    socket.join(code);
    socket.roomCode = code;
    socket.emit('room-joined', { roomCode: code });
    io.to(code).emit('room-update', room);
    console.log(`[join]       ${socket.id} joined ${code}${isSpectator ? ' (spectator)' : ''}`);
  });

  socket.on('select-card', ({ card }) => {
    const room = rooms[socket.roomCode];
    if (!room || room.revealed) return;
    const player = room.players[socket.id];
    if (!player || player.isSpectator) return;
    player.card = player.card === card ? null : card;
    io.to(socket.roomCode).emit('room-update', room);

    if (room.settings.autoReveal && !room.revealed) {
      const voters = Object.values(room.players).filter(p => !p.isSpectator);
      if (voters.length > 0 && voters.every(p => p.card !== null)) {
        setTimeout(() => {
          if (rooms[socket.roomCode] && !rooms[socket.roomCode].revealed) {
            rooms[socket.roomCode].revealed = true;
            io.to(socket.roomCode).emit('room-update', rooms[socket.roomCode]);
          }
        }, 800);
      }
    }
  });

  socket.on('reveal-cards', () => {
    const room = rooms[socket.roomCode];
    if (!room) return;
    const player = room.players[socket.id];
    const canReveal = player?.isAdmin || room.settings.whoCanReveal === 'all';
    if (!canReveal) return;
    room.revealed = true;
    io.to(socket.roomCode).emit('room-update', room);
  });

  socket.on('new-round', () => {
    const room = rooms[socket.roomCode];
    if (!room) return;
    const player = room.players[socket.id];
    const canReveal = player?.isAdmin || room.settings.whoCanReveal === 'all';
    if (!canReveal) return;
    room.revealed = false;
    Object.values(room.players).forEach(p => { p.card = null; });
    // Reset timer on new round
    room.timer = { running: false, startedAt: null, elapsed: 0 };
    io.to(socket.roomCode).emit('room-update', room);
  });

  // ── Timer ──────────────────────────────────────────────────────────────────
  socket.on('timer-start', () => {
    const room = rooms[socket.roomCode];
    if (!room || room.timer.running) return;
    room.timer.running = true;
    room.timer.startedAt = Date.now();
    io.to(socket.roomCode).emit('room-update', room);
  });

  socket.on('timer-pause', () => {
    const room = rooms[socket.roomCode];
    if (!room || !room.timer.running) return;
    room.timer.elapsed += Date.now() - room.timer.startedAt;
    room.timer.running = false;
    room.timer.startedAt = null;
    io.to(socket.roomCode).emit('room-update', room);
  });

  socket.on('timer-reset', () => {
    const room = rooms[socket.roomCode];
    if (!room) return;
    room.timer = { running: false, startedAt: null, elapsed: 0 };
    io.to(socket.roomCode).emit('room-update', room);
  });

  // ── Issues ─────────────────────────────────────────────────────────────────
  socket.on('add-issue', ({ title, jiraKey }) => {
    const room = rooms[socket.roomCode];
    if (!room) return;
    const t = String(title).trim().slice(0, 200);
    if (!t) return;
    const issue = { id: generateId(), title: t, jiraKey: jiraKey || null, devEstimate: null, qaEstimate: null };
    room.issues.push(issue);
    if (!room.activeIssueId) room.activeIssueId = issue.id;
    io.to(socket.roomCode).emit('room-update', room);
  });

  socket.on('delete-issue', ({ id }) => {
    const room = rooms[socket.roomCode];
    if (!room) return;
    room.issues = room.issues.filter(i => i.id !== id);
    if (room.activeIssueId === id) {
      room.activeIssueId = room.issues[0]?.id || null;
    }
    io.to(socket.roomCode).emit('room-update', room);
  });

  socket.on('set-active-issue', ({ id }) => {
    const room = rooms[socket.roomCode];
    if (!room) return;
    if (room.issues.find(i => i.id === id)) {
      room.activeIssueId = id;
      // Start a new round when switching issues
      room.revealed = false;
      Object.values(room.players).forEach(p => { p.card = null; });
      room.timer = { running: false, startedAt: null, elapsed: 0 };
      io.to(socket.roomCode).emit('room-update', room);
    }
  });

  socket.on('save-team-estimate', ({ id, team, estimate }) => {
    const room = rooms[socket.roomCode];
    if (!room) return;
    const issue = room.issues.find(i => i.id === id);
    if (issue && ['dev','qa'].includes(team)) {
      issue[team === 'dev' ? 'devEstimate' : 'qaEstimate'] = String(estimate).slice(0, 20);
      io.to(socket.roomCode).emit('room-update', room);
    }
  });

  socket.on('transfer-host', ({ toId }) => {
    const room = rooms[socket.roomCode];
    if (!room) return;
    const from = room.players[socket.id];
    if (!from?.isAdmin) return;
    const to = room.players[toId];
    if (!to) return;
    from.isAdmin = false;
    to.isAdmin = true;
    io.to(socket.roomCode).emit('room-update', room);
  });

  // ── Disconnect ─────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    const { roomCode } = socket;
    if (!roomCode || !rooms[roomCode]) return;
    const room = rooms[roomCode];
    const wasAdmin = room.players[socket.id]?.isAdmin;
    delete room.players[socket.id];
    const remaining = Object.values(room.players);
    if (remaining.length === 0) { delete rooms[roomCode]; return; }
    if (wasAdmin) remaining[0].isAdmin = true;
    io.to(roomCode).emit('room-update', room);
  });
});

app.use((req, res) => res.status(404).sendFile(path.join(__dirname, 'public', '404.html')));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => { console.log(`\n  Planning Poker → http://localhost:${PORT}\n`); });
