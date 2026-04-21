const { generateInsights } = require('./insights.engine');
const { computeOverallScore } = require('./scoring.engine');
const { getHeroName, getHeroData } = require('../utils/heroes');
const { getRankInfo } = require('../utils/ranks');
const { getItemName, getItemData } = require('../utils/items');
const logger = require('../utils/logger');
const { HERO_ROLES, ROLE_BENCHMARKS } = require('../data/hero-roles');
const { analyzeMatchPerformance } = require('./analyzers/match-performance.analyzer');
const { analyzeRankBenchmarks } = require('./analyzers/rankBenchmarks.analyzer');
const { analyzeTemporal } = require('./analyzers/temporal.analyzer');
const { analyzeMatchupDifficulty } = require('./analyzers/matchupDifficulty.analyzer');
const { analyzeBuildPath } = require('./analyzers/buildPath.analyzer');
const { analyzeDecisionQuality } = require('./analyzers/decisionQuality.analyzer');
const { buildMmrHistory } = require('../services/mmrHistory.service');

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

  const {
    matchInHistory,
    matchHistory = [],
    heroStats,
    accountStats,
    rankPredict,
    playerCard,
    heroId,
  } = apiData;

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

  // Extract granular player stats from matchInfo (requires include_player_stats=true)
  const playerStats = extractGranularPlayerStats(matchInfo, accountId, durationMinutes);

  // ---- Context Building ----
  const heroRole = HERO_ROLES[heroId] || { role: 'brawler', sub_role: 'flex', lane: 'solo' };
  const roleBenchmarks = ROLE_BENCHMARKS[heroRole.role] || ROLE_BENCHMARKS['brawler'];
  
  /** @type {import('./types').AnalysisContext} */
  const analysisContext = {
    matchId: matchInfo?.match_id || matchInfo?.matchId || matchInHistory?.match_id || null,
    accountId,
    heroRole,
    benchmarks: roleBenchmarks,
    matchDuration: durationSeconds,
    isRanked: !!(matchInfo?.game_mode === 'ranked' || matchInfo?.lobby_type === 7)
  };

  // ---- Module 1: Match Performance (Context-Aware) ----
  const heroPerformance = analyzeMatchPerformance({
    playerStats,
    matchInHistory, // for fallback
    normalizedHeroStats,
  }, analysisContext);

  // ---- Module 2: Itemization Analysis ----
  const itemization = analyzeItemizationFromMatch(matchInHistory, matchInfo, accountId, durationMinutes);

  // ---- Module 3: Combat & KDA Analysis (enriched with granular playerStats) ----
  const combat = analyzeCombatFromStats(matchInHistory, durationMinutes, playerStats);

  // ---- Module 4: Benchmark Comparison (match vs career) ----
  const benchmarks = compareAgainstBenchmarks(matchInHistory, normalizedHeroStats, durationMinutes);

  // ---- Advanced Modules ----
  const rankPredictSummary = summarizeRankPrediction(rankPredict);

  // Module 5: Dynamic Rank Benchmarks (match vs same-tier peers)
  const rankBenchmarks = analyzeRankBenchmarks({
    combat,
    itemization,
    rankPredict: rankPredictSummary,
    playerStats,
  });

  // Module 6: Matchup Difficulty (enemy comp, rank delta, counters)
  const matchupDifficulty = analyzeMatchupDifficulty({
    matchInfo,
    accountId,
    heroId,
    rankPredict: rankPredictSummary,
  });

  // Module 7: Build Path Optimization
  const buildPath = analyzeBuildPath({
    items: itemization.items || [],
    role: heroRole.role,
    durationSeconds,
  });

  // Module 8: Decision Quality Scoring (synthesizes the other modules)
  const decisionQuality = analyzeDecisionQuality({
    combat,
    itemization,
    heroPerformance,
    rankBenchmarks,
    matchupDifficulty,
    buildPath,
    playerStats,
  });

  // Temporal Tracking (trend across recent matches) — embedded in meta
  const temporal = analyzeTemporal({ matchHistory, matchInHistory });

  // MMR History (longitudinal rank timeline) — embedded in meta
  const mmrHistory = buildMmrHistory(rankPredict, matchHistory);

  // ---- Recommendations ----
  const recommendations = generateRecommendations(
    heroPerformance,
    itemization,
    combat,
    benchmarks,
    { rankBenchmarks, matchupDifficulty, buildPath, decisionQuality, temporal }
  );

  // ---- Insights v2 (with meta context for Deadlock-specific intelligence) ----
  const insights = generateInsights(
    heroPerformance,
    itemization,
    combat,
    benchmarks,
    { duration: durationSeconds, won }
  );

  // ---- Overall Score (weighted: core modules + decision quality) ----
  const overall = computeOverallScore({
    heroPerformance: heroPerformance.score,
    itemization: itemization.score,
    combat: combat.score,
    benchmarks: benchmarks.score,
    decisionQuality: decisionQuality.score,
  });

  const elapsed = Date.now() - startTime;
  logger.info(`Pipeline complete in ${elapsed}ms`);

  return {
    meta: {
      matchId: matchInfo?.match_id || matchInfo?.matchId || matchInHistory?.match_id || null,
      accountId,
      heroId,
      heroName: getHeroName(heroId),
      heroData: getHeroData(heroId),
      duration: durationSeconds,
      won,
      startTime: matchStartTime,
      analyzedAt: new Date().toISOString(),
      processedAt: new Date().toISOString(),
      patchVersion: matchInfo?.game_mode_version || matchInfo?.patch_version || matchInfo?.match_version || null,
      pipelineMs: elapsed,
      rankPredict: rankPredictSummary,
      playerStats,
      mmrHistory,
      temporal,
    },
    overall,
    modules: {
      heroPerformance,
      itemization,
      combat,
      benchmarks,
      rankBenchmarks,
      matchupDifficulty,
      buildPath,
      decisionQuality,
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

/**
 * Extract Deadlock-specific granular player stats from match metadata.
 * The Deadlock API returns these only when `include_player_stats=true` is
 * requested. Fields vary slightly across versions so we try several aliases.
 */
function extractGranularPlayerStats(matchInfo, accountId, durationMinutes) {
  if (!matchInfo || !Array.isArray(matchInfo.players)) return {};
  const player = matchInfo.players.find(
    (p) => Number(p.account_id) === Number(accountId)
  );
  if (!player) return {};

  const kills = Number(player.kills ?? player.player_kills ?? 0);
  const deaths = Number(player.deaths ?? player.player_deaths ?? 0);
  const assists = Number(player.assists ?? player.player_assists ?? 0);
  const netWorth = Number(
    player.net_worth ?? player.networth ?? player.souls ?? 0
  );
  const damageDealt = Number(
    player.net_damage_dealt ?? player.player_damage ?? player.damage ?? player.hero_damage ?? 0
  );
  const damageTaken = Number(
    player.damage_taken ?? player.net_damage_taken ?? player.hero_damage_taken ?? 0
  );
  const healing = Number(
    player.healing ?? player.hero_healing ?? player.self_healing ?? 0
  );
  const lastHits = Number(player.last_hits ?? 0);
  const denies = Number(player.denies ?? 0);
  const objectiveDamage = Number(
    player.obj_damage ?? player.objective_damage ?? player.hero_damage_to_objectives ?? 0
  );
  const maxHealth = Number(player.max_health ?? 0);
  const level = Number(player.level ?? player.hero_level ?? 0);
  const souls = Number(player.souls ?? player.net_worth ?? 0);

  // Positioning Score: damage dealt vs damage taken ratio normalised to 0-100.
  // Dealing 2x what you take = 85; 1:1 = 50; taking 2x more than dealing = 20.
  let positioningScore = null;
  if (damageDealt > 0 && damageTaken > 0) {
    const ratio = damageDealt / damageTaken;
    // logarithmic curve: ratio 1 → 50, ratio 2 → ~75, ratio 0.5 → ~25
    const normalised = 50 + 35 * Math.log2(Math.min(Math.max(ratio, 0.25), 4));
    positioningScore = Math.round(Math.max(0, Math.min(100, normalised)));
  }

  return {
    kills,
    deaths,
    assists,
    netWorth: netWorth || null,
    damageDealt: damageDealt || null,
    damageTaken: damageTaken || null,
    damageTakenPerMin: durationMinutes > 0 ? Math.round(damageTaken / durationMinutes) : null,
    healing: healing || null,
    healingPerMin: durationMinutes > 0 ? Math.round(healing / durationMinutes) : null,
    lastHits: lastHits || null,
    denies: denies || null,
    objectiveDamage: objectiveDamage || null,
    maxHealth: maxHealth || null,
    level: level || null,
    souls: souls || null,
    positioningScore,
  };
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
 * (Deprecated inline version — now using ./analyzers/match-performance.analyzer.js)
 */

/**
 * Module 2 – Itemization.
 * Grades final build value against an expected souls/minute benchmark.
 */
function analyzeItemizationFromMatch(matchInHistory, matchInfo, accountId, durationMinutes) {
  const normalizeItems = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw.items)) return raw.items;
    if (Array.isArray(raw.item_ids)) return raw.item_ids;
    if (Array.isArray(raw.itemIds)) return raw.itemIds;
    return [];
  };

  let items = [];
  
  // 1. Try matchInHistory (usually faster/cached)
  if (matchInHistory) {
    items = normalizeItems(
      matchInHistory.items ||
      matchInHistory.item_ids ||
      matchInHistory.itemIds ||
      matchInHistory.build ||
      matchInHistory.match_items ||
      matchInHistory.matchItems ||
      []
    );
    
    if (items.length > 0) {
      logger.debug(`[Pipeline] Extracted ${items.length} items from matchInHistory`);
    }
  }

  // 2. Fallback to full matchInfo players list if history items were missing
  if (items.length === 0 && matchInfo && Array.isArray(matchInfo.players)) {
    const player = matchInfo.players.find(p => Number(p.account_id) === Number(accountId));
    if (player) {
      items = normalizeItems(
        player.items ||
        player.item_ids ||
        player.itemIds ||
        player.match_items ||
        player.matchItems ||
        player.player_items ||
        player.playerItems ||
        player.inventory ||
        player.final_build ||
        player.finalBuild ||
        player.build ||
        []
      );

      // Some responses nest items under stats or final_build
      if ((!items || items.length === 0) && Array.isArray(player.stats)) {
        const lastStats = player.stats[player.stats.length - 1];
        if (lastStats) {
          items = normalizeItems(lastStats.items || lastStats.item_ids || lastStats.itemIds);
        }
      }

      if (items.length > 0) {
        logger.debug(`[Pipeline] Extracted ${items.length} items from matchInfo player stats`);
      }
    }
  }

  if (items.length === 0) {
    logger.warn(`[Pipeline] No item data found for match ${matchInHistory?.match_id || 'unknown'} and player ${accountId}`);
  }

  const netWorth = Number(matchInHistory?.net_worth ?? matchInHistory?.netWorth ?? matchInHistory?.souls ?? 0);
  const souls = Number(matchInHistory?.souls ?? matchInHistory?.last_hits ?? 0);
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
    items: items.map((item) => {
      // Handle different item formats from API
      if (typeof item === 'number') {
        const apiItem = getItemData(item);
        return {
          id: item,
          name: apiItem?.name ?? getItemName(item),
          cost: apiItem?.item_cost ?? 0,
          image: apiItem?.image || null,
          image_webp: apiItem?.image_webp || null,
          time_s: null,
        };
      }
      if (typeof item === 'string') {
        return {
          id: null,
          name: item,
          cost: 0,
          image: null,
          image_webp: null,
          time_s: null,
        };
      }
      const id = item.id ?? item.item_id ?? item.item ?? null;
      const apiItem = getItemData(id);
      const name = item.name ?? item.item_name ?? item.display_name ?? apiItem?.name ?? getItemName(id) ?? 'Unknown Item';
      const cost = item.cost ?? item.item_cost ?? item.price ?? apiItem?.item_cost ?? 0;
      const time_s = item.time_s ?? item.buy_time_s ?? item.purchase_time_s ?? item.game_time_s ?? item.timeSeconds ?? item.time ?? null;
      
      return {
        id,
        name,
        cost,
        image: apiItem?.image || null,
        image_webp: apiItem?.image_webp || null,
        time_s: time_s != null ? Number(time_s) : null,
      };
    }),
    netWorth: Math.round(netWorth),
    souls: Math.round(souls),
    soulsPerMin: Math.round(soulsPerMin),
    note: (!matchInHistory && !matchInfo) ? 'Match data not available.' : undefined
  };
}

