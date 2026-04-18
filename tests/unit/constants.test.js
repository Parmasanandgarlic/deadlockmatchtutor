/**
 * Unit Tests: server/utils/constants.js
 * Validates game-constant integrity — ensures nobody accidentally mutates
 * shared config objects that the entire pipeline depends on.
 */
const assert = require('assert');
const {
  PHASES,
  FLOATING_SOULS_THRESHOLD,
  NEUTRAL_CAMP_TIERS,
  NEUTRAL_BASELINES,
  ITEM_COST_TIERS,
  TEAMFIGHT,
  OBJECTIVES,
  MID_BOSS_PROXIMITY_RADIUS,
  MODULE_WEIGHTS,
  GRADE_THRESHOLDS,
} = require('../../server/utils/constants');

function test(name, fn) {
  try { fn(); console.log(`  PASS  ${name}`); test.passed++; }
  catch (err) { console.error(`  FAIL  ${name}`); console.error(`        ${err.message}`); test.failed++; }
}
test.passed = 0; test.failed = 0;

console.log('\n[Unit] constants.js');

test('PHASES: laning ends at 600s, mid starts at 600s', () => {
  assert.strictEqual(PHASES.LANING.end, 600);
  assert.strictEqual(PHASES.MID_GAME.start, 600);
});

test('PHASES: late game extends to Infinity', () => {
  assert.strictEqual(PHASES.LATE_GAME.end, Infinity);
});

test('MODULE_WEIGHTS sum to 1.0', () => {
  const sum = Object.values(MODULE_WEIGHTS).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1.0) < 0.001, `weights sum to ${sum}, expected 1.0`);
});

test('GRADE_THRESHOLDS: sorted descending by min', () => {
  for (let i = 1; i < GRADE_THRESHOLDS.length; i++) {
    assert.ok(
      GRADE_THRESHOLDS[i - 1].min >= GRADE_THRESHOLDS[i].min,
      `threshold[${i - 1}].min (${GRADE_THRESHOLDS[i - 1].min}) should be >= threshold[${i}].min (${GRADE_THRESHOLDS[i].min})`
    );
  }
});

test('GRADE_THRESHOLDS: lowest threshold is 0 (F)', () => {
  const last = GRADE_THRESHOLDS[GRADE_THRESHOLDS.length - 1];
  assert.strictEqual(last.min, 0);
  assert.strictEqual(last.grade, 'F');
});

test('GRADE_THRESHOLDS: highest is A+ at 90', () => {
  assert.strictEqual(GRADE_THRESHOLDS[0].min, 90);
  assert.strictEqual(GRADE_THRESHOLDS[0].grade, 'A+');
});

test('ITEM_COST_TIERS: ascending order BASIC < MID < HIGH < ULTRA', () => {
  assert.ok(ITEM_COST_TIERS.BASIC < ITEM_COST_TIERS.MID);
  assert.ok(ITEM_COST_TIERS.MID < ITEM_COST_TIERS.HIGH);
  assert.ok(ITEM_COST_TIERS.HIGH < ITEM_COST_TIERS.ULTRA);
});

test('TEAMFIGHT: minimum participants >= 2', () => {
  assert.ok(TEAMFIGHT.MIN_PARTICIPANTS >= 2);
});

test('NEUTRAL_BASELINES: carry has highest tier1 baseline', () => {
  assert.ok(NEUTRAL_BASELINES.carry.tier1 > NEUTRAL_BASELINES.support.tier1);
});

test('FLOATING_SOULS_THRESHOLD is a positive number', () => {
  assert.ok(FLOATING_SOULS_THRESHOLD > 0);
});

test('OBJECTIVES: all entity names are strings', () => {
  for (const [key, val] of Object.entries(OBJECTIVES)) {
    assert.strictEqual(typeof val, 'string', `OBJECTIVES.${key} should be a string`);
  }
});

console.log(`\n  ${test.passed} passed / ${test.failed} failed`);
if (test.failed > 0) process.exitCode = 1;
