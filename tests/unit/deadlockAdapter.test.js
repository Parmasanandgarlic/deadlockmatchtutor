/**
 * Unit Tests: server/adapters/deadlockApi.adapter.js
 */
const assert = require('assert');
const {
  normalizeMatchInfo,
  normalizeMatchHistory,
  normalizeHeroStats,
  findPlayer,
} = require('../../server/adapters/deadlockApi.adapter');

function test(name, fn) {
  try { fn(); console.log(`  PASS  ${name}`); test.passed++; }
  catch (err) { console.error(`  FAIL  ${name}`); console.error(`        ${err.message}`); test.failed++; }
}
test.passed = 0; test.failed = 0;

console.log('\n[Unit] deadlockApi.adapter.js');

test('normalizeMatchInfo maps player aliases to canonical fields', () => {
  const match = normalizeMatchInfo({
    match_id: 42,
    duration_s: 1800,
    winning_team: 1,
    players: [
      {
        account_id: 123,
        hero_id: 7,
        player_kills: 9,
        player_deaths: 2,
        player_assists: 11,
        net_worth: 26000,
        objective_damage: 4000,
        item_ids: [1001, 1002],
      },
    ],
  });

  assert.strictEqual(match.matchId, 42);
  assert.strictEqual(match.durationSeconds, 1800);
  assert.strictEqual(match.winningTeam, 1);
  assert.strictEqual(match.players[0].accountId, 123);
  assert.strictEqual(match.players[0].heroId, 7);
  assert.strictEqual(match.players[0].kills, 9);
  assert.strictEqual(match.players[0].netWorth, 26000);
  assert.deepStrictEqual(match.players[0].items, [1001, 1002]);
});

test('normalizeMatchHistory unwraps envelopes and preserves canonical ids', () => {
  const rows = normalizeMatchHistory({
    matches: [
      { match_id: 99, hero_id: 2, player_team_won: true, duration_seconds: 1200 },
    ],
  });

  assert.strictEqual(rows.length, 1);
  assert.strictEqual(rows[0].matchId, 99);
  assert.strictEqual(rows[0].heroId, 2);
  assert.strictEqual(rows[0].won, true);
  assert.strictEqual(rows[0].durationSeconds, 1200);
});

test('normalizeHeroStats converts fractional winrate to percent', () => {
  const stats = normalizeHeroStats({ hero_id: 2, win_rate: 0.55, matches_played: 20, avg_kda: 2.5 });
  assert.strictEqual(stats.heroId, 2);
  assert.strictEqual(stats.winrate, 55);
  assert.strictEqual(stats.matchesPlayed, 20);
  assert.strictEqual(stats.avgKda, 2.5);
});

test('findPlayer matches numeric and string account ids', () => {
  const match = normalizeMatchInfo({ players: [{ account_id: '123' }] });
  assert.ok(findPlayer(match, 123));
});

console.log(`\n  ${test.passed} passed / ${test.failed} failed`);
if (test.failed > 0) process.exitCode = 1;
