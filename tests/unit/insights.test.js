/**
 * Unit Tests: server/pipeline/insights.engine.js
 * Tests the Deadlock-specific insights generation logic in isolation.
 */
const assert = require('assert');

// Inline require to avoid logger output unless needed
const { generateInsights } = require('../../server/pipeline/insights.engine');

function test(name, fn) {
  try { fn(); console.log(`  PASS  ${name}`); test.passed++; }
  catch (err) { console.error(`  FAIL  ${name}`); console.error(`        ${err.message}`); test.failed++; }
}
test.passed = 0; test.failed = 0;

console.log('\n[Unit] insights.engine.js');

test('returns empty array when all modules null', () => {
  const r = generateInsights(null, null, null, null, {});
  assert.ok(Array.isArray(r));
  assert.strictEqual(r.length, 0);
});

test('generates critical soul insight for low souls/min', () => {
  const heroPerf = { soulsPerMin: 250, matchKda: 1, deaths: 3 };
  const item = { soulsPerMin: 250, netWorth: 8000, items: [] };
  const combat = { kda: 1, deaths: 3, kills: 2, damagePerMin: 500, deathsPerMin: 0.2 };
  const bench = { kdaDiff: 0, benchmarkKda: 2 };
  const meta = { duration: 1200, won: false };
  const r = generateInsights(heroPerf, item, combat, bench, meta);
  const soulInsight = r.find(i => i.category === 'soulTiming');
  assert.ok(soulInsight, 'should have a soulTiming insight');
  assert.strictEqual(soulInsight.severity, 'critical');
});

test('generates positive soul insight for elite pace', () => {
  const heroPerf = { soulsPerMin: 700, matchKda: 5, deaths: 2 };
  const item = { soulsPerMin: 700, netWorth: 35000, items: [1, 2, 3, 4, 5] };
  const combat = { kda: 5, deaths: 2, kills: 12, damagePerMin: 1200, deathsPerMin: 0.1 };
  const bench = { kdaDiff: 1, benchmarkKda: 4 };
  const meta = { duration: 1800, won: true };
  const r = generateInsights(heroPerf, item, combat, bench, meta);
  const positives = r.filter(i => i.severity === 'positive');
  assert.ok(positives.length > 0, 'should generate at least one positive insight');
});

test('caps output to 6 insights max', () => {
  // Constructing a scenario that triggers many insights
  const heroPerf = { soulsPerMin: 300, matchKda: 0.5, deaths: 12, kills: 2, assists: 1 };
  const item = { soulsPerMin: 300, netWorth: 5000, items: [1, 2], score: 30 };
  const combat = { kda: 0.3, deaths: 12, kills: 2, damagePerMin: 200, deathsPerMin: 0.8, score: 20 };
  const bench = { kdaDiff: -3, benchmarkKda: 3, userKda: 0.3, score: 20 };
  const meta = { duration: 2100, won: false };
  const r = generateInsights(heroPerf, item, combat, bench, meta);
  assert.ok(r.length <= 6, `Expected <= 6 insights, got ${r.length}`);
});

test('insights sorted by impact descending', () => {
  const heroPerf = { soulsPerMin: 300, matchKda: 1, deaths: 10 };
  const item = { soulsPerMin: 300, netWorth: 8000, items: [1] };
  const combat = { kda: 1, deaths: 10, kills: 5, damagePerMin: 400, deathsPerMin: 0.6 };
  const bench = { kdaDiff: -2, benchmarkKda: 3, userKda: 1 };
  const meta = { duration: 1800, won: false };
  const r = generateInsights(heroPerf, item, combat, bench, meta);
  for (let i = 1; i < r.length; i++) {
    assert.ok(r[i - 1].impact >= r[i].impact, `insight[${i - 1}].impact (${r[i - 1].impact}) should be >= insight[${i}].impact (${r[i].impact})`);
  }
});

test('each insight has required fields', () => {
  const heroPerf = { soulsPerMin: 400, matchKda: 2, deaths: 5 };
  const item = { soulsPerMin: 400, netWorth: 15000, items: [1, 2, 3] };
  const combat = { kda: 2, deaths: 5, kills: 8, damagePerMin: 600, deathsPerMin: 0.3 };
  const bench = { kdaDiff: 0, benchmarkKda: 2 };
  const meta = { duration: 1500, won: true };
  const r = generateInsights(heroPerf, item, combat, bench, meta);
  const required = ['severity', 'module', 'category', 'title', 'detail', 'action', 'impact', 'evidence'];
  for (const insight of r) {
    for (const field of required) {
      assert.ok(insight[field] !== undefined, `insight "${insight.title}" missing field "${field}"`);
    }
  }
});

console.log(`\n  ${test.passed} passed / ${test.failed} failed`);
if (test.failed > 0) process.exitCode = 1;
