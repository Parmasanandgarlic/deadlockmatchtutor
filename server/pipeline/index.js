const { generateInsights } = require('./insights.engine');
const { computeOverallScore } = require('./scoring.engine');
const logger = require('../utils/logger');

/**
 * Master ETL Pipeline (API-based)
 *
 * Orchestrates the full analysis flow using Deadlock API data instead of .dem parsing:
 *   1. Analyze hero-specific performance from API stats
 *   2. Analyze itemization from match history
 *   3. Compare against benchmarks (top-ranked players)
 *   4. Generate recommendations
 *   5. Compute overall Impact Score
 *   6. Return a single JSON payload ready for the frontend
 *
 * @param {Object} apiData          API data structure from analysis controller
 * @param {string} accountId        The account ID of the player to analyze
 * @param {Object} matchInfo        Match metadata from the Deadlock API
 * @returns {Object}               Complete analysis payload
 */
async function runPipeline(apiData, accountId, matchInfo = {}) {
  logger.info(`Starting API-based analysis pipeline for account ${accountId}`);
  const startTime = Date.now();

  const { matchInHistory, heroStats, accountStats, rankPredict, playerCard, heroId } = apiData;

  // ---- Module 1: Hero Performance Analysis ----
  const heroPerformance = analyzeHeroPerformance(heroStats, matchInHistory);

  // ---- Module 2: Itemization Analysis ----
  const itemization = analyzeItemizationFromMatch(matchInHistory, heroStats);

  // ---- Module 3: Combat & KDA Analysis ----
  const combat = analyzeCombatFromStats(matchInHistory, heroStats);

  // ---- Module 4: Benchmark Comparison ----
  const benchmarks = compareAgainstBenchmarks(heroStats, accountStats, heroId);

  // ---- Recommendations ----
  const recommendations = generateRecommendations(heroPerformance, itemization, combat, benchmarks);

  // ---- Insights ----
  const insights = generateInsights(heroPerformance, itemization, combat, benchmarks);

  // ---- Overall Score ----
  const overall = computeOverallScore({
    heroPerformance: heroPerformance.score,
    itemization: itemization.score,
    combat: combat.score,
    benchmarks: benchmarks.score,
  });

  const elapsed = Date.now() - startTime;
  logger.info(`Pipeline complete in ${elapsed}ms`);

  return {
    meta: {
      matchId: matchInfo.match_id || matchInfo.matchId || null,
      accountId,
      heroId,
      heroName: matchInHistory?.hero_name || 'Unknown',
      duration: matchInfo?.duration_seconds || matchInHistory?.duration || 0,
      analyzedAt: new Date().toISOString(),
      pipelineMs: elapsed,
      rankPredict: rankPredict,
    },
    overall,
    modules: {
      heroPerformance,
      itemization,
      combat,
      benchmarks,
    },
    recommendations,
    insights,
  };
}

/**
 * Analyze hero-specific performance from API stats
 */
function analyzeHeroPerformance(heroStats, matchInHistory) {
  if (!heroStats) {
    return {
      score: 50,
      winrate: 0,
      matchesPlayed: 0,
      avgKda: 0,
      note: 'Hero stats not available',
    };
  }

  const winrate = heroStats.win_rate || heroStats.winrate || 0;
  const matchesPlayed = heroStats.matches_played || heroStats.matches || 0;
  const avgKda = heroStats.avg_kda || heroStats.kda || 0;
  const avgSouls = heroStats.avg_souls || 0;
  const avgDamage = heroStats.avg_damage || 0;

  // Score calculation based on winrate, KDA, and performance
  let score = 50;
  score += Math.min(winrate / 100 * 30, 30); // Up to +30 for winrate
  score += Math.min((avgKda - 1) / 4 * 20, 20); // Up to +20 for KDA (assuming 5.0 is excellent)

  return {
    score: Math.round(Math.max(0, Math.min(100, score))),
    winrate: Math.round(winrate * 10) / 10,
    matchesPlayed,
    avgKda: Math.round(avgKda * 10) / 10,
    avgSouls: Math.round(avgSouls),
    avgDamage: Math.round(avgDamage),
  };
}

/**
 * Analyze itemization from match history
 */
function analyzeItemizationFromMatch(matchInHistory, heroStats) {
  if (!matchInHistory) {
    return {
      score: 50,
      items: [],
      note: 'Match data not available',
    };
  }

  const items = matchInHistory.items || matchInHistory.build || [];
  const netWorth = matchInHistory.net_worth || matchInHistory.netWorth || 0;
  const souls = matchInHistory.souls || 0;

  // Simple scoring based on net worth efficiency
  // In a full implementation, this would compare against average net worth for this hero/match duration
  let score = 60;
  if (netWorth > 0) {
    score += Math.min((netWorth / 10000) * 10, 20); // Up to +20 for high net worth
  }

  return {
    score: Math.round(Math.max(0, Math.min(100, score))),
    items: items.map(item => ({
      id: item.id,
      name: item.name,
      cost: item.cost,
    })),
    netWorth: Math.round(netWorth),
    souls: Math.round(souls),
  };
}

