'use strict';

require('dotenv').config();
const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const path    = require('path');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  pingInterval: 20000,   // ping every 20s — keeps connection alive through proxies
  pingTimeout:  300000,  // wait 5 min for pong — tolerates aggressively throttled background tabs
});

const securityHeaders  = require('./middleware/security');
const authRouter       = require('./routes/auth');
const { router: jiraRouter } = require('./routes/jira');
const { router: adminRouter, buildStats, requireAdmin } = require('./routes/admin');
const registerHandlers = require('./socket/handlers');

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(securityHeaders);
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.json());

// ── Vendor libs (served locally to avoid CDN tracking prevention) ─────────────
app.get('/js/vendor/mammoth.min.js', (req, res) =>
  res.sendFile(path.join(__dirname, '..', 'node_modules', 'mammoth', 'mammoth.browser.min.js')));
app.get('/js/vendor/xlsx.full.min.js', (req, res) =>
  res.sendFile(path.join(__dirname, '..', 'node_modules', 'xlsx', 'dist', 'xlsx.full.min.js')));

// ── Expose publishable Supabase key to frontend (safe to be public) ───────────
app.get('/config.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`window.APP_CONFIG = ${JSON.stringify({
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_PUBLISHABLE_KEY,
  })};`);
});

// ── Utility routes ────────────────────────────────────────────────────────────
app.get('/health',  (req, res) => res.sendStatus(200));
app.get('/privacy', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'privacy.html')));

// ── Feature routes ────────────────────────────────────────────────────────────
app.use(authRouter);
app.use(jiraRouter);
app.use(adminRouter);
app.set('io', io);

// ── Socket.IO ─────────────────────────────────────────────────────────────────
registerHandlers(io);

// ── Admin real-time push (every 2s to /admin namespace) ───────────────────────
const adminNsp = io.of('/admin');
adminNsp.use((socket, next) => {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || socket.handshake.auth.token !== secret) {
    return next(new Error('Unauthorized'));
  }
  next();
});
adminNsp.on('connection', socket => {
  const send = () => socket.emit('stats', buildStats(io));
  send();
  const iv = setInterval(send, 2000);
  socket.on('disconnect', () => clearInterval(iv));
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).sendFile(path.join(__dirname, '..', 'public', '404.html')));

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => { console.log(`\n  Planning Poker → http://localhost:${PORT}\n`); });
