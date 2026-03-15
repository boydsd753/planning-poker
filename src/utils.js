'use strict';

const https = require('https');

const DEFAULT_SETTINGS = {
  gameName:        '',
  deck:            'fibonacci',
  whoCanReveal:    'host',
  autoReveal:      false,
  showAverage:     true,
  countdown:       true,
  timerDuration:   120,
  timerAutoReveal: false,
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
    deck:         ['fibonacci','modified','tshirt','powers2','sequential','custom'].includes(raw.deck)
                    ? raw.deck : DEFAULT_SETTINGS.deck,
    customDeck:   raw.deck === 'custom' && Array.isArray(raw.customDeck)
                    ? raw.customDeck.map(v => String(v).trim().slice(0, 10)).filter(Boolean).slice(0, 20)
                    : [],
    whoCanReveal: ['host','all'].includes(raw.whoCanReveal) ? raw.whoCanReveal : DEFAULT_SETTINGS.whoCanReveal,
    autoReveal:      Boolean(raw.autoReveal      ?? DEFAULT_SETTINGS.autoReveal),
    showAverage:     Boolean(raw.showAverage     ?? DEFAULT_SETTINGS.showAverage),
    countdown:       Boolean(raw.countdown       ?? DEFAULT_SETTINGS.countdown),
    timerDuration:   [30,60,120,180,300].includes(Number(raw.timerDuration)) ? Number(raw.timerDuration) : DEFAULT_SETTINGS.timerDuration,
    timerAutoReveal: Boolean(raw.timerAutoReveal ?? DEFAULT_SETTINGS.timerAutoReveal),
  };
}

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

module.exports = { DEFAULT_SETTINGS, generateRoomCode, generateId, sanitizeSettings, httpRequest };
