/**
 * Unit Tests: server/utils/helpers.js
 * Tests pure utility functions in isolation with no external dependencies.
 */
const {
  tickToSeconds,
  formatTime,
  distance3D,
  clamp,
  safeDivide,
  normalizeSteamInput,
  steam64ToSteam32,
  steam32ToSteam64,
  clusterEvents,
} = require('../../server/utils/helpers');

const assert = require('assert');

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

console.log('\n[Unit] helpers.js');

test('tickToSeconds: default 64 tick', () => {
  assert.strictEqual(tickToSeconds(64), 1);
  assert.strictEqual(tickToSeconds(128), 2);
});

test('tickToSeconds: custom 128 tick', () => {
  assert.strictEqual(tickToSeconds(256, 128), 2);
});

test('formatTime: pads seconds', () => {
  assert.strictEqual(formatTime(65), '1:05');
  assert.strictEqual(formatTime(0), '0:00');
  assert.strictEqual(formatTime(3725), '62:05');
});

test('distance3D: Pythagorean', () => {
  const d = distance3D({ x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 0 });
  assert.strictEqual(d, 5);
});

test('clamp: bounds respected', () => {
  assert.strictEqual(clamp(150, 0, 100), 100);
  assert.strictEqual(clamp(-5, 0, 100), 0);
  assert.strictEqual(clamp(50, 0, 100), 50);
});

test('safeDivide: zero returns 0', () => {
  assert.strictEqual(safeDivide(10, 0), 0);
  assert.strictEqual(safeDivide(10, 2), 5);
});

test('normalizeSteamInput: 17-digit steam64', () => {
  const r = normalizeSteamInput('76561198000000000');
  assert.strictEqual(r.type, 'steam64');
  assert.strictEqual(r.value, '76561198000000000');
});

test('normalizeSteamInput: 9-digit steam32', () => {
  const r = normalizeSteamInput('123456789');
  assert.strictEqual(r.type, 'steam32');
  assert.strictEqual(r.value, '123456789');
});

test('normalizeSteamInput: profile URL', () => {
  const r = normalizeSteamInput('https://steamcommunity.com/profiles/76561198000000000');
  assert.strictEqual(r.type, 'steam64');
  assert.strictEqual(r.value, '76561198000000000');
});

test('normalizeSteamInput: profile URL with trailing slash/query', () => {
  const r = normalizeSteamInput('https://steamcommunity.com/profiles/76561198123456789/?l=en/');
  assert.strictEqual(r.type, 'steam64');
  assert.strictEqual(r.value, '76561198123456789');
});

test('normalizeSteamInput: vanity URL', () => {
  const r = normalizeSteamInput('https://steamcommunity.com/id/gaben');
  assert.strictEqual(r.type, 'vanity');
  assert.strictEqual(r.value, 'gaben');
});

test('normalizeSteamInput: vanity URL with trailing slash', () => {
  const r = normalizeSteamInput('https://steamcommunity.com/id/parma_garlic/');
  assert.strictEqual(r.type, 'vanity');
  assert.strictEqual(r.value, 'parma_garlic');
});

test('normalizeSteamInput: raw vanity name', () => {
  const r = normalizeSteamInput('gaben');
  assert.strictEqual(r.type, 'vanity');
  assert.strictEqual(r.value, 'gaben');
});

test('normalizeSteamInput: raw vanity with special chars', () => {
  const r = normalizeSteamInput('player.name_123');
  assert.strictEqual(r.type, 'vanity');
  assert.strictEqual(r.value, 'player.name_123');
});

test('normalizeSteamInput: unknown input', () => {
  const r = normalizeSteamInput('some@bad!input');
  assert.strictEqual(r.type, 'unknown');
});

test('steam64ToSteam32 and back are inverse', () => {
  const s64 = '76561198000000000';
  const s32 = steam64ToSteam32(s64);
  assert.strictEqual(steam32ToSteam64(s32), s64);
});

test('clusterEvents: groups within window', () => {
  const events = [
    { t: 0 }, { t: 5 }, { t: 30 }, { t: 32 },
  ];
  const clusters = clusterEvents(events, 't', 10);
  assert.strictEqual(clusters.length, 2);
  assert.strictEqual(clusters[0].length, 2);
  assert.strictEqual(clusters[1].length, 2);
});

test('clusterEvents: empty array', () => {
  assert.deepStrictEqual(clusterEvents([], 't', 10), []);
});

// Export totals for parent runner
module.exports = { passed: test.passed, failed: test.failed };
console.log(`\n  ${test.passed} passed / ${test.failed} failed`);
if (test.failed > 0) process.exitCode = 1;
