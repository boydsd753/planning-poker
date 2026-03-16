'use strict';

module.exports = function securityHeaders(req, res, next) {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // The Jira auth callback sends an inline <script> to postMessage back to the opener.
  // Allow unsafe-inline only for that route; everywhere else stays strict.
  const scriptSrc = req.path.startsWith('/auth/jira')
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self'";

  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    "connect-src 'self' wss: ws:",
    "frame-ancestors 'none'",
  ].join('; '));
  next();
};
