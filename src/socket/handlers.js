'use strict';

const { rooms }                              = require('../state');
const { generateId, sanitizeSettings }       = require('../utils');
const { generateRoomCode }                   = require('../utils');

module.exports = function registerHandlers(io) {

  io.on('connection', (socket) => {
    console.log(`[connect]    ${socket.id}`);

    function sanitizeAvatar(raw) {
      if (typeof raw !== 'string') return null;
      if (!raw.startsWith('data:image/')) return null;
      if (raw.length > 30000) return null; // ~22KB decoded, enough for 64x64 JPEG
      return raw;
    }

    socket.on('create-room', ({ name, settings, role, avatar }) => {
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

      rooms[roomCode].players[socket.id] = {
        id: socket.id,
        name: String(name).trim().slice(0, 20) || 'Anonymous',
        avatar: sanitizeAvatar(avatar),
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

    socket.on('join-room', ({ name, roomCode, isSpectator, role, avatar }) => {
      const code = String(roomCode).toUpperCase().trim();
      const room = rooms[code];
      if (!room) { socket.emit('error-msg', 'Room not found. Check the code and try again.'); return; }

      room.players[socket.id] = {
        id: socket.id,
        name: String(name).trim().slice(0, 20) || 'Anonymous',
        avatar: sanitizeAvatar(avatar),
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
      room.timer.duration = room.settings.timerDuration || 120;
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
      room.timer = { running: false, startedAt: null, elapsed: 0, duration: room.settings.timerDuration || 120 };
      io.to(socket.roomCode).emit('room-update', room);
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
        const val = estimate === '' || estimate === null || estimate === undefined ? null : String(estimate).slice(0, 20);
        issue[team === 'dev' ? 'devEstimate' : 'qaEstimate'] = val;
        io.to(socket.roomCode).emit('room-update', room);
      }
    });

    socket.on('mark-issue-estimated', ({ id }) => {
      const room = rooms[socket.roomCode];
      if (!room) return;
      const issue = room.issues.find(i => i.id === id);
      if (issue) {
        issue.savedToJira = true;
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

    // ── Toggle dealers (host = all, player = local only via client) ────────────
    socket.on('toggle-dealers', () => {
      const room = rooms[socket.roomCode];
      if (!room) return;
      const player = room.players[socket.id];
      if (!player?.isAdmin) return;
      room.dealersHidden = !room.dealersHidden;
      io.to(socket.roomCode).emit('room-update', room);
    });

    // ── Reactions ──────────────────────────────────────────────────────────────
    const ALLOWED_REACTIONS = new Set(['👍','👎','❤️','😂','😮','🤔','☕','🎉','sergio','danan']);
    socket.on('react', ({ emoji }) => {
      if (!ALLOWED_REACTIONS.has(emoji)) return;
      if (!socket.roomCode) return;
      io.to(socket.roomCode).emit('reaction', { playerId: socket.id, emoji });
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

};
