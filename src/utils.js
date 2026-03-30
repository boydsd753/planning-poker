'use strict';

const https = require('https');

const DEFAULT_SETTINGS = {
  gameName:        '',
  deck:            'hours',
  whoCanReveal:    'all',
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
    deck:         ['fibonacci','modified','tshirt','powers2','sequential','hours','custom'].includes(raw.deck)
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

function httpRequest(hostname, authHeader, method, path, body, rawResponse = false, _redirects = 5) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const headers = { Accept: rawResponse ? '*/*' : 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;
    if (bodyStr) { headers['Content-Type'] = 'application/json'; headers['Content-Length'] = Buffer.byteLength(bodyStr); }
    const req = https.request({ hostname, path, method, headers }, res => {
      // Follow redirects (Jira attachment content redirects to CDN)
      if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location && _redirects > 0) {
        res.resume(); // drain to free memory
        try {
          const url = new URL(res.headers.location);
          // Don't forward Atlassian auth token to external CDN hosts
          const nextAuth = url.hostname === hostname ? authHeader : null;
          resolve(httpRequest(url.hostname, nextAuth, 'GET', url.pathname + url.search, null, rawResponse, _redirects - 1));
        } catch {
          // Relative redirect
          resolve(httpRequest(hostname, authHeader, 'GET', res.headers.location, null, rawResponse, _redirects - 1));
        }
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        resolve({
          status:  res.statusCode,
          headers: res.headers,
          body:    rawResponse ? buf : buf.toString('utf8'),
        });
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

module.exports = { DEFAULT_SETTINGS, generateRoomCode, generateId, sanitizeSettings, httpRequest };
