const { generateInsights } = require('./insights.engine');
const { computeOverallScore } = require('./scoring.engine');
const { getHeroName, getHeroData } = require('../utils/heroes');
const { getRankInfo } = require('../utils/ranks');
const { getItemName, getItemData } = require('../utils/items');
const { itemAssetFields } = require('../utils/itemAssets');
const { clamp } = require('../utils/helpers');
const logger = require('../utils/logger');
const { HERO_ROLES, ROLE_BENCHMARKS } = require('../data/hero-roles');
const { SCORING_CALIBRATION, PHASES } = require('../utils/constants');
const { getHeroBenchmark, getPlayerPercentile, getCommunityAvgKda, getCommunityAvgNwm } = require('../data/hero-benchmarks');
const { normalizePlayer, normalizeMatchInfo, normalizeMatchHistoryEntry, normalizeHeroStats: normalizeHeroStatsAdapter } = require('../utils/apiAdapter');
const { analyzeMatchPerformance } = require('./analyzers/match-performance.analyzer');
const { analyzeRankBenchmarks } = require('./analyzers/rankBenchmarks.analyzer');
const { analyzeTemporal } = require('./analyzers/temporal.analyzer');
const { analyzeMatchupDifficulty } = require('./analyzers/matchupDifficulty.analyzer');
const { analyzeBuildPath } = require('./analyzers/buildPath.analyzer');
const { analyzeDecisionQuality } = require('./analyzers/decisionQuality.analyzer');
const { buildMmrHistory } = require('../services/mmrHistory.service');
const { getMetaContext } = require('../services/metaContext.service');

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
    matchInfo?.duration_seconds ||
    matchInfo?.duration ||
    matchInfo?.match_duration_s ||
    matchInfo?.match_duration ||
    matchInHistory?.match_duration_s ||
    matchInHistory?.duration_seconds ||
    matchInHistory?.duration_s ||
    matchInHistory?.duration ||
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

  // ---- Module 2: Itemization Analysis (hero-aware SPM benchmarks) ----
  const itemization = analyzeItemizationFromMatch(matchInHistory, matchInfo, accountId, durationMinutes, playerStats, heroId);

  // ---- Module 3: Combat & KDA Analysis (game-length normalized, death severity) ----
  const combat = analyzeCombatFromStats(matchInHistory, durationMinutes, playerStats, heroId, durationSeconds);

  // ---- Module 4: Benchmark Comparison (hero-specific percentile benchmarks) ----
  const benchmarks = compareAgainstBenchmarks(matchInHistory, normalizedHeroStats, durationMinutes, playerStats, heroId);

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

  // ---- Meta Context (hero tier, win rate, item build intelligence) ----
  let metaContext = null;
  try {
    metaContext = await getMetaContext({
      heroId,
      heroStats,
      matchHistory,
      rankPredict: rankPredictSummary,
    });
  } catch (err) {
    logger.warn(`Meta context generation failed: ${err.message}`);
  }

  // ---- Insights v3 (event-grounded coaching with full module context) ----
  const insights = generateInsights(
    heroPerformance,
    itemization,
    combat,
    benchmarks,
    {
      duration: durationSeconds,
      won,
      heroName: getHeroName(heroId),
      roleBenchmarks,
      matchupDifficulty,
      buildPath,
      temporal,
      metaContext,
    }
  );

  // ---- Overall Score (weighted: core modules + decision quality) ----
  const overall = computeOverallScore({
    heroPerformance: heroPerformance.score,
    itemization: itemization.score,
    combat: combat.score,
    benchmarks: benchmarks.score,
    decisionQuality: decisionQuality.score,
  }, analysisContext.heroRole?.role);

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
      metaContext,
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
/**
 * Delegate to the centralized apiAdapter for hero stats normalization.
 * Kept as a local alias for backward compatibility with callers in this file.
 */
