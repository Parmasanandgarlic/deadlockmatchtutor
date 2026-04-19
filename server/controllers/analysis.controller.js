const {
  getMatchInfo,
  getMatchHistory,
  getPlayerHeroStats,
  getPlayerAccountStats,
  getPlayerRankPredict,
  getPlayerCard,
  getHeroes,
  getItems,
  getRanks,
} = require('../services/deadlockApi.service');
const { runPipeline } = require('../pipeline');
const logger = require('../utils/logger');
const { supabase } = require('../utils/supabase');
const { setApiHeroNames } = require('../utils/heroes');
const { setApiItemNames } = require('../utils/items');
const { setApiRanks } = require('../utils/ranks');
const redisClient = require('../services/redis.service');

/**
 * In-memory cache fallback for analysis results.
 * Used if Supabase is unavailable.
 */
const fallbackCache = new Map();

/**
 * Cache for hero names from API.
 * Refreshed periodically.
 */
let heroNamesCache = null;
let heroNamesCacheTime = 0;
const HERO_NAMES_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Cache for item names from API.
 * Refreshed periodically.
 */
let itemNamesCache = null;
let itemNamesCacheTime = 0;
const ITEM_NAMES_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Cache for rank data from API.
 * Refreshed periodically.
 */
let ranksCache = null;
let ranksCacheTime = 0;
const RANKS_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetch and cache hero names from API.
 */
async function fetchHeroNames() {
  const now = Date.now();
  if (heroNamesCache && (now - heroNamesCacheTime) < HERO_NAMES_CACHE_TTL) {
    return heroNamesCache;
  }

  try {
    const heroes = await getHeroes();
    if (heroes.length > 0) {
      heroNamesCache = heroes;
      heroNamesCacheTime = now;
      setApiHeroNames(heroes);
      logger.info(`Cached ${heroes.length} heroes with full metadata from API`);
    }
  } catch (err) {
    logger.warn(`Failed to fetch hero metadata: ${err.message}`);
  }
  return heroNamesCache;
}

/**
 * Fetch and cache item names from API.
 */
async function fetchItemNames() {
  const now = Date.now();
  if (itemNamesCache && (now - itemNamesCacheTime) < ITEM_NAMES_CACHE_TTL) {
    return itemNamesCache;
  }

  try {
    const items = await getItems();
    if (items.length > 0) {
      itemNamesCache = items;
      itemNamesCacheTime = now;
      setApiItemNames(items);
      logger.info(`Cached ${items.length} items with full metadata from API`);
    }
  } catch (err) {
    logger.warn(`Failed to fetch item metadata: ${err.message}`);
  }
  return itemNamesCache;
}

/**
 * Fetch and cache rank data from API.
 */
async function fetchRanks() {
  const now = Date.now();
  if (ranksCache && (now - ranksCacheTime) < RANKS_CACHE_TTL) {
    return ranksCache;
  }

  try {
    const ranks = await getRanks();
    if (ranks.length > 0) {
      ranksCache = ranks;
      ranksCacheTime = now;
      setApiRanks(ranks);
      logger.info(`Cached ${ranks.length} ranks from API`);
    }
  } catch (err) {
    logger.warn(`Failed to fetch ranks: ${err.message}`);
  }
  return ranksCache;
}

/**
 * POST /api/analysis/run
 * Body: { matchId, accountId }
 */
