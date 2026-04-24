/**
 * Regression Testing
 *
 * Automated suite that verifies critical business logic hasn't regressed
 * after code changes. Exercises the full pipeline with known inputs and
 * asserts exact or bounded expected outputs.
 *
 * Run after every commit to catch unintended side effects.
 */
const assert = require('assert');
const { runPipeline } = require('../../server/pipeline');
const { computeOverallScore, scoreToGrade } = require('../../server/pipeline/scoring.engine');
const { generateInsights } = require('../../server/pipeline/insights.engine');
const {
  tickToSeconds, formatTime, clamp, safeDivide,
  normalizeSteamInput, steam64ToSteam32, steam32ToSteam64,
} = require('../../server/utils/helpers');
const fs = require('fs');
const path = require('path');

async function test(name, fn) {
  try { await fn(); console.log(`  PASS  ${name}`); test.passed++; }
  catch (err) { console.error(`  FAIL  ${name}`); console.error(`        ${err.message}`); test.failed++; }
}
test.passed = 0; test.failed = 0;

console.log('\n[Regression] Core business logic');

// ---- Known-input pipeline snapshot ----
test('Pipeline: known match input produces expected grade range', async () => {
  const data = {
    matchInHistory: {
      match_id: 100, hero_id: 7,
      player_kills: 10, player_deaths: 4, player_assists: 8,
      net_worth: 25000, player_damage: 30000,
    },
    heroStats: { matches_played: 50, win_rate: 55, avg_kda: 3.0, avg_net_worth: 20000 },
    accountStats: {}, rankPredict: {}, playerCard: {}, heroId: 7,
  };
  const matchInfo = { match_id: 100, duration_s: 1800 };
  const result = await runPipeline(data, '42', matchInfo);

  // With 10/4/8 KDA, 25k NW in 30min (833 souls/min), score should be solidly B+ or above
  assert.ok(result.overall.impactScore >= 65, `expected >= 65, got ${result.overall.impactScore}`);
  assert.ok(result.overall.impactScore <= 100, `expected <= 100, got ${result.overall.impactScore}`);
  assert.ok(['A+', 'A', 'A-', 'B+', 'B'].includes(result.overall.letterGrade),
    `expected B or above, got ${result.overall.letterGrade}`);
});

test('Pipeline: terrible game produces low score', async () => {
  const data = {
    matchInHistory: {
      match_id: 200, hero_id: 3,
      player_kills: 1, player_deaths: 14, player_assists: 2,
      net_worth: 6000, player_damage: 5000,
    },
    heroStats: { matches_played: 10, win_rate: 35, avg_kda: 1.5 },
    accountStats: {}, rankPredict: {}, playerCard: {}, heroId: 3,
  };
  const matchInfo = { match_id: 200, duration_s: 2400 };
  const result = await runPipeline(data, '99', matchInfo);

  assert.ok(result.overall.impactScore <= 55, `expected <= 55, got ${result.overall.impactScore}`);
});

// ---- Scoring determinism ----
test('Scoring: identical inputs always produce identical output', () => {
  const input = { heroPerformance: 72, itemization: 65, combat: 80, benchmarks: 55 };
  const a = computeOverallScore(input);
  const b = computeOverallScore(input);
  assert.strictEqual(a.impactScore, b.impactScore);
  assert.strictEqual(a.letterGrade, b.letterGrade);
});

test('Scoring: grade boundaries are exact', () => {
  assert.strictEqual(scoreToGrade(90), 'A+');
  assert.strictEqual(scoreToGrade(89), 'A');
  assert.strictEqual(scoreToGrade(85), 'A');
  assert.strictEqual(scoreToGrade(0), 'F');
  assert.strictEqual(scoreToGrade(35), 'D-');
  assert.strictEqual(scoreToGrade(34), 'F');
});

// ---- Helper function contracts ----
test('Helpers: steam ID roundtrip is lossless', () => {
  const ids = ['76561198000000000', '76561198131604774', '76561197960287930'];
  for (const id of ids) {
    const s32 = steam64ToSteam32(id);
    const back = steam32ToSteam64(s32);
    assert.strictEqual(back, id, `roundtrip failed for ${id}`);
  }
});

test('Helpers: normalizeSteamInput handles all documented formats', () => {
  const cases = [
    { input: '76561198000000000', type: 'steam64' },
    { input: '123456789', type: 'steam32' },
    { input: 'https://steamcommunity.com/profiles/76561198000000000', type: 'steam64' },
    { input: 'https://steamcommunity.com/id/gaben', type: 'vanity' },
    { input: 'gaben', type: 'vanity' },
    { input: '', type: 'unknown' },
  ];
  for (const { input, type } of cases) {
    const r = normalizeSteamInput(input);
    assert.strictEqual(r.type, type, `expected "${type}" for "${input}", got "${r.type}"`);
  }
});

test('Helpers: formatTime edge cases', () => {
  assert.strictEqual(formatTime(0), '0:00');
  assert.strictEqual(formatTime(59), '0:59');
  assert.strictEqual(formatTime(60), '1:00');
  assert.strictEqual(formatTime(3661), '61:01');
});

test('Helpers: clamp + safeDivide edge cases', () => {
  assert.strictEqual(clamp(NaN, 0, 100), NaN);
  assert.strictEqual(safeDivide(0, 0), 0);
  assert.strictEqual(safeDivide(100, null), 0);
  assert.strictEqual(safeDivide(10, 5), 2);
});

// ---- Insights contract ----
test('Insights: never returns undefined severity or module', () => {
  const heroPerf = { soulsPerMin: 300, matchKda: 1, deaths: 10 };
  const item = { soulsPerMin: 300, netWorth: 8000, items: [] };
  const combat = { kda: 1, deaths: 10, kills: 3, damagePerMin: 400, deathsPerMin: 0.6 };
  const bench = { kdaDiff: -2, benchmarkKda: 3, userKda: 1 };
  const meta = { duration: 1800, won: false };
  const insights = generateInsights(heroPerf, item, combat, bench, meta);
  for (const i of insights) {
    assert.ok(i.severity, `insight "${i.title}" has no severity`);
    assert.ok(i.module, `insight "${i.title}" has no module`);
  }
});

// ---- UI regression guard ----
test('Client: never renders raw {error} in JSX', () => {
  const clientRoot = path.join(__dirname, '..', '..', 'client', 'src');
  const exts = new Set(['.jsx', '.tsx']);

  function walk(dir, out) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full, out);
      else if (exts.has(path.extname(e.name))) out.push(full);
    }
    return out;
  }

  const files = walk(clientRoot, []);
  const offenders = [];
  const jsxRawErrorPattern = />\s*\{\s*error\s*\}\s*</g;

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    if (!jsxRawErrorPattern.test(text)) continue;

    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(jsxRawErrorPattern)) {
        offenders.push(`${path.relative(path.join(__dirname, '..', '..'), file)}:${i + 1}`);
      }
    }
  }

  assert.strictEqual(
    offenders.length,
    0,
    `Found raw JSX {error} render(s). Use toErrorMessage(error) or error.message instead:\n- ${offenders.join('\n- ')}`
  );
});

console.log(`\n  ${test.passed} passed / ${test.failed} failed`);
if (test.failed > 0) process.exitCode = 1;
