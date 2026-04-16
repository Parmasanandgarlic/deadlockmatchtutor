/**
 * Unit Tests: server/pipeline/scoring.engine.js
 */
const { computeOverallScore, scoreToGrade } = require('../../server/pipeline/scoring.engine');
const assert = require('assert');

function test(name, fn) {
  try { fn(); console.log(`  PASS  ${name}`); test.passed++; }
  catch (err) { console.error(`  FAIL  ${name}`); console.error(`        ${err.message}`); test.failed++; }
}
test.passed = 0; test.failed = 0;

console.log('\n[Unit] scoring.engine.js');

test('scoreToGrade: 95 -> A+', () => {
  const g = scoreToGrade(95);
  assert.ok(['A+', 'A', 'S', 'S+'].includes(g));
});

test('scoreToGrade: 0 -> F', () => {
  assert.strictEqual(scoreToGrade(0), 'F');
});

test('computeOverallScore: all 100 gives 100', () => {
  const r = computeOverallScore({ heroPerformance: 100, itemization: 100, combat: 100, benchmarks: 100 });
  assert.strictEqual(r.impactScore, 100);
});

test('computeOverallScore: all 0 gives 0', () => {
  const r = computeOverallScore({ heroPerformance: 0, itemization: 0, combat: 0, benchmarks: 0 });
  assert.strictEqual(r.impactScore, 0);
});

test('computeOverallScore: clamps out-of-range input', () => {
  const r = computeOverallScore({ heroPerformance: 150, itemization: -10, combat: 50, benchmarks: 50 });
  assert.ok(r.impactScore >= 0 && r.impactScore <= 100);
});

test('computeOverallScore: breakdown weights sum correctly', () => {
  const r = computeOverallScore({ heroPerformance: 80, itemization: 60, combat: 70, benchmarks: 50 });
  const expected = Math.round(80 * 0.3 + 60 * 0.25 + 70 * 0.25 + 50 * 0.2);
  assert.strictEqual(r.impactScore, expected);
  assert.ok(r.breakdown.heroPerformance.weight === 0.30);
});

test('computeOverallScore: handles undefined module', () => {
  const r = computeOverallScore({});
  assert.strictEqual(r.impactScore, 0);
  assert.strictEqual(r.letterGrade, 'F');
});

console.log(`\n  ${test.passed} passed / ${test.failed} failed`);
if (test.failed > 0) process.exitCode = 1;
