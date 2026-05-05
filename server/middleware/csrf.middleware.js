const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * CSRF Protection - signed double-submit cookie pattern.
 *
 * The SPA reads a signed `_csrf` cookie and echoes it as `x-csrf-token` on
 * state-changing requests. We validate both the token signature and the
 * header/cookie match before allowing the request through.
 */

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const CSRF_COOKIE_NAME = '_csrf';
const CSRF_HEADER_NAME = 'x-csrf-token';
const TOKEN_BYTES = 32;

function getCsrfSecret() {
  const secret = process.env.CSRF_SECRET || process.env.SESSION_SECRET;

  if (secret) return secret;

  if (process.env.NODE_ENV === 'production') {
    // In serverless environments (Vercel), each invocation is stateless anyway.
    // Generate a per-instance secret and warn instead of crashing the app.
    const crypto = require('crypto');
    const generated = crypto.randomBytes(32).toString('hex');
    console.warn(
      '⚠️  CSRF_SECRET / SESSION_SECRET not set. Using a random per-instance secret. ' +
      'Set CSRF_SECRET in your Vercel environment variables for consistent CSRF validation.'
    );
    return generated;
  }

  return 'deadlock-aftermatch-development-csrf-secret';
}

function signNonce(nonce) {
  return crypto
    .createHmac('sha256', getCsrfSecret())
    .update(nonce)
    .digest('base64url');
}

function timingSafeEqualString(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function generateToken() {
  const nonce = crypto.randomBytes(TOKEN_BYTES).toString('base64url');
  return `${nonce}.${signNonce(nonce)}`;
}

function isValidToken(token) {
  if (typeof token !== 'string') return false;
  const [nonce, signature, extra] = token.split('.');
  if (!nonce || !signature || extra) return false;
  return timingSafeEqualString(signature, signNonce(nonce));
}

function tokensMatch(left, right) {
  return typeof left === 'string' && typeof right === 'string' && timingSafeEqualString(left, right);
}

function csrfProtection(req, res, next) {
  let token = req.cookies?.[CSRF_COOKIE_NAME];
  if (!isValidToken(token)) {
    token = generateToken();
  }

  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.locals.csrfToken = token;

  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  // Skip CSRF for API routes — they use stateless JSON requests,
  // not cookie-based auth, so CSRF attacks aren't applicable.
  if (req.path.startsWith('/api/')) {
    return next();
  }

  const headerToken = req.headers[CSRF_HEADER_NAME];
  const submittedToken = Array.isArray(headerToken) ? headerToken[0] : headerToken;

  if (!submittedToken || !tokensMatch(submittedToken, token) || !isValidToken(submittedToken)) {
    logger.warn(
      `[CSRF] Token mismatch on ${req.method} ${req.path} ` +
      `(cookie=${token ? 'present' : 'missing'}, header=${submittedToken ? 'present' : 'missing'})`
    );
    return res.status(403).json({
      error: 'CSRF token validation failed',
      code: 'CSRF_INVALID',
      message: 'Missing or invalid CSRF token. Refresh the page and try again.',
    });
  }

  next();
}

function getCsrfToken(req, res) {
  res.json({ csrfToken: res.locals.csrfToken });
}

module.exports = {
  csrfProtection,
  getCsrfToken,
  generateToken,
  isValidToken,
};
