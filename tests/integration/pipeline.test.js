/**
 * Integration Tests: server/pipeline
 * Verifies the pipeline orchestrator connects analyzers + scoring + insights correctly
 * using mocked API data (no external calls).
 */
const { runPipeline } = require('../../server/pipeline');
const assert = require('assert');

function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => { console.log(`  PASS  ${name}`); test.passed++; })
    .catch((err) => { console.error(`  FAIL  ${name}`); console.error(`        ${err.message}`); test.failed++; });
}
test.passed = 0; test.failed = 0;

console.log('\n[Integration] runPipeline with mocked API data');

const mockApiData = {
  matchInfo: { match_id: 12345, duration_seconds: 2000 },
  matchInHistory: {
    match_id: 12345,
    hero_id: 2,
    kills: 10, deaths: 5, assists: 15,
    net_worth: 40000, souls: 42000,
    hero_damage: 25000,
  },
  heroStats: {
    hero_id: 2, matches_played: 100,
    win_rate: 55, avg_kda: 3.2,
    avg_souls: 40000, avg_damage: 22000,
  },
  accountStats: {},
  rankPredict: {},
  playerCard: {},
  heroId: 2,
};

(async () => {
  await test('pipeline returns complete structure', async () => {
    const result = await runPipeline(mockApiData, '12345', mockApiData.matchInfo);
    assert.ok(result.meta, 'meta missing');
    assert.ok(result.overall, 'overall missing');
    assert.ok(result.modules, 'modules missing');
    assert.ok(Array.isArray(result.recommendations), 'recommendations must be array');
    assert.ok(Array.isArray(result.insights), 'insights must be array');
  });

  await test('pipeline computes module scores within 0-100', async () => {
    const r = await runPipeline(mockApiData, '12345', mockApiData.matchInfo);
    for (const key of ['heroPerformance', 'itemization', 'combat', 'benchmarks']) {
      const s = r.modules[key].score;
      assert.ok(s >= 0 && s <= 100, `${key} score out of range: ${s}`);
    }
  });

  await test('pipeline computes overall impact score within 0-100', async () => {
    const r = await runPipeline(mockApiData, '12345', mockApiData.matchInfo);
    assert.ok(r.overall.impactScore >= 0 && r.overall.impactScore <= 100);
    assert.ok(typeof r.overall.letterGrade === 'string');
  });

  await test('pipeline handles missing matchInHistory gracefully', async () => {
    const data = { ...mockApiData, matchInHistory: null };
    const r = await runPipeline(data, '12345', mockApiData.matchInfo);
    assert.ok(r.modules.combat.note || typeof r.modules.combat.score === 'number');
  });

  await test('pipeline generates at least one recommendation', async () => {
    const r = await runPipeline(mockApiData, '12345', mockApiData.matchInfo);
    assert.ok(r.recommendations.length > 0);
  });

  await test('pipeline extracts items from matchInfo players', async () => {
    const matchInfoWithItems = {
      match_id: 12345,
      duration_s: 2000,
      players: [
        { account_id: 12345, item_ids: [1001, 1002, 1003] },
      ],
    };
    const r = await runPipeline(mockApiData, '12345', matchInfoWithItems);
    assert.strictEqual(r.modules.itemization.items.length, 3);
    assert.ok(!String(r.modules.buildPath.summary || '').includes('No items found for this match'));
  });

  console.log(`\n  ${test.passed} passed / ${test.failed} failed`);
  if (test.failed > 0) process.exitCode = 1;
})();
