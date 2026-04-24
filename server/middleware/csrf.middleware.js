const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * CSRF Protection — Double-Submit Cookie Pattern
 *
 * How it works:
 *   1. On every response, we set a `_csrf` cookie with a random token.
 *   2. The frontend reads this cookie and sends it back as the
 *      `x-csrf-token` request header on all state-changing requests.
 *   3. This middleware validates that the header matches the cookie.
 *
 * Why double-submit works:
 *   An attacker on a different origin can craft a form POST but cannot
 *   read our cookies (due to SameSite + HttpOnly), so they can't set
 *   the matching header. This blocks CSRF without server-side token
 *   storage.
 *
 * Exemptions:
 *   - GET, HEAD, OPTIONS (safe methods)
 *   - Steam OAuth callback (/auth/steam/return) — redirect from Steam
 *   - Health / meta endpoints (public reads)
 */

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const EXEMPT_PATHS = [
  '/api/auth/steam/return',
  '/health',
  '/api/health',
  '/api/meta',
  '/api-docs',
];

/**
 * Generate a new CSRF token.
 * @returns {string}
 */
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Middleware: sets the CSRF cookie on every response and validates it
 * on state-changing requests.
 */
function csrfProtection(req, res, next) {
  // Always set / refresh the CSRF cookie so the frontend can read it
  let token = req.cookies?._csrf;
  if (!token) {
    token = generateToken();
  }

  res.cookie('_csrf', token, {
    httpOnly: false,   // frontend JS needs to read this
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });

  // Safe methods don't need CSRF validation
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  // Check exemptions
  const isExempt = EXEMPT_PATHS.some((p) => req.path.startsWith(p));
  if (isExempt) {
    return next();
  }

  // Validate: header must match cookie
  const headerToken = req.headers['x-csrf-token'];
  if (!headerToken || headerToken !== token) {
    logger.warn(
      `[CSRF] Token mismatch on ${req.method} ${req.path} ` +
      `(cookie=${token ? 'present' : 'missing'}, header=${headerToken ? 'present' : 'missing'})`
    );
    return res.status(403).json({
      error: 'CSRF token validation failed',
      code: 'CSRF_INVALID',
      message: 'Missing or invalid CSRF token. Refresh the page and try again.',
    });
  }

  next();
}

module.exports = { csrfProtection };
