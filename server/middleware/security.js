// =====================================================
//  middleware/security.js
//  HTTPS албадах, хамгаалалтын HTTP толгой тавих
// =====================================================

const { FORCE_HTTPS, IS_PROD, CORS_ORIGINS } = require('../config');

/**
 * HTTP-ээр ирсэн хүсэлтийг HTTPS руу шилжүүлнэ.
 * Nginx ард ажиллаж байгаа тул протоколыг X-Forwarded-Proto
 * толгойгоос уншина — үүний тулд app.set('trust proxy', 1) хэрэгтэй.
 */
function forceHttps(req, res, next) {
  if (!FORCE_HTTPS || req.secure) return next();

  // API хүсэлтийг чимээгүй шилжүүлэхгүй — тодорхой алдаа өгнө
  if (req.path.startsWith('/api')) {
    return res.status(403).json({ message: 'Зөвхөн HTTPS холболт зөвшөөрнө.' });
  }

  res.redirect(308, 'https://' + req.headers.host + req.originalUrl);
}


/**
 * Хамгаалалтын толгойнууд.
 *
 * CSP: скриптийг зөвхөн өөрийн домэйнээс ачаална. Тиймээс
 * index.html дотор inline <script> байж болохгүй — өнгөний
 * горим тавьдаг богино кодыг js/boot.js рүү зөөсөн.
 * Загварт inline style ашигладаг тул style-src сул хэвээр.
 */
function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=(), interest-cohort=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('X-XSS-Protection', '0');   // орчин үеийн хөтөчид CSP найдвартай

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

  // HSTS — зөвхөн HTTPS дээр. Хөтөч дараа нь HTTP-ээр огт хандахгүй.
  if (FORCE_HTTPS && req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  }

  next();
}


/**
 * CORS. Frontend-ийг ижил сервер түгээдэг тул ердийн үед
 * огт шаардлагагүй. CORS_ORIGINS тохируулсан үед л ажиллана.
 */
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


/** Байршуулсан файлыг хөтөч гүйцэтгэхээс сэргийлнэ */
function safeUploads(req, res, next) {
  if (req.path.startsWith('/uploads/')) {
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
  next();
}


module.exports = { forceHttps, securityHeaders, cors, safeUploads };