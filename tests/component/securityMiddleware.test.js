/**
 * Component Tests: security middleware and deployment headers.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { csrfProtection, getCsrfToken } = require('../../server/middleware/csrf.middleware');

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    cookies: {},
    locals: {},
    cookie(name, value, options) {
      this.cookies[name] = { value, options };
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

function test(name, fn) {
  try {
    fn();
    console.log(`  PASS  ${name}`);
    test.passed++;
  } catch (err) {
    console.error(`  FAIL  ${name}`);
    console.error(`        ${err.message}`);
    test.failed++;
  }
}
test.passed = 0;
test.failed = 0;

console.log('\n[Component] security middleware');

test('csrfProtection: safe requests receive a token cookie', () => {
  const res = mockRes();
  let nextCalled = false;

  csrfProtection({ method: 'GET', cookies: {}, path: '/api/health', headers: {} }, res, () => {
    nextCalled = true;
  });

  assert.strictEqual(nextCalled, true);
  assert.ok(res.cookies._csrf.value);
  assert.strictEqual(res.locals.csrfToken, res.cookies._csrf.value);
});

test('csrfProtection: unsafe requests require matching token', () => {
  const res = mockRes();
  let nextCalled = false;

  csrfProtection(
    { method: 'POST', cookies: { _csrf: 'known-token' }, path: '/api/players/resolve', headers: {} },
    res,
    () => {
      nextCalled = true;
    }
  );

  assert.strictEqual(nextCalled, false);
  assert.strictEqual(res.statusCode, 403);
  assert.strictEqual(res.body.code, 'CSRF_INVALID');
});

test('csrfProtection: unsafe requests accept matching token', () => {
  const res = mockRes();
  let nextCalled = false;

  csrfProtection(
    {
      method: 'POST',
      cookies: { _csrf: 'known-token' },
      path: '/api/players/resolve',
      headers: { 'x-csrf-token': 'known-token' },
    },
    res,
    () => {
      nextCalled = true;
    }
  );

  assert.strictEqual(nextCalled, true);
  assert.strictEqual(res.statusCode, 200);
});

test('getCsrfToken: returns middleware token', () => {
  const res = mockRes();
  res.locals.csrfToken = 'token-from-cookie';
  getCsrfToken({}, res);
  assert.deepStrictEqual(res.body, { csrfToken: 'token-from-cookie' });
});

test('vercel CSP header does not allow inline scripts', () => {
  const vercel = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../vercel.json'), 'utf8'));
  const csp = vercel.headers
    .flatMap((entry) => entry.headers)
    .find((header) => header.key.toLowerCase() === 'content-security-policy')?.value;

  assert.ok(csp, 'Missing Content-Security-Policy header in vercel.json');
  assert.ok(/script-src/.test(csp), 'CSP should define script-src');
  assert.ok(!/script-src[^;]*'unsafe-inline'/.test(csp), 'script-src must not allow unsafe-inline');
});

test('auth rate limits cover both /api/auth and root-mounted /auth routes', () => {
  const index = fs.readFileSync(path.resolve(__dirname, '../../server/index.js'), 'utf8');
  assert.ok(/app\.use\('\/api\/auth', authLimiter\)/.test(index), 'missing /api/auth limiter');
  assert.ok(/app\.use\('\/auth', authLimiter\)/.test(index), 'missing root /auth limiter');
});

test('Redis degraded mode must be explicit in production deploy config', () => {
  const redisService = fs.readFileSync(path.resolve(__dirname, '../../server/services/redis.service.js'), 'utf8');
  const vercel = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../vercel.json'), 'utf8'));

  assert.ok(/ALLOW_REDISLESS/.test(redisService), 'Redis fallback should be gated by ALLOW_REDISLESS');
  assert.ok(!/Boolean\(process\.env\.VERCEL\)/.test(redisService), 'Vercel must not implicitly disable Redis');
  assert.strictEqual(vercel.env?.ALLOW_REDISLESS, '1', 'Vercel degraded mode should be explicit');
});

console.log(`\n  ${test.passed} passed / ${test.failed} failed`);
if (test.failed > 0) process.exitCode = 1;
