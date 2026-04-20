/* eslint-disable */
// Quick smoke test for the analysis pipeline with synthetic inputs.
// Not a unit test — just verifies nothing throws and the shape looks right.

const { runPipeline } = require('../pipeline');

const apiData = {
  matchInfo: {
    match_id: 123,
    duration_s: 2400,
    winning_team: 0,
    players: [
      { account_id: 42, hero_id: 3, team: 0, net_damage_dealt: 32000, damage_taken: 14000, healing: 500, obj_damage: 9000, net_worth: 28000, souls: 28000, level: 24 },
      { account_id: 2, hero_id: 6, team: 0, net_worth: 22000 },
      { account_id: 3, hero_id: 8, team: 0, net_worth: 18000 },
      { account_id: 4, hero_id: 11, team: 1, net_worth: 30000, rank: 85 },
      { account_id: 5, hero_id: 16, team: 1, net_worth: 24000, rank: 82 },
      { account_id: 6, hero_id: 21, team: 1, net_worth: 26000, rank: 90 },
    ],
  },
  matchInHistory: {
    match_id: 123,
    match_duration_s: 2400,
    hero_id: 3,
    player_kills: 14,
    player_deaths: 5,
    player_assists: 12,
    net_worth: 28000,
    player_damage: 35000,
    player_team: 0,
    match_result: 0,
  },
  matchHistory: Array.from({ length: 25 }, (_, i) => ({
    match_id: 100 + i,
    hero_id: 3,
    match_duration_s: 2000 + i * 20,
    player_kills: 5 + (i % 7),
    player_deaths: 4 + (i % 4),
    player_assists: 6 + (i % 5),
    net_worth: 22000 + i * 300,
    start_time: 1_700_000_000 + i * 3600,
    player_team: 0,
    match_result: i % 2 === 0 ? 0 : 1,
  })),
  heroStats: { win_rate: 0.52, matches_played: 120, avg_kda: 3.1, avg_souls: 26000, avg_damage: 32000 },
  rankPredict: Array.from({ length: 15 }, (_, i) => ({
    match_id: 100 + i,
    rank: 75 + (i % 5),
    start_time: 1_700_000_000 + i * 3600,
  })),
  accountStats: {},
  playerCard: {},
  heroId: 3,
};

(async () => {
  try {
    const result = await runPipeline(apiData, 42, apiData.matchInfo);
    const keys = Object.keys(result.modules);
    const metaKeys = Object.keys(result.meta);
    console.log('modules:', keys.join(','));
    console.log('meta:', metaKeys.join(','));
    console.log('overall:', result.overall.impactScore, result.overall.letterGrade);
    console.log('decisionQuality:', result.modules.decisionQuality.score, result.modules.decisionQuality.grade);
    console.log('matchupDifficulty:', result.modules.matchupDifficulty.score, result.modules.matchupDifficulty.difficulty);
    console.log('buildPath:', result.modules.buildPath.score);
    console.log('rankBenchmarks:', result.modules.rankBenchmarks.score, result.modules.rankBenchmarks.tierName);
    console.log('temporal:', result.meta.temporal.score, result.meta.temporal.trendLabel);
    console.log('mmrHistory:', result.meta.mmrHistory.trend, result.meta.mmrHistory.history.length);
    console.log('recs:', result.recommendations.length);
    console.log('SMOKE OK');
  } catch (err) {
    console.error('SMOKE FAILED:', err.stack);
    process.exit(1);
  }
})();
