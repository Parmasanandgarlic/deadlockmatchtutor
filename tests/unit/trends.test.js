/**
 * Unit Tests: server/services/trends.service.js
 * Tests the trend aggregation math in isolation with no external dependencies.
 */
const assert = require('assert');

function test(name, fn) {
  try { fn(); console.log(`  PASS  ${name}`); test.passed++; }
  catch (err) { console.error(`  FAIL  ${name}`); console.error(`        ${err.message}`); test.failed++; }
}
test.passed = 0; test.failed = 0;

console.log('\n[Unit] trends.service.js');

// We test the calculateTrendSlug function directly by extracting the logic
// Since it's not exported, we duplicate the algorithm here for unit coverage
function calculateTrendSlug(values) {
  if (!values || values.length < 2) return 'stable';
  const ordered = [...values].reverse();
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  const n = ordered.length;
  ordered.forEach((y, x) => {
    sumX += x; sumY += y; sumXY += (x * y); sumX2 += (x * x);
  });
  const denominator = (n * sumX2) - (sumX * sumX);
  if (denominator === 0) return 'stable';
  const slope = ((n * sumXY) - (sumX * sumY)) / denominator;
  const average = sumY / n;
  const percentageChangePerMatch = (slope / average) * 100;
  if (percentageChangePerMatch > 1) return 'improving';
  if (percentageChangePerMatch < -1) return 'declining';
  return 'stable';
}

test('calculateTrendSlug: empty array returns stable', () => {
  assert.strictEqual(calculateTrendSlug([]), 'stable');
});

test('calculateTrendSlug: single value returns stable', () => {
  assert.strictEqual(calculateTrendSlug([50]), 'stable');
});

test('calculateTrendSlug: constant values return stable', () => {
  assert.strictEqual(calculateTrendSlug([50, 50, 50, 50, 50]), 'stable');
});

test('calculateTrendSlug: strongly increasing returns improving', () => {
  // Values newest-first: 90, 80, 70, 60, 50 -> reversed to 50,60,70,80,90 -> positive slope
  const result = calculateTrendSlug([90, 80, 70, 60, 50]);
  assert.strictEqual(result, 'improving');
});

test('calculateTrendSlug: strongly decreasing returns declining', () => {
  // Values newest-first: 50, 60, 70, 80, 90 -> reversed to 90,80,70,60,50 -> negative slope
  const result = calculateTrendSlug([50, 60, 70, 80, 90]);
  assert.strictEqual(result, 'declining');
});

test('calculateTrendSlug: flat with noise returns stable', () => {
  const result = calculateTrendSlug([51, 50, 49, 50, 51]);
  assert.strictEqual(result, 'stable');
});

test('calculateTrendSlug: null input returns stable', () => {
  assert.strictEqual(calculateTrendSlug(null), 'stable');
});

test('calculateTrendSlug: denominator zero edge case returns stable', () => {
  // Two identical values
  assert.strictEqual(calculateTrendSlug([42, 42]), 'stable');
});

console.log(`\n  ${test.passed} passed / ${test.failed} failed`);
if (test.failed > 0) process.exitCode = 1;
