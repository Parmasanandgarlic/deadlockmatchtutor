/**
 * Component Tests: server/middleware/validation.js
 * Tests middleware as independent units with mocked req/res/next.
 */
const { requireParam, requireNumericParam, validateSteamInput } = require('../../server/middleware/validation');
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

console.log('\n[Component] validation middleware');

test('requireParam: missing param returns 400', () => {
  const mw = requireParam('accountId', 'params');
  const res = mockRes();
  let nextCalled = false;
  mw({ params: {} }, res, () => { nextCalled = true; });
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(nextCalled, false);
});

test('requireParam: present param calls next', () => {
  const mw = requireParam('accountId', 'params');
  const res = mockRes();
  let nextCalled = false;
  mw({ params: { accountId: '123' } }, res, () => { nextCalled = true; });
  assert.strictEqual(nextCalled, true);
});

test('requireNumericParam: non-numeric rejected', () => {
  const mw = requireNumericParam('id');
  const res = mockRes();
  mw({ params: { id: 'abc' } }, res, () => {});
  assert.strictEqual(res.statusCode, 400);
});

test('requireNumericParam: numeric accepted', () => {
  const mw = requireNumericParam('id');
  const res = mockRes();
  let called = false;
  mw({ params: { id: '42' } }, res, () => { called = true; });
  assert.strictEqual(called, true);
});

test('validateSteamInput: empty rejected', () => {
  const res = mockRes();
  validateSteamInput({ params: {}, query: {}, body: { steamInput: '' } }, res, () => {});
  assert.strictEqual(res.statusCode, 400);
});

test('validateSteamInput: valid accepted', () => {
  const res = mockRes();
  let called = false;
  validateSteamInput({ params: {}, query: {}, body: { steamInput: '76561198000000000' } }, res, () => { called = true; });
  assert.strictEqual(called, true);
});

console.log(`\n  ${test.passed} passed / ${test.failed} failed`);
if (test.failed > 0) process.exitCode = 1;
