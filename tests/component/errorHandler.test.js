/**
 * Component Tests: server/middleware/errorHandler.js
 */
const { errorHandler, notFoundHandler } = require('../../server/middleware/errorHandler');
const assert = require('assert');

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

function test(name, fn) {
  try { fn(); console.log(`  PASS  ${name}`); test.passed++; }
  catch (err) { console.error(`  FAIL  ${name}`); console.error(`        ${err.message}`); test.failed++; }
}
test.passed = 0; test.failed = 0;

console.log('\n[Component] errorHandler middleware');

test('notFoundHandler returns 404 JSON', () => {
  const res = mockRes();
  notFoundHandler({ originalUrl: '/bogus', method: 'GET' }, res, () => {});
  assert.strictEqual(res.statusCode, 404);
  assert.ok(res.body);
});

test('errorHandler returns error shape', () => {
  const res = mockRes();
  const err = new Error('boom');
  errorHandler(err, { method: 'GET', originalUrl: '/x' }, res, () => {});
  assert.ok(res.statusCode >= 400);
  assert.ok(res.body && typeof res.body.error === 'string');
});

test('errorHandler: respects explicit statusCode', () => {
  const res = mockRes();
  const err = Object.assign(new Error('bad'), { statusCode: 418 });
  errorHandler(err, { method: 'GET', originalUrl: '/x' }, res, () => {});
  assert.strictEqual(res.statusCode, 418);
});

console.log(`\n  ${test.passed} passed / ${test.failed} failed`);
if (test.failed > 0) process.exitCode = 1;
