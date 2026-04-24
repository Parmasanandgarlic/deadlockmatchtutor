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
 * Enforcement strategy:
 *   CSRF is enforced on every non-safe method. The SPA first calls GET /api/csrf
 *   to receive a readable double-submit cookie, then echoes it in x-csrf-token.
 */

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Generate a new CSRF token.
 * @returns {string}
 */
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Middleware: sets the CSRF cookie on every response and validates it
 * only on session-mutating requests.
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

  res.locals.csrfToken = token;

  // Safe methods never need CSRF validation.
  if (SAFE_METHODS.has(req.method)) {
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

function getCsrfToken(req, res) {
  res.json({ csrfToken: res.locals.csrfToken });
}

module.exports = { csrfProtection, getCsrfToken };
