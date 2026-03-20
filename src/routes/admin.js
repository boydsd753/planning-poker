'use strict';

const express = require('express');
const os      = require('os');
const path    = require('path');
const { rooms, jiraSessions, stats } = require('../state');

const router = express.Router();

function requireAdmin(req, res, next) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return res.status(503).send('Admin not configured');
  const token = req.query.token || req.headers['x-admin-token'];
  if (token !== secret) return res.status(401).send('Unauthorized');
  next();
}

function buildStats(io) {
  const mem   = process.memoryUsage();
  const uptime = process.uptime();

  const roomList = Object.values(rooms).map(r => {
    const players = Object.values(r.players);
    return {
      code:        r.id,
      playerCount: players.length,
      devCount:    players.filter(p => p.role === 'dev').length,
      qaCount:     players.filter(p => p.role === 'qa').length,
      spectators:  players.filter(p => p.isSpectator).length,
      revealed:    r.revealed,
      hasJira:     !!r.jiraSessionId,
      issueCount:  (r.issues || []).length,
      players:     players.map(p => ({ name: p.name, role: p.role, isAdmin: p.isAdmin, isSpectator: p.isSpectator, voted: !!p.card })),
    };
  });

  const totalPlayers = roomList.reduce((s, r) => s + r.playerCount, 0);

  return {
    server: {
      uptime,
      uptimeHuman: formatUptime(uptime),
      memHeapUsed:  Math.round(mem.heapUsed  / 1024 / 1024),
      memHeapTotal: Math.round(mem.heapTotal / 1024 / 1024),
      memRss:       Math.round(mem.rss       / 1024 / 1024),
      loadAvg:      os.loadavg().map(n => n.toFixed(2)),
      platform:     os.platform(),
      nodeVersion:  process.version,
    },
    live: {
      activeRooms:    roomList.length,
      totalPlayers,
      jiraConnections: Object.keys(jiraSessions).length,
      connectedSockets: io ? io.engine.clientsCount : 0,
    },
    ai: {
      estimatesTotal:        stats.aiEstimatesTotal,
      estimatesInsufficient: stats.aiEstimatesInsufficient,
      estimatesErrors:       stats.aiEstimatesErrors,
      tokensInput:           stats.aiTokensInput,
      tokensOutput:          stats.aiTokensOutput,
      tokensTotal:           stats.aiTokensInput + stats.aiTokensOutput,
      rateLimits:            stats.aiRateLimits,
      roundsCompleted:       stats.roundsCompleted,
      peakPlayers:           stats.peakPlayers,
    },
    rooms: roomList,
    startedAt: stats.startedAt,
    timestamp: Date.now(),
  };
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

router.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'public', 'admin', 'index.html'));
});

router.get('/admin/stats', requireAdmin, (req, res) => {
  res.json(buildStats(req.app.get('io')));
});

module.exports = { router, buildStats, requireAdmin, formatUptime };