function normalizeHeroStats(raw) {
  return normalizeHeroStatsAdapter(raw);
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

function findPlayerInMatchInfo(matchInfo, accountId) {
  if (!matchInfo || !Array.isArray(matchInfo.players)) return null;
  return matchInfo.players.find(
    (p) => Number(p.account_id ?? p.accountId) === Number(accountId)
  ) || null;
}

function pickNumber(...values) {
  for (const value of values) {
    if (value == null || value === '') continue;
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

/**
 * Extract Deadlock-specific granular player stats from match metadata.
 * The Deadlock API returns these only when `include_player_stats=true` is
 * requested. Fields vary slightly across versions so we try several aliases.
 */
function extractGranularPlayerStats(matchInfo, accountId, durationMinutes) {
  const player = findPlayerInMatchInfo(matchInfo, accountId);
  if (!player) return {};

  const kills = pickNumber(player.kills, player.player_kills);
  const deaths = pickNumber(player.deaths, player.player_deaths);
  const assists = pickNumber(player.assists, player.player_assists);
  const netWorth = pickNumber(player.net_worth, player.networth, player.souls);
  const damageDealt = pickNumber(
    player.net_damage_dealt,
    player.player_damage,
    player.damage,
    player.hero_damage
  );
  const damageTaken = pickNumber(
    player.damage_taken,
    player.net_damage_taken,
    player.hero_damage_taken
  );
  const healing = pickNumber(player.healing, player.hero_healing, player.self_healing);
  const lastHits = pickNumber(player.last_hits);
  const denies = pickNumber(player.denies);
  const objectiveDamage = pickNumber(
    player.obj_damage,
    player.objective_damage,
    player.hero_damage_to_objectives
  );
  const maxHealth = pickNumber(player.max_health);
  const level = pickNumber(player.level, player.hero_level);
  const souls = pickNumber(player.souls, player.net_worth, player.networth);

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
    team: player.team ?? player.player_team ?? null,
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
function analyzeItemizationFromMatch(matchInHistory, matchInfo, accountId, durationMinutes, playerStats = {}, heroId = null) {
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
    const player = findPlayerInMatchInfo(matchInfo, accountId);
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

  const player = findPlayerInMatchInfo(matchInfo, accountId);
  const netWorth = pickNumber(
    playerStats.netWorth,
    playerStats.souls,
    matchInHistory?.net_worth,
    matchInHistory?.netWorth,
    matchInHistory?.souls,
    player?.net_worth,
    player?.networth,
    player?.souls
  );
  const souls = pickNumber(
    playerStats.souls,
    matchInHistory?.souls,
    player?.souls,
    matchInHistory?.last_hits
  );
  const soulsPerMin = perMinute(netWorth, durationMinutes);

  // --- Dynamic hero-specific percentile scoring (replaces static thresholds) ---
  const SC = SCORING_CALIBRATION;
  let score = SC.ITEM_SCORE_BASELINE;
  if (soulsPerMin > 0 && heroId) {
    // Use hero-specific percentile: p50 = 50pts, p75 = 75pts, p90 = 90pts
    const nwmPercentile = getPlayerPercentile(heroId, 'nwm', soulsPerMin);
    score = clamp(nwmPercentile, 10, 100);
  } else if (soulsPerMin > 0) {
    // Fallback to static thresholds when hero is unknown
    score += Math.min(((soulsPerMin - SC.SOULS_PER_MIN_WEAK) / SC.SOULS_PER_MIN_RANGE) * SC.SOULS_PER_MIN_MAX_BONUS, SC.SOULS_PER_MIN_MAX_BONUS);
  } else if (netWorth > 0) {
    score += Math.min((netWorth / SC.NETWORTH_FALLBACK_CEILING) * SC.NETWORTH_FALLBACK_MAX_BONUS, SC.NETWORTH_FALLBACK_MAX_BONUS);
  }
  score = Math.max(0, Math.min(100, score));

  return {
    score: Math.round(score),
    items: items.map((item) => {
      // Handle different item formats from API
      if (typeof item === 'number') {
        const apiItem = getItemData(item);
        const assetFields = itemAssetFields(apiItem);
        return {
          id: item,
          name: apiItem?.name ?? getItemName(item),
          cost: apiItem?.cost ?? apiItem?.item_cost ?? 0,
          ...assetFields,
          time_s: null,
        };
      }
      if (typeof item === 'string' && /^\d+$/.test(item.trim())) {
        const id = Number(item);
        const apiItem = getItemData(id);
        const assetFields = itemAssetFields(apiItem);
        return {
          id,
          name: apiItem?.name ?? getItemName(id),
          cost: apiItem?.cost ?? apiItem?.item_cost ?? 0,
          ...assetFields,
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
      const cost = item.cost ?? item.item_cost ?? item.price ?? apiItem?.cost ?? apiItem?.item_cost ?? 0;
      const time_s = item.time_s ?? item.buy_time_s ?? item.purchase_time_s ?? item.game_time_s ?? item.timeSeconds ?? item.time ?? null;
      const assetFields = itemAssetFields(item, apiItem);
      
      return {
        id,
        name,
        cost,
        ...assetFields,
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
function analyzeCombatFromStats(matchInHistory, durationMinutes, playerStats = {}, heroId = null, durationSeconds = 0) {
  const kills = pickNumber(playerStats.kills, matchInHistory?.player_kills, matchInHistory?.kills);
  const deaths = pickNumber(playerStats.deaths, matchInHistory?.player_deaths, matchInHistory?.deaths);
  const assists = pickNumber(playerStats.assists, matchInHistory?.player_assists, matchInHistory?.assists);
  const damage = pickNumber(
    playerStats.damageDealt,
    matchInHistory?.player_damage,
    matchInHistory?.damage,
    matchInHistory?.hero_damage
  );
  const objectiveDamage = pickNumber(playerStats.objectiveDamage, matchInHistory?.objective_damage);
  const hasCombatData = Boolean(matchInHistory) || kills > 0 || deaths > 0 || assists > 0 || damage > 0;

  if (!hasCombatData) {
    return {
      score: 50,
      kills: 0,
      deaths: 0,
      assists: 0,
      kda: 0,
      damage: 0,
      damagePerMin: 0,
      deathsPerMin: 0,
      objectiveDamage: 0,
      objectiveScore: 0,
      note: 'Match data not available.',
    };
  }

  const kda = deaths > 0 ? (kills + assists) / deaths : kills + assists;
  const damagePerMin = perMinute(damage, durationMinutes);
  const deathsPerMin = perMinute(deaths, durationMinutes);
  const objectiveScore = clamp((objectiveDamage / 8000) * 100, 0, 100);

  const SC = SCORING_CALIBRATION;

  // --- Hero-specific KDA percentile scoring ---
  let kdaScore;
  if (heroId) {
    const kdaPercentile = getPlayerPercentile(heroId, 'kda', kda);
    // Map percentile to a 0–25 bonus (p50 → 12.5, p90 → 22.5)
    kdaScore = Math.min((kdaPercentile / 100) * SC.KDA_WEIGHT, SC.KDA_WEIGHT);
  } else {
    kdaScore = Math.min(kda / SC.KDA_DIVISOR * SC.KDA_WEIGHT, SC.KDA_WEIGHT);
  }

  let score = SC.ITEM_SCORE_BASELINE;
  score += kdaScore;
  score += Math.min(damagePerMin / SC.DPM_DIVISOR * SC.DPM_WEIGHT, SC.DPM_WEIGHT);

  // --- Game-length normalized death penalty ---
  let deathPenalty = Math.min(deathsPerMin * SC.DEATH_PENALTY_MULTIPLIER, SC.DEATH_PENALTY_CAP);
  if (durationMinutes > SC.LONG_GAME_THRESHOLD) {
    // Long games: relax death penalty since more deaths are expected
    deathPenalty *= SC.LONG_GAME_DEATH_FACTOR;
  }
  score -= deathPenalty;

  // Bonus for strong positioning (damage dealt >> damage taken)
  if (playerStats?.positioningScore != null) {
    score += (playerStats.positioningScore - SC.POSITIONING_MIDPOINT) * SC.POSITIONING_SENSITIVITY;
  }

  // --- Short game compression (prevent inflated grades in stomps) ---
  if (durationMinutes > 0 && durationMinutes < SC.SHORT_GAME_THRESHOLD) {
    score *= SC.SHORT_GAME_FACTOR;
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
    objectiveDamage,
    objectiveScore: Math.round(objectiveScore),
    positioningScore: playerStats?.positioningScore ?? null,
  };
}

/**
 * Module 4 – Benchmark Comparison.
 * Compares THIS match's KDA and souls-per-min to the player's career averages
 * on this hero. If career data is missing, falls back to community benchmarks.
 */
function compareAgainstBenchmarks(matchInHistory, normalizedHeroStats, durationMinutes, playerStats = {}, heroId = null) {
  const kills = pickNumber(playerStats.kills, matchInHistory?.player_kills, matchInHistory?.kills);
  const deaths = pickNumber(playerStats.deaths, matchInHistory?.player_deaths, matchInHistory?.deaths);
  const assists = pickNumber(playerStats.assists, matchInHistory?.player_assists, matchInHistory?.assists);
  const netWorth = pickNumber(playerStats.netWorth, playerStats.souls, matchInHistory?.net_worth, matchInHistory?.netWorth);
  const matchKda = deaths > 0 ? (kills + assists) / deaths : kills + assists;
  const matchSoulsPerMin = perMinute(netWorth, durationMinutes);

  // --- Hero-specific benchmark fallback (replaces static global median) ---
  const careerKda = normalizedHeroStats.avgKda || getCommunityAvgKda(heroId);
  const avgSouls = normalizedHeroStats.avgSouls || 0;
  const careerSoulsPerMin = avgSouls > 0
    ? avgSouls / SCORING_CALIBRATION.ASSUMED_AVG_GAME_MINUTES
    : getCommunityAvgNwm(heroId) / SCORING_CALIBRATION.ASSUMED_AVG_GAME_MINUTES;
  const careerWinrate = normalizedHeroStats.winrate || 0;

  const kdaDiff = matchKda - careerKda;
  const soulsDiff = matchSoulsPerMin - careerSoulsPerMin;

  // --- Hero-specific percentile scoring ---
  const SC = SCORING_CALIBRATION;
  let score;
  if (heroId) {
    const kdaPercentile = getPlayerPercentile(heroId, 'kda', matchKda);
    const nwmPercentile = getPlayerPercentile(heroId, 'nwm', matchSoulsPerMin);
    // Blend: 50% KDA percentile + 50% NWM percentile
    score = Math.round((kdaPercentile + nwmPercentile) / 2);
    // If we have career data, bias toward personal comparison (+/- 10)
    if (normalizedHeroStats.avgKda > 0) {
      const personalBonus = Math.min((kdaDiff / careerKda) * 10, 10);
      score = clamp(score + personalBonus, 0, 100);
    }
  } else {
    // Legacy fallback
    score = SC.ITEM_SCORE_BASELINE;
    if (careerKda > 0) score += Math.min((kdaDiff / careerKda) * SC.BENCHMARK_KDA_CEILING, SC.BENCHMARK_KDA_CEILING);
    if (careerSoulsPerMin > 0) score += Math.min((soulsDiff / careerSoulsPerMin) * SC.BENCHMARK_SOULS_CEILING, SC.BENCHMARK_SOULS_CEILING);
    score = Math.max(0, Math.min(100, score));
  }

  // Compute hero-specific percentile tiers for display
  const heroPercentiles = heroId ? {
    kda: getPlayerPercentile(heroId, 'kda', matchKda),
    nwm: getPlayerPercentile(heroId, 'nwm', matchSoulsPerMin),
  } : null;

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
    heroPercentiles,
    note: normalizedHeroStats.avgKda > 0
      ? 'Comparison is against your own career average on this hero.'
      : `Using community benchmarks for this hero (avg KDA: ${careerKda}, avg NW/min: ${Math.round(careerSoulsPerMin * SCORING_CALIBRATION.ASSUMED_AVG_GAME_MINUTES)}).`,
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
