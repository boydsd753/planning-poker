'use strict';

const { rooms, sessions, jiraSessions, stats }       = require('../state');
const { generateId, sanitizeSettings }               = require('../utils');
const { generateRoomCode }                           = require('../utils');
const { estimateIssue }                              = require('../ai');
const { refreshIfNeeded, sessionSnapshot }           = require('../routes/jira');
const { scheduleSave, saveRoomNow, saveSession, deleteSession, deleteRoom } = require('../db');

module.exports = function registerHandlers(io) {

  io.on('connection', (socket) => {
    console.log(`[connect]    ${socket.id}`);

    // Helper: emit room-update AND schedule a DB save
    function roomUpdate(code, room, meta) {
      if (meta) io.to(code).emit('room-update', room, meta);
      else       io.to(code).emit('room-update', room);
      scheduleSave(code);
    }

    function sanitizeAvatar(raw) {
      if (typeof raw !== 'string') return null;
      const allowed = ['data:image/jpeg;base64,', 'data:image/png;base64,', 'data:image/webp;base64,'];
      if (!allowed.some(prefix => raw.startsWith(prefix))) return null;
      if (raw.length > 30000) return null; // ~22KB decoded, enough for 64x64 JPEG
      return raw;
    }

    socket.on('create-room', ({ name, settings, role, isSpectator, avatar }) => {
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
        dealersHidden: true,
      };

      const player = {
        id: socket.id,
        name: String(name).trim().slice(0, 20) || 'Anonymous',
        avatar: sanitizeAvatar(avatar),
        card: null,
        isAdmin: true,
        isSpectator: Boolean(isSpectator),
        role: ['dev','qa','spectator'].includes(role) ? role : 'dev',
      };
      rooms[roomCode].players[socket.id] = player;

      const token = generateId() + generateId();
      sessions[token] = { roomCode, playerData: player };
      socket.sessionToken = token;

      socket.join(roomCode);
      socket.roomCode = roomCode;
      socket.emit('room-joined', { roomCode, sessionToken: token });
      roomUpdate(roomCode, rooms[roomCode]);
      saveRoomNow(roomCode, rooms[roomCode]).then(() => saveSession(token, roomCode, player));
      console.log(`[create]     ${socket.id} created ${roomCode}`);
    });

    socket.on('join-room', ({ name, roomCode, isSpectator, role, avatar }) => {
      const code = String(roomCode).toUpperCase().trim();
      const room = rooms[code];
      if (!room) { socket.emit('error-msg', 'Room not found. Check the code and try again.'); return; }

      const player = {
        id: socket.id,
        name: String(name).trim().slice(0, 20) || 'Anonymous',
        avatar: sanitizeAvatar(avatar),
        card: null,
        isAdmin: false,
        isSpectator: Boolean(isSpectator),
        role: ['dev','qa','spectator'].includes(role) ? role : 'dev',
      };
      room.players[socket.id] = player;

      const token = generateId() + generateId();
      sessions[token] = { roomCode: code, playerData: player };
      socket.sessionToken = token;

      socket.join(code);
      socket.roomCode = code;
      socket.emit('room-joined', { roomCode: code, sessionToken: token });
      roomUpdate(code, room);
      saveRoomNow(code, room).then(() => saveSession(token, code, player));
      const totalNow = Object.values(rooms).reduce((s, r) => s + Object.keys(r.players).length, 0);
      if (totalNow > stats.peakPlayers) stats.peakPlayers = totalNow;
      console.log(`[join]       ${socket.id} joined ${code}${isSpectator ? ' (spectator)' : ''}`);
    });

    socket.on('rejoin-room', ({ sessionToken }) => {
      const session = sessions[sessionToken];
      if (!session) { socket.emit('error-msg', 'Session expired. Please rejoin manually.'); return; }

      const { roomCode, playerData } = session;
      const room = rooms[roomCode];
      if (!room) {
        delete sessions[sessionToken];
        deleteSession(sessionToken);
        socket.emit('error-msg', 'Room no longer exists.');
        return;
      }

      // Cancel pending disconnect removal if any
      if (session.disconnectTimer) { clearTimeout(session.disconnectTimer); session.disconnectTimer = null; }

      // Remove ALL slots for this player (guards against duplicates from edge-case double-rejoin)
      Object.keys(room.players).forEach(id => {
        if (room.players[id] === playerData) delete room.players[id];
      });
      const oldId = playerData.id;
      if (room.players[oldId]) delete room.players[oldId];
      playerData.id = socket.id;
      room.players[socket.id] = playerData;
      session.playerData = playerData;
      socket.sessionToken = sessionToken;

      socket.join(roomCode);
      socket.roomCode = roomCode;
      socket.emit('room-joined', { roomCode, sessionToken });
      // Pass oldId+newId so clients can suppress the spurious "left"/"joined" toasts
      roomUpdate(roomCode, room, { _silentRejoin: { oldId, newId: socket.id } });
      saveSession(sessionToken, roomCode, playerData);
      console.log(`[rejoin]     ${socket.id} rejoined ${roomCode} (was ${oldId})`);
    });

    socket.on('select-card', ({ card }) => {
      const room = rooms[socket.roomCode];
      if (!room || room.revealed) return;
      const player = room.players[socket.id];
      if (!player || player.isSpectator) return;
      player.card = player.card === card ? null : card;
      roomUpdate(socket.roomCode, room);

      if (room.settings.autoReveal && !room.revealed) {
        const voters = Object.values(room.players).filter(p => !p.isSpectator);
        if (voters.length > 0 && voters.every(p => p.card !== null)) {
          setTimeout(() => {
            const r = rooms[socket.roomCode];
            if (r && !r.revealed) {
              r.revealed = true;
              roomUpdate(socket.roomCode, r);
              // Per-team AI card majority on auto-reveal
              const activeIssue = r.issues.find(i => i.id === r.activeIssueId);
              if (activeIssue?.jiraKey && r.jiraSessionId) {
                const devV   = Object.values(r.players).filter(p => !p.isSpectator && p.role === 'dev' && p.card !== null);
                const qaV    = Object.values(r.players).filter(p => !p.isSpectator && p.role === 'qa'  && p.card !== null);
                const dAiMaj = devV.length > 0 && devV.filter(p => p.card === '__ai__').length > devV.length / 2;
                const qAiMaj = qaV.length  > 0 && qaV.filter(p => p.card === '__ai__').length  > qaV.length  / 2;
                const dDone  = activeIssue.aiEstimatedDev || activeIssue.aiEstimated;
                const qDone  = activeIssue.aiEstimatedQa  || activeIssue.aiEstimated;
                const t      = (dAiMaj && !dDone && qAiMaj && !qDone) ? 'both'
                             : (dAiMaj && !dDone) ? 'dev' : (qAiMaj && !qDone) ? 'qa' : null;
                if (t) {
                  const pc = t === 'both' ? devV.length + qaV.length : t === 'dev' ? devV.length : qaV.length;
                  io.to(socket.roomCode).emit('ai-card-majority', { issueKey: activeIssue.jiraKey, playerCount: pc, team: t });
                }
              }
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
      roomUpdate(socket.roomCode, room);

      // Per-team AI card majority check
      const activeIssue = room.issues.find(i => i.id === room.activeIssueId);
      if (activeIssue?.jiraKey && room.jiraSessionId) {
        const devVoters = Object.values(room.players).filter(p => !p.isSpectator && p.role === 'dev' && p.card !== null);
        const qaVoters  = Object.values(room.players).filter(p => !p.isSpectator && p.role === 'qa'  && p.card !== null);
        const devAiMaj  = devVoters.length > 0 && devVoters.filter(p => p.card === '__ai__').length > devVoters.length / 2;
        const qaAiMaj   = qaVoters.length  > 0 && qaVoters.filter(p => p.card === '__ai__').length  > qaVoters.length  / 2;
        const devDone   = activeIssue.aiEstimatedDev || activeIssue.aiEstimated;
        const qaDone    = activeIssue.aiEstimatedQa  || activeIssue.aiEstimated;
        const team      = (devAiMaj && !devDone && qaAiMaj && !qaDone) ? 'both'
                        : (devAiMaj && !devDone) ? 'dev'
                        : (qaAiMaj  && !qaDone)  ? 'qa' : null;
        if (team) {
          const playerCount = team === 'both' ? devVoters.length + qaVoters.length
                            : team === 'dev'  ? devVoters.length : qaVoters.length;
          io.to(socket.roomCode).emit('ai-card-majority', { issueKey: activeIssue.jiraKey, playerCount, team });
        }
      }
    });

    socket.on('new-round', () => {
      const room = rooms[socket.roomCode];
      if (!room) return;
      const player = room.players[socket.id];
      const canReveal = player?.isAdmin || room.settings.whoCanReveal === 'all';
      if (!canReveal) return;
      stats.roundsCompleted++;
      room.revealed = false;
      Object.values(room.players).forEach(p => { p.card = null; });
      room.timer = { running: false, startedAt: null, elapsed: 0 };
      roomUpdate(socket.roomCode, room);
    });

    // ── Timer ──────────────────────────────────────────────────────────────────
    socket.on('timer-start', () => {
      const room = rooms[socket.roomCode];
      if (!room || room.timer.running) return;
      room.timer.running = true;
      room.timer.startedAt = Date.now();
      room.timer.duration = room.settings.timerDuration || 120;
      roomUpdate(socket.roomCode, room);
    });

    socket.on('timer-pause', () => {
      const room = rooms[socket.roomCode];
      if (!room || !room.timer.running) return;
      room.timer.elapsed += Date.now() - room.timer.startedAt;
      room.timer.running = false;
      room.timer.startedAt = null;
      roomUpdate(socket.roomCode, room);
    });

    socket.on('timer-reset', () => {
      const room = rooms[socket.roomCode];
      if (!room) return;
      room.timer = { running: false, startedAt: null, elapsed: 0, duration: room.settings.timerDuration || 120 };
      roomUpdate(socket.roomCode, room);
    });

    // ── Issues ─────────────────────────────────────────────────────────────────
    socket.on('add-issue', ({ title, jiraKey, devEstimate, qaEstimate, originalEstimate }) => {
      const room = rooms[socket.roomCode];
      if (!room) return;
      const t = String(title).trim().slice(0, 200);
      if (!t) return;
      const issue = { id: generateId(), title: t, jiraKey: jiraKey || null, devEstimate: devEstimate || null, qaEstimate: qaEstimate || null, originalEstimate: originalEstimate || null };
      room.issues.push(issue);
      if (!room.activeIssueId) room.activeIssueId = issue.id;
      roomUpdate(socket.roomCode, room);
    });

    socket.on('delete-issue', ({ id }) => {
      const room = rooms[socket.roomCode];
      if (!room) return;
      room.issues = room.issues.filter(i => i.id !== id);
      if (room.activeIssueId === id) {
        room.activeIssueId = room.issues[0]?.id || null;
      }
      roomUpdate(socket.roomCode, room);
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
        roomUpdate(socket.roomCode, room);
      }
    });

    socket.on('save-team-estimate', ({ id, team, estimate }) => {
      const room = rooms[socket.roomCode];
      if (!room) return;
      const issue = room.issues.find(i => i.id === id);
      if (issue && ['dev','qa'].includes(team)) {
        const val = estimate === '' || estimate === null || estimate === undefined ? null : String(estimate).slice(0, 20);
        issue[team === 'dev' ? 'devEstimate' : 'qaEstimate'] = val;
        roomUpdate(socket.roomCode, room);
      }
    });

    socket.on('mark-issue-estimated', ({ id }) => {
      const room = rooms[socket.roomCode];
      if (!room) return;
      const issue = room.issues.find(i => i.id === id);
      if (issue) {
        issue.savedToJira = true;
        roomUpdate(socket.roomCode, room);
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
      roomUpdate(socket.roomCode, room);
    });

    // ── Toggle dealers (host = all, player = local only via client) ────────────
    socket.on('toggle-dealers', () => {
      const room = rooms[socket.roomCode];
      if (!room) return;
      const player = room.players[socket.id];
      if (!player?.isAdmin) return;
      room.dealersHidden = !room.dealersHidden;
      roomUpdate(socket.roomCode, room);
    });

    // ── Reactions ──────────────────────────────────────────────────────────────
    const ALLOWED_REACTIONS = new Set(['👍','👎','❤️','😂','😮','🤔','☕','🎉','sergio','danan','parrot','party_blob','elmo_money','this_is_fine','spongebob','smart','rage','success','poop','rage_poop','poop_fire','poop_sob','sad_poop','outrage']);
    socket.on('react', ({ emoji }) => {
      if (!ALLOWED_REACTIONS.has(emoji)) return;
      if (!socket.roomCode) return;
      io.to(socket.roomCode).emit('reaction', { playerId: socket.id, emoji });
    });

    socket.on('emoji-throw', ({ emoji, fromX, fromY, toX, toY }) => {
      if (!ALLOWED_REACTIONS.has(emoji)) return;
      if (!socket.roomCode) return;
      const clamp = v => Math.max(0, Math.min(1, Number(v) || 0));
      io.to(socket.roomCode).emit('emoji-throw', { emoji, fromX: clamp(fromX), fromY: clamp(fromY), toX: clamp(toX), toY: clamp(toY) });
    });

    // ── Jira session linking ────────────────────────────────────────────────────
    socket.on('link-jira-session', ({ jiraSessionId }) => {
      const room = rooms[socket.roomCode];
      if (!room || !jiraSessions[jiraSessionId]) return;
      room.jiraSessionId = jiraSessionId;
    });

    // ── Jira session restore (after server restart) ─────────────────────────────
    socket.on('restore-jira-session', async ({ sessionId, accessToken, refreshToken, expiresAt, cloudId, domain }) => {
      if (!sessionId || !accessToken || !cloudId) return;
      // Rebuild the in-memory session from client-stored tokens
      jiraSessions[sessionId] = { accessToken, refreshToken: refreshToken || null, expiresAt: expiresAt || 0, cloudId, domain };
      try {
        const refreshed = await refreshIfNeeded(jiraSessions[sessionId]);
        const snap = sessionSnapshot(jiraSessions[sessionId]);
        // If refresh rotated tokens, send updated ones back so client saves them
        if (refreshed) socket.emit('jira-tokens-updated', snap);
        socket.emit('jira-session-restored', snap);
        // Re-link to the room if host is already in one
        const room = rooms[socket.roomCode];
        if (room) room.jiraSessionId = sessionId;
      } catch (err) {
        // Refresh token expired or invalid — client must re-auth
        delete jiraSessions[sessionId];
        socket.emit('jira-session-invalid');
      }
    });

    // ── AI Estimation ──────────────────────────────────────────────────────────
    socket.on('ai-estimate', async ({ issueKey, jiraSessionId, team = 'both' }) => {
      const room = rooms[socket.roomCode];
      if (!room) return;
      const player = room.players[socket.id];
      if (!player?.isAdmin) return;

      const session = jiraSessions[jiraSessionId] || jiraSessions[room.jiraSessionId];
      if (!session) { socket.emit('ai-estimate-error', { error: 'Not authenticated with Jira' }); return; }

      const validTeam = ['dev','qa','both'].includes(team) ? team : 'both';
      const issue = room.issues.find(i => i.jiraKey === issueKey);

      // Guard per-team: skip if already done for requested team (support legacy aiEstimated flag too)
      const devDone = issue?.aiEstimatedDev || issue?.aiEstimated;
      const qaDone  = issue?.aiEstimatedQa  || issue?.aiEstimated;
      if (validTeam === 'dev'  && devDone) { socket.emit('ai-estimate-error', { error: 'Dev AI estimate already run' }); return; }
      if (validTeam === 'qa'   && qaDone)  { socket.emit('ai-estimate-error', { error: 'QA AI estimate already run' });  return; }
      if (validTeam === 'both' && devDone && qaDone) { socket.emit('ai-estimate-error', { error: 'AI estimates already run for this ticket' }); return; }

      io.to(socket.roomCode).emit('ai-estimate-loading', { team: validTeam });

      try {
        const result = await estimateIssue(session, issueKey, validTeam);

        if (!result.insufficient && issue) {
          if (result.dev !== null) { issue.devEstimate = String(result.dev); issue.aiEstimatedDev = true; }
          if (result.qa  !== null) { issue.qaEstimate  = String(result.qa);  issue.aiEstimatedQa  = true; }
          if (issue.aiEstimatedDev && issue.aiEstimatedQa) {
            issue.originalEstimate = String((Number(issue.devEstimate) || 0) + (Number(issue.qaEstimate) || 0));
          }
        }

        stats.aiEstimatesTotal++;
        if (result.insufficient) stats.aiEstimatesInsufficient++;
        stats.aiTokensInput  += result.usage?.input  || 0;
        stats.aiTokensOutput += result.usage?.output || 0;
        if (result.usage?.rateLimits) stats.aiRateLimits = result.usage.rateLimits;
        io.to(socket.roomCode).emit('ai-estimate-result', result);
        if (!result.insufficient) roomUpdate(socket.roomCode, room);
        console.log(`[ai-estimate] ${issueKey} team:${validTeam} insufficient:${!!result.insufficient} → dev:${result.dev}h qa:${result.qa}h`);
      } catch (err) {
        stats.aiEstimatesErrors++;
        console.error('[ai-estimate] error:', err.message);
        io.to(socket.roomCode).emit('ai-estimate-error', { error: err.message });
      }
    });

    // ── Disconnect ─────────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      const { roomCode } = socket;
      if (!roomCode || !rooms[roomCode]) return;
      const room = rooms[roomCode];
      const token = socket.sessionToken;

      // Give the client 2 hours to rejoin before removing them
      const timer = setTimeout(() => {
        if (!rooms[roomCode]) return;
        const wasAdmin = room.players[socket.id]?.isAdmin;
        delete room.players[socket.id];
        if (token) {
          delete sessions[token];
          deleteSession(token);
        }
        const remaining = Object.values(room.players);
        if (remaining.length === 0) {
          if (room.jiraSessionId) delete jiraSessions[room.jiraSessionId];
          delete rooms[roomCode];
          deleteRoom(roomCode);
          return;
        }
        if (wasAdmin) remaining[0].isAdmin = true;
        roomUpdate(roomCode, room);
        console.log(`[disconnect] ${socket.id} removed from ${roomCode} (grace expired)`);
      }, 7200000); // 2 hours

      if (token && sessions[token]) {
        sessions[token].disconnectTimer = timer;
      }
      console.log(`[disconnect] ${socket.id} left ${roomCode} — 2h grace started`);
    });
  });

};
