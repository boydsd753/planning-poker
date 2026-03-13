const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

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

  socket.on('create-room', ({ name, settings }) => {
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
    };

    socket.join(roomCode);
    socket.roomCode = roomCode;
    socket.emit('room-joined', { roomCode });
    io.to(roomCode).emit('room-update', rooms[roomCode]);
    console.log(`[create]     ${socket.id} created ${roomCode}`);
  });

  socket.on('join-room', ({ name, roomCode, isSpectator }) => {
    const code = String(roomCode).toUpperCase().trim();
    const room = rooms[code];
    if (!room) { socket.emit('error-msg', 'Room not found. Check the code and try again.'); return; }

    room.players[socket.id] = {
      id: socket.id,
      name: String(name).trim().slice(0, 20) || 'Anonymous',
      card: null,
      isAdmin: false,
      isSpectator: Boolean(isSpectator),
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
  socket.on('add-issue', ({ title }) => {
    const room = rooms[socket.roomCode];
    if (!room) return;
    const t = String(title).trim().slice(0, 200);
    if (!t) return;
    const issue = { id: generateId(), title: t, estimate: null };
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

  socket.on('save-issue-estimate', ({ id, estimate }) => {
    const room = rooms[socket.roomCode];
    if (!room) return;
    const issue = room.issues.find(i => i.id === id);
    if (issue) {
      issue.estimate = String(estimate).slice(0, 20);
      io.to(socket.roomCode).emit('room-update', room);
    }
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

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => { console.log(`\n  Planning Poker → http://localhost:${PORT}\n`); });
