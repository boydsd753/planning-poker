'use strict';

require('dotenv').config();
const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const path    = require('path');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  pingInterval: 25000,  // how often to ping (ms)
  pingTimeout:  60000,  // how long to wait for pong before disconnecting (ms)
});

const securityHeaders  = require('./middleware/security');
const authRouter       = require('./routes/auth');
const jiraRouter       = require('./routes/jira');
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

// ── Utility routes ────────────────────────────────────────────────────────────
app.get('/health',  (req, res) => res.sendStatus(200));
app.get('/privacy', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'privacy.html')));

// ── Feature routes ────────────────────────────────────────────────────────────
app.use(authRouter);
app.use(jiraRouter);

// ── Socket.IO ─────────────────────────────────────────────────────────────────
registerHandlers(io);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).sendFile(path.join(__dirname, '..', 'public', '404.html')));

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => { console.log(`\n  Planning Poker → http://localhost:${PORT}\n`); });
