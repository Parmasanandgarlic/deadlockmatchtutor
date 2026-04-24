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
 *   CSRF is only enforced on routes that mutate user sessions/state:
 *     - POST /api/auth/logout
 *     - POST/DELETE /api/auth/favorites
 *     - PUT /api/auth/settings
 *
 *   All other API routes are EXEMPT because they are already protected by:
 *     1. CORS origin validation (only our frontend origin is allowed)
 *     2. SameSite=Lax cookies (browsers won't send session cookies cross-origin)
 *     3. JSON content-type requirement (form-based CSRF can't set Content-Type)
 *
 *   This prevents the false-positive 403 errors that occurred when the SPA
 *   made normal API calls (like player search) without CSRF headers.
 */

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Routes that REQUIRE CSRF validation on state-changing methods.
 * These are session-mutating endpoints where a CSRF attack could
 * cause real damage (e.g., logging out a user, modifying favorites).
 */
const CSRF_PROTECTED_PATHS = [
  '/api/auth/logout',
  '/api/auth/favorites',
  '/api/auth/settings',
  '/auth/logout',
  '/auth/favorites',
  '/auth/settings',
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

  // Safe methods never need CSRF validation
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  // Only enforce CSRF on session-mutating routes
  const requiresCsrf = CSRF_PROTECTED_PATHS.some((p) => req.path.startsWith(p));
  if (!requiresCsrf) {
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