async function runAnalysis(req, res, next) {
  const { matchId, accountId } = req.body;

  const mId = Number(matchId);
  const aId = Number(accountId);

  if (!Number.isInteger(mId) || mId < 0 || mId > Number.MAX_SAFE_INTEGER ||
      !Number.isInteger(aId) || aId < 0 || aId > Number.MAX_SAFE_INTEGER) {
    return res.status(400).json({ error: 'Invalid matchId or accountId format.' });
  }

  const cacheKey = `${matchId}_${accountId}`;
  const lockKey = `lock:analysis:${cacheKey}`;

  // 1. Check for active processing lock (Distributed Lock)
  const isProcessing = await redisClient.get(lockKey);
  if (isProcessing) {
    logger.info(`[Analysis] Analysis for ${cacheKey} is already in progress (Locked)`);
    return res.status(202).json({ 
      error: 'Analysis is currently in progress. Please check back in a few moments.',
      code: 'PROCESSING' 
    });
  }

  // 2. Check Supabase (stateless cache)
  try {
    const { data: existingRecord } = await supabase
      .from('analyses')
      .select('data')
      .eq('match_id', mId)
      .eq('account_id', aId)
      .maybeSingle();

    if (existingRecord?.data) {
      logger.info(`[Supabase] Cache hit for ${cacheKey}`);
      res.setHeader('X-Cache', 'HIT (Supabase)');
      return res.json({ cached: true, ...existingRecord.data });
    }
  } catch (err) {
    logger.warn(`[Supabase] Check failed, falling back to identity: ${err.message}`);
  }

  // Set processing lock
  await redisClient.set(lockKey, 'true', 300); // 5-minute safety lock

  try {
    // 1b. Check local fallback cache (for Vercel local dev / temporary)
    if (fallbackCache.has(cacheKey)) {
      logger.info(`[FallbackCache] Cache hit for ${cacheKey}`);
      res.setHeader('X-Cache', 'HIT (Fallback)');
      await redisClient.del(lockKey);
      return res.json({ cached: true, ...fallbackCache.get(cacheKey) });
    }

    // Ensure hero names, item names, and ranks are cached
    try {
      await fetchHeroNames();
    } catch (err) {
      logger.error(`[Analysis] Failed to fetch hero names: ${err.message}`);
    }
    try {
      await fetchItemNames();
    } catch (err) {
      logger.error(`[Analysis] Failed to fetch item names: ${err.message}`);
    }
    try {
      await fetchRanks();
    } catch (err) {
      logger.error(`[Analysis] Failed to fetch ranks: ${err.message}`);
    }

    // Step 2-7: Parallelize independent API calls for match and player data
    logger.info(`[Analysis] Fetching data for match ${matchId} and account ${accountId} in parallel`);
    
    const [matchInfo, matchHistory, accountStats, rankPredict, playerCard] = await Promise.all([
      getMatchInfo(matchId).catch(err => {
        logger.error(`[Analysis] Failed to fetch match info: ${err.message}`);
        return {};
      }),
      getMatchHistory(accountId).catch(err => {
        logger.error(`[Analysis] Failed to fetch match history: ${err.message}`);
        throw new Error(`Failed to fetch match history: ${err.message}`);
      }),
      getPlayerAccountStats(accountId).catch(err => {
        logger.error(`[Analysis] Failed to fetch account stats: ${err.message}`);
        return null;
      }),
      getPlayerRankPredict(accountId).catch(err => {
        logger.error(`[Analysis] Failed to fetch rank prediction: ${err.message}`);
        return null;
      }),
      getPlayerCard(accountId).catch(err => {
        logger.error(`[Analysis] Failed to fetch player card: ${err.message}`);
        return {};
      })
    ]);

    // Step 8: Resolve heroId from parallel results
    const matchInHistory = matchHistory.find(m => m.match_id === Number(matchId));
    if (!matchInHistory && !Object.keys(matchInfo).length) {
      throw new Error('Match not found. The Deadlock API may be experiencing issues — please try again later.');
    }

    const heroId = matchInHistory?.hero_id || matchInfo?.players?.find(p => p.account_id === Number(accountId))?.hero_id || 0;

    // Step 9: Fetch hero-specific stats (depends on heroId)
    logger.info(`[Analysis] Fetching hero stats for hero ${heroId}`);
    const heroStats = await getPlayerHeroStats(accountId, heroId).catch(err => {
      logger.error(`[Analysis] Failed to fetch hero stats: ${err.message}`);
      return null;
    });

    // Step 10: Build API-based data structure for pipeline
    const apiData = {
      matchInfo,
      matchInHistory,
      heroStats,
      accountStats,
      rankPredict,
      playerCard,
      heroId,
    };

    // Step 9: Run analysis pipeline on API data
    logger.info(`[Analysis] Running analysis pipeline on API data`);
    const result = await runPipeline(apiData, accountId, matchInfo);

    // Cache result persistently to Supabase
    try {
      const { error } = await supabase.from('analyses').upsert(
        {
          match_id: Number(matchId),
          account_id: Number(accountId),
          data: result,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'match_id,account_id' }
      );
      if (error) throw error;
    } catch (dbErr) {
      logger.warn(`[Supabase] Failed to save analysis, saving to fallback cache: ${dbErr.message}`);
      fallbackCache.set(cacheKey, result);
      if (fallbackCache.size > 100) fallbackCache.delete(fallbackCache.keys().next().value);
    }

    res.setHeader('X-Cache', 'MISS');
    await redisClient.del(lockKey);
    res.json({ cached: false, ...result });
  } catch (err) {
    await redisClient.del(lockKey);
    logger.error(`Analysis failed for match ${matchId}, account ${accountId}: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
    res.status(500).json({
      error: 'Analysis failed',
      message: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }
}

/**
 * GET /api/analysis/:matchId/:accountId
 * Retrieve cached analysis (for shared links).
 */
async function getCachedAnalysis(req, res, next) {
  try {
    const { matchId, accountId } = req.params;
    
    const mId = Number(matchId);
    const aId = Number(accountId);

    if (!Number.isInteger(mId) || mId < 0 || mId > Number.MAX_SAFE_INTEGER ||
        !Number.isInteger(aId) || aId < 0 || aId > Number.MAX_SAFE_INTEGER) {
      return res.status(400).json({ error: 'Invalid matchId or accountId format.' });
    }
    
    // 1. Check Supabase
    try {
      const { data: existingRecord } = await supabase
        .from('analyses')
        .select('data')
        .eq('match_id', Number(matchId))
        .eq('account_id', Number(accountId))
        .maybeSingle();

      if (existingRecord?.data) {
        return res.json(existingRecord.data);
      }
    } catch (err) {
      logger.warn(`[Supabase] Fetch failed: ${err.message}`);
    }

    // 2. Check local fallback cache
    const cacheKey = `${matchId}_${accountId}`;
    if (fallbackCache.has(cacheKey)) {
      return res.json(fallbackCache.get(cacheKey));
    }

    return res.status(404).json({
      error: 'Analysis not found. It may not have been run yet, or the cache has been cleared.',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { runAnalysis, getCachedAnalysis };
