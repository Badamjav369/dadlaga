const { FORCE_HTTPS, IS_PROD, CORS_ORIGINS } = require('../config');

function forceHttps(req, res, next) {
  if (!FORCE_HTTPS || req.secure) return next();

  if (req.path.startsWith('/api')) {
    return res.status(403).json({ message: 'Зөвхөн HTTPS холболт зөвшөөрнө.' });
  }

  res.redirect(308, 'https://' + req.headers.host + req.originalUrl);
}

function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=(), interest-cohort=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    "connect-src 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'"
  ].join('; '));

  if (FORCE_HTTPS && req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  }

  next();
}

function cors(req, res, next) {
  const origin = req.headers.origin;

  if (origin && CORS_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
  }

  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
}

function safeUploads(req, res, next) {
  if (req.path.startsWith('/uploads/')) {
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
  next();
}

module.exports = { forceHttps, securityHeaders, cors, safeUploads };