/**
 * Module 3 – Combat.
 * Grades fight output in THIS match (damage/min, KDA, death rate).
 */
function analyzeCombatFromStats(matchInHistory, durationMinutes, playerStats = {}) {
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
  // Bonus for strong positioning (damage dealt >> damage taken)
  if (playerStats?.positioningScore != null) {
    score += (playerStats.positioningScore - 50) * 0.15; // up to +7.5 / -7.5
  }
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
    // Enriched granular metrics (nullable — only present with include_player_stats)
    damageTaken: playerStats?.damageTaken ?? null,
    damageTakenPerMin: playerStats?.damageTakenPerMin ?? null,
    healing: playerStats?.healing ?? null,
    healingPerMin: playerStats?.healingPerMin ?? null,
    objectiveDamage: playerStats?.objectiveDamage ?? null,
    positioningScore: playerStats?.positioningScore ?? null,
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
function generateRecommendations(heroPerformance, itemization, combat, benchmarks, advanced = {}) {
  const recommendations = [];
  const { rankBenchmarks, matchupDifficulty, buildPath, decisionQuality, temporal } = advanced;

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

  // Advanced module-driven recommendations
  if (buildPath?.underutilizedSlots?.length) {
    const slots = buildPath.underutilizedSlots.slice(0, 2).join(' + ');
    recommendations.push({
      type: 'build',
      priority: 'medium',
      title: 'Rebalance Your Build',
      description: `Your build was light on ${slots}. For your role, consider adding at least one item in each of those categories before late-game teamfights.`,
    });
  }
  if (buildPath?.firstT3Item?.timeSeconds && buildPath.firstT3Item.timeSeconds / 60 > 25) {
    recommendations.push({
      type: 'build',
      priority: 'medium',
      title: 'Hit Power Spikes Earlier',
      description: `Your first Tier-3 item came at ${Math.round(buildPath.firstT3Item.timeSeconds / 60)} min. Aim for sub-22 min to stay relevant in mid-game fights.`,
    });
  }
  if (matchupDifficulty?.counters?.length) {
    const hardCounters = matchupDifficulty.counters.filter((c) => c.strength !== 'soft');
    if (hardCounters.length > 0) {
      recommendations.push({
        type: 'matchup',
        priority: 'medium',
        title: `Adapt Against ${hardCounters[0].heroName}`,
        description: `${hardCounters.map((c) => c.heroName).join(', ')} counter your hero archetype. Lean on your team earlier, and itemize defensively.`,
      });
    }
  }
  if (rankBenchmarks?.score != null && rankBenchmarks.score < 40) {
    recommendations.push({
      type: 'rank',
      priority: 'high',
      title: 'Below Your Rank Peers',
      description: `You scored ${rankBenchmarks.score}/100 versus typical ${rankBenchmarks.tierName} players. The biggest gaps were in the comparisons table — focus there first.`,
    });
  }
  if (temporal?.trendLabel === 'declining') {
    recommendations.push({
      type: 'temporal',
      priority: 'medium',
      title: 'Form is Slipping',
      description: `Your KDA trend across the last ${temporal.sampleSize} matches is declining. Consider a short break or review VODs before queueing again.`,
    });
  } else if (temporal?.trendLabel === 'improving') {
    recommendations.push({
      type: 'temporal',
      priority: 'low',
      title: 'Form is Climbing',
      description: `Your KDA has been trending up across your last ${temporal.sampleSize} matches. Keep the momentum going.`,
    });
  }
  if (decisionQuality?.findings?.length) {
    const weakness = decisionQuality.findings.find((f) => f.type === 'weakness');
    if (weakness) {
      recommendations.push({
        type: 'decision',
        priority: 'high',
        title: `Decision Gap: ${weakness.area}`,
        description: `Your decision-quality score in ${weakness.area} was ${weakness.score}/100. This was your weakest dimension this match.`,
      });
    }
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