/**
 * Analyze combat performance from match stats
 */
function analyzeCombatFromStats(matchInHistory, heroStats) {
  if (!matchInHistory) {
    return {
      score: 50,
      kills: 0,
      deaths: 0,
      assists: 0,
      kda: 0,
      note: 'Match data not available',
    };
  }

  const kills = matchInHistory.kills || 0;
  const deaths = matchInHistory.deaths || 0;
  const assists = matchInHistory.assists || 0;
  const damage = matchInHistory.damage || matchInHistory.hero_damage || 0;
  const kda = deaths > 0 ? (kills + assists) / deaths : kills + assists;

  // Combat score based on KDA and damage contribution
  let score = 50;
  score += Math.min(kda / 5 * 25, 25); // Up to +25 for KDA
  score += Math.min(damage / 20000 * 15, 15); // Up to +15 for damage

  return {
    score: Math.round(Math.max(0, Math.min(100, score))),
    kills,
    deaths,
    assists,
    kda: Math.round(kda * 10) / 10,
    damage: Math.round(damage),
  };
}

/**
 * Compare user stats against benchmarks (top-ranked players)
 */
function compareAgainstBenchmarks(heroStats, accountStats, heroId) {
  // In a full implementation, this would fetch leaderboard data for the hero
  // and compare the user's stats against the top 10% of players
  // For now, we'll use the hero stats to create a baseline comparison

  const userWinrate = heroStats?.win_rate || heroStats?.winrate || 0;
  const userKda = heroStats?.avg_kda || heroStats?.kda || 0;

  // Benchmark values (these should come from leaderboard API)
  const benchmarkWinrate = 55; // Top players typically have >55% winrate
  const benchmarkKda = 3.0; // Top players typically have >3.0 KDA

  const winrateDiff = userWinrate - benchmarkWinrate;
  const kdaDiff = userKda - benchmarkKda;

  // Score based on how close to benchmarks
  let score = 50;
  score += Math.min((userWinrate / benchmarkWinrate) * 20, 20);
  score += Math.min((userKda / benchmarkKda) * 20, 20);

  return {
    score: Math.round(Math.max(0, Math.min(100, score))),
    userWinrate: Math.round(userWinrate * 10) / 10,
    benchmarkWinrate,
    winrateDiff: Math.round(winrateDiff * 10) / 10,
    userKda: Math.round(userKda * 10) / 10,
    benchmarkKda,
    kdaDiff: Math.round(kdaDiff * 10) / 10,
    percentile: Math.round(score), // Rough percentile estimate
    note: 'Benchmark comparison based on hero-level averages. Full leaderboard integration pending.',
  };
}

/**
 * Generate actionable recommendations based on analysis
 */
function generateRecommendations(heroPerformance, itemization, combat, benchmarks) {
  const recommendations = [];

  // Hero performance recommendations
  if (heroPerformance.winrate < 45) {
    recommendations.push({
      type: 'hero',
      priority: 'high',
      title: 'Improve Hero Winrate',
      description: `Your winrate on this hero (${heroPerformance.winrate}%) is below average. Consider practicing in unranked matches or reviewing your gameplay.`,
    });
  }

  if (heroPerformance.avgKda < 2.0) {
    recommendations.push({
      type: 'combat',
      priority: 'medium',
      title: 'Focus on Survival',
      description: `Your KDA (${heroPerformance.avgKda}) suggests you may be dying too often. Focus on positioning and retreat timing.`,
    });
  }

  // Itemization recommendations
  if (itemization.netWorth < 5000 && itemization.souls > 0) {
    recommendations.push({
      type: 'economy',
      priority: 'high',
      title: 'Improve Farm Efficiency',
      description: `Your net worth (${itemization.netWorth}) seems low for your souls. Focus on efficient farming and timely item purchases.`,
    });
  }

  // Benchmark recommendations
  if (benchmarks.winrateDiff < -10) {
    recommendations.push({
      type: 'benchmark',
      priority: 'high',
      title: 'Gap to Top Players',
      description: `Your winrate is ${Math.abs(benchmarks.winrateDiff)}% below top player benchmarks. Study high-level gameplay for this hero.`,
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      type: 'general',
      priority: 'low',
      title: 'Good Performance',
      description: 'Your stats look solid. Continue refining your gameplay to climb the ranks.',
    });
  }

  return recommendations;
}

module.exports = { runPipeline };
