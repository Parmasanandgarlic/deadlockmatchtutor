const { generateInsights } = require('./insights.engine');
const { computeOverallScore } = require('./scoring.engine');
const { getHeroName } = require('../utils/heroes');
const { getRankInfo } = require('../utils/ranks');
const logger = require('../utils/logger');

/**
 * Master ETL Pipeline (API-based)
 *
 * Orchestrates the full analysis flow using Deadlock API data. Every module
 * grades the SPECIFIC match the user selected, using their career statistics
 * purely as a personalised benchmark — not as the analysis subject itself.
 *
 *   1. Match Performance  – KDA, souls, damage, kill participation for THIS game
 *   2. Itemization        – final build, net worth efficiency vs match duration
 *   3. Combat             – fight-level output (damage/min, K/D, obj participation)
 *   4. Benchmarks         – how THIS match compares to your hero career average
 *
 * @param {Object} apiData          API data structure from analysis controller
 * @param {string} accountId        The account ID of the player to analyze
 * @param {Object} matchInfo        Full match info from the Deadlock API
 * @returns {Object}                Complete analysis payload
 */
async function runPipeline(apiData, accountId, matchInfo = {}) {
  logger.info(`Starting API-based analysis pipeline for account ${accountId}`);
  const startTime = Date.now();

  const { matchInHistory, heroStats, accountStats, rankPredict, playerCard, heroId } = apiData;

  // Derive match-level context (duration, result) with robust fallbacks.
  const durationSeconds = Number(
    matchInfo?.duration_s ||
    matchInfo?.match_duration_s ||
    matchInHistory?.match_duration_s ||
    matchInHistory?.duration_s ||
    0
  );
  const durationMinutes = durationSeconds > 0 ? durationSeconds / 60 : 0;

  const won = deriveMatchResult(matchInHistory, matchInfo, accountId);
  const matchStartTime =
    matchInHistory?.start_time || matchInHistory?.match_start_time || matchInfo?.start_time || null;

  const normalizedHeroStats = normalizeHeroStats(heroStats);

  // ---- Module 1: Match Performance (this specific match) ----
  const heroPerformance = analyzeMatchPerformance({
    matchInHistory,
    normalizedHeroStats,
    durationMinutes,
    won,
  });

  // ---- Module 2: Itemization Analysis ----
  const itemization = analyzeItemizationFromMatch(matchInHistory, durationMinutes);

  // ---- Module 3: Combat & KDA Analysis ----
  const combat = analyzeCombatFromStats(matchInHistory, durationMinutes);

  // ---- Module 4: Benchmark Comparison (match vs career) ----
  const benchmarks = compareAgainstBenchmarks(matchInHistory, normalizedHeroStats, durationMinutes);

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
      matchId: matchInfo?.match_id || matchInfo?.matchId || matchInHistory?.match_id || null,
      accountId,
      heroId,
      heroName: getHeroName(heroId),
      duration: durationSeconds,
      won,
      startTime: matchStartTime,
      analyzedAt: new Date().toISOString(),
      pipelineMs: elapsed,
      rankPredict: summarizeRankPrediction(rankPredict),
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

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

/**
 * The Deadlock community API has returned win_rate both as 0-1 (decimal) and
 * 0-100 (percent) depending on the endpoint / version. Normalise to 0-100 by
 * assuming anything ≤ 1 is a fraction.
 */
function normalizeHeroStats(raw) {
  if (!raw || typeof raw !== 'object') {
    return { winrate: 0, matchesPlayed: 0, avgKda: 0, avgSouls: 0, avgDamage: 0 };
  }
  let winrate = raw.win_rate ?? raw.winrate ?? 0;
  if (winrate > 0 && winrate <= 1) winrate = winrate * 100; // fraction → percent
  return {
    winrate,
    matchesPlayed: raw.matches_played ?? raw.matches ?? 0,
    avgKda: raw.avg_kda ?? raw.kda ?? 0,
    avgSouls: raw.avg_souls ?? raw.avg_net_worth ?? 0,
    avgDamage: raw.avg_damage ?? raw.avg_hero_damage ?? 0,
  };
}

/**
 * Determine whether the target player won this match. Handles the several
 * shapes the API can return.
 */
function deriveMatchResult(matchInHistory, matchInfo, accountId) {
  if (matchInHistory) {
    if (typeof matchInHistory.player_team_won === 'boolean') return matchInHistory.player_team_won;
    if (typeof matchInHistory.won === 'boolean') return matchInHistory.won;
    if (matchInHistory.match_result != null && matchInHistory.player_team != null) {
      return Number(matchInHistory.match_result) === Number(matchInHistory.player_team);
    }
  }
  if (matchInfo && Array.isArray(matchInfo.players) && matchInfo.winning_team != null) {
    const player = matchInfo.players.find(
      (p) => Number(p.account_id) === Number(accountId)
    );
    if (player) return Number(player.team) === Number(matchInfo.winning_team);
  }
  return null;
}

function summarizeRankPrediction(rankPredict) {
  if (!rankPredict || typeof rankPredict !== 'object') return null;
  // Handle both array (per-match prediction list) and object (aggregate) shapes
  if (Array.isArray(rankPredict)) {
    const latest = rankPredict[0];
    if (!latest) return null;
    const badge = latest.rank ?? latest.predicted_rank ?? latest.badge ?? null;
    const rankInfo = getRankInfo(badge);
    return {
      badge,
      rank: latest.rank ?? latest.predicted_rank ?? null,
      division: latest.division ?? null,
      label: latest.rank_name || latest.label || rankInfo.name,
      rankName: rankInfo.name,
      rankImageUrl: rankInfo.imageUrl,
    };
  }
  const badge = rankPredict.rank ?? rankPredict.predicted_rank ?? rankPredict.badge ?? null;
  const rankInfo = getRankInfo(badge);
  return {
    badge,
    rank: rankPredict.rank ?? rankPredict.predicted_rank ?? null,
    division: rankPredict.division ?? null,
    label: rankPredict.rank_name || rankPredict.label || rankInfo.name,
    rankName: rankInfo.name,
    rankImageUrl: rankInfo.imageUrl,
  };
}

function perMinute(value, durationMinutes) {
  if (!durationMinutes || durationMinutes <= 0) return 0;
  return value / durationMinutes;
}

function roundTo(value, decimals = 1) {
  const mult = Math.pow(10, decimals);
  return Math.round(value * mult) / mult;
}

// ----------------------------------------------------------------
// Module analyzers
// ----------------------------------------------------------------

/**
 * Module 1 – Match Performance.
 * Grades the specific match using: kill participation, match KDA, souls/min,
 * damage/min. Career stats are included for context but do NOT drive the score.
 */
function analyzeMatchPerformance({ matchInHistory, normalizedHeroStats, durationMinutes, won }) {
  if (!matchInHistory) {
    return {
      score: 50,
      winrate: normalizedHeroStats.winrate,
      matchesPlayed: normalizedHeroStats.matchesPlayed,
      avgKda: normalizedHeroStats.avgKda,
      avgSouls: normalizedHeroStats.avgSouls,
      avgDamage: normalizedHeroStats.avgDamage,
      note: 'Match-level data unavailable — showing career averages only.',
    };
  }

  const kills = matchInHistory.player_kills ?? matchInHistory.kills ?? 0;
  const deaths = matchInHistory.player_deaths ?? matchInHistory.deaths ?? 0;
  const assists = matchInHistory.player_assists ?? matchInHistory.assists ?? 0;
  const netWorth = matchInHistory.net_worth ?? matchInHistory.netWorth ?? 0;
  const damage = matchInHistory.player_damage ?? matchInHistory.damage ?? matchInHistory.hero_damage ?? 0;

  const matchKda = deaths > 0 ? (kills + assists) / deaths : kills + assists;
  const soulsPerMin = perMinute(netWorth, durationMinutes);
  const damagePerMin = perMinute(damage, durationMinutes);

  // --- Scoring -------------------------------------------------
  // Baseline 50, up to +35 KDA, +10 economy, +10 damage, +5 victory bonus.
  let score = 50;
  score += Math.min(matchKda / 5 * 35, 35);              // 5.0 KDA = max
  score += Math.min(soulsPerMin / 700 * 10, 10);         // 700 souls/min = strong
  score += Math.min(damagePerMin / 1000 * 10, 10);       // 1000 dmg/min = strong
  if (won === true) score += 5;

  return {
    score: Math.round(Math.max(0, Math.min(100, score))),
    // Match-level numbers
    matchKda: roundTo(matchKda, 2),
    soulsPerMin: Math.round(soulsPerMin),
    damagePerMin: Math.round(damagePerMin),
    // Career context
    winrate: roundTo(normalizedHeroStats.winrate, 1),
    matchesPlayed: normalizedHeroStats.matchesPlayed,
    avgKda: roundTo(normalizedHeroStats.avgKda, 2),
    avgSouls: Math.round(normalizedHeroStats.avgSouls),
    avgDamage: Math.round(normalizedHeroStats.avgDamage),
  };
}

/**
 * Module 2 – Itemization.
 * Grades final build value against an expected souls/minute benchmark.
 */
function analyzeItemizationFromMatch(matchInHistory, durationMinutes) {
  if (!matchInHistory) {
    return { score: 50, items: [], netWorth: 0, souls: 0, soulsPerMin: 0, note: 'Match data not available.' };
  }

  const items = matchInHistory.items || matchInHistory.build || [];
  const netWorth = matchInHistory.net_worth ?? matchInHistory.netWorth ?? 0;
  const souls = matchInHistory.souls ?? matchInHistory.last_hits ?? 0;
  const soulsPerMin = perMinute(netWorth, durationMinutes);

  // Strong benchmark: ~700 souls/min (good core hero), weak: ~350.
  let score = 50;
  if (soulsPerMin > 0) {
    score += Math.min(((soulsPerMin - 350) / 350) * 40, 40); // up to +40 for 700+ soul/min
  } else if (netWorth > 0) {
    // Fallback when duration unknown
    score += Math.min((netWorth / 30000) * 30, 30);
  }
  score = Math.max(0, Math.min(100, score));

  return {
    score: Math.round(score),
    items: Array.isArray(items)
      ? items.map((item) => ({
          id: item.id ?? item.item_id ?? null,
          name: item.name ?? item.item_name ?? null,
          cost: item.cost ?? item.item_cost ?? 0,
        }))
      : [],
    netWorth: Math.round(netWorth),
    souls: Math.round(souls),
    soulsPerMin: Math.round(soulsPerMin),
  };
}

/**
 * Module 3 – Combat.
 * Grades fight output in THIS match (damage/min, KDA, death rate).
 */
function analyzeCombatFromStats(matchInHistory, durationMinutes) {
  if (!matchInHistory) {
    return {
      score: 50,
      kills: 0,
      deaths: 0,
      assists: 0,
      kda: 0,
      damage: 0,
      damagePerMin: 0,
      deathsPerMin: 0,
      note: 'Match data not available.',
    };
  }

  const kills = matchInHistory.player_kills ?? matchInHistory.kills ?? 0;
  const deaths = matchInHistory.player_deaths ?? matchInHistory.deaths ?? 0;
  const assists = matchInHistory.player_assists ?? matchInHistory.assists ?? 0;
  const damage = matchInHistory.player_damage ?? matchInHistory.damage ?? matchInHistory.hero_damage ?? 0;
  const kda = deaths > 0 ? (kills + assists) / deaths : kills + assists;
  const damagePerMin = perMinute(damage, durationMinutes);
  const deathsPerMin = perMinute(deaths, durationMinutes);

  let score = 50;
  score += Math.min(kda / 5 * 25, 25);                   // KDA component
  score += Math.min(damagePerMin / 1000 * 20, 20);       // damage/min component
  score -= Math.min(deathsPerMin * 25, 15);              // penalty for dying often
  score = Math.max(0, Math.min(100, score));

  return {
    score: Math.round(score),
    kills,
    deaths,
    assists,
    kda: roundTo(kda, 2),
    damage: Math.round(damage),
    damagePerMin: Math.round(damagePerMin),
    deathsPerMin: roundTo(deathsPerMin, 2),
  };
}

/**
 * Module 4 – Benchmark Comparison.
 * Compares THIS match's KDA and souls-per-min to the player's career averages
 * on this hero. If career data is missing, falls back to community benchmarks.
 */
function compareAgainstBenchmarks(matchInHistory, normalizedHeroStats, durationMinutes) {
  const kills = matchInHistory?.player_kills ?? matchInHistory?.kills ?? 0;
  const deaths = matchInHistory?.player_deaths ?? matchInHistory?.deaths ?? 0;
  const assists = matchInHistory?.player_assists ?? matchInHistory?.assists ?? 0;
  const netWorth = matchInHistory?.net_worth ?? matchInHistory?.netWorth ?? 0;
  const matchKda = deaths > 0 ? (kills + assists) / deaths : kills + assists;
  const matchSoulsPerMin = perMinute(netWorth, durationMinutes);

  const careerKda = normalizedHeroStats.avgKda || 0;
  // Derive career souls-per-min only if we have an avg duration, otherwise fall back to 550.
  const avgSouls = normalizedHeroStats.avgSouls || 0;
  const careerSoulsPerMin = avgSouls > 0 ? avgSouls / 30 : 0; // assume 30-min avg games if unknown
  const careerWinrate = normalizedHeroStats.winrate || 0;

  const kdaDiff = matchKda - careerKda;
  const soulsDiff = matchSoulsPerMin - careerSoulsPerMin;

  // Personalised percentile: how THIS match compares to your own average.
  let score = 50;
  if (careerKda > 0) score += Math.min((kdaDiff / careerKda) * 25, 25);
  if (careerSoulsPerMin > 0) score += Math.min((soulsDiff / careerSoulsPerMin) * 25, 25);
  score = Math.max(0, Math.min(100, score));

  return {
    score: Math.round(score),
    // "user" = this specific match, "benchmark" = career average on this hero
    userWinrate: roundTo(careerWinrate, 1),
    benchmarkWinrate: 50,
    winrateDiff: roundTo(careerWinrate - 50, 1),
    userKda: roundTo(matchKda, 2),
    benchmarkKda: roundTo(careerKda, 2),
    kdaDiff: roundTo(kdaDiff, 2),
    userSoulsPerMin: Math.round(matchSoulsPerMin),
    benchmarkSoulsPerMin: Math.round(careerSoulsPerMin),
    percentile: Math.round(score),
    note: careerKda > 0
      ? 'Comparison is against your own career average on this hero.'
      : 'Career data unavailable — using community benchmarks.',
  };
}

/**
 * Actionable recommendations derived from the match-level modules.
 */
function generateRecommendations(heroPerformance, itemization, combat, benchmarks) {
  const recommendations = [];

  if (combat.deaths >= 8 && combat.kills < combat.deaths) {
    recommendations.push({
      type: 'combat',
      priority: 'high',
      title: 'Reduce Deaths',
      description: `You died ${combat.deaths} times this match with only ${combat.kills} kills. Focus on map awareness, stick with teammates, and disengage when you are low or out of position.`,
    });
  }

  if (combat.damagePerMin < 500 && combat.kda < 2) {
    recommendations.push({
      type: 'combat',
      priority: 'medium',
      title: 'Increase Fight Output',
      description: `You dealt ${combat.damagePerMin}/min — below an average of 1,000. Try to participate in more team fights and stay active in skirmishes.`,
    });
  }

  if (itemization.soulsPerMin > 0 && itemization.soulsPerMin < 450) {
    recommendations.push({
      type: 'economy',
      priority: 'high',
      title: 'Improve Farm Efficiency',
      description: `Only ${itemization.soulsPerMin} souls/min — strong players average 600+. Prioritise last-hitting, clear jungle camps, and avoid long AFK spells between fights.`,
    });
  }

  if (benchmarks.kdaDiff < -1 && benchmarks.userKda !== 0) {
    recommendations.push({
      type: 'benchmark',
      priority: 'medium',
      title: 'Below Your Own Average',
      description: `Your match KDA (${benchmarks.userKda}) is ${Math.abs(benchmarks.kdaDiff)} below your career average (${benchmarks.benchmarkKda}). Review this game's fights to spot what went wrong.`,
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      type: 'general',
      priority: 'low',
      title: 'Clean Performance',
      description: 'This match is aligned with or above your career baselines. Keep drilling the fundamentals and climbing.',
    });
  }

  return recommendations;
}

module.exports = { runPipeline };
