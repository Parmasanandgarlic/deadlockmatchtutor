const {
  getMatchInfo,
  getMatchHistory,
  getPlayerHeroStats,
  getPlayerAccountStats,
  getPlayerRankPredict,
  getPlayerCard,
} = require('../services/deadlockApi.service');
const { runPipeline } = require('../pipeline');
const logger = require('../utils/logger');
const { supabase } = require('../utils/supabase');

/**
 * In-memory cache fallback for analysis results.
 * Used if Supabase is unavailable.
 */
const fallbackCache = new Map();

/**
 * POST /api/analysis/run
 * Body: { matchId, accountId }
 */
async function runAnalysis(req, res, next) {
  const { matchId, accountId } = req.body;

  if (!matchId || !accountId) {
    return res.status(400).json({ error: 'matchId and accountId are required.' });
  }
  if (!/^\d+$/.test(String(matchId)) || !/^\d+$/.test(String(accountId))) {
    return res.status(400).json({ error: 'matchId and accountId must be strictly numeric.' });
  }

  const cacheKey = `${matchId}_${accountId}`;

  // 1. Check Supabase (stateless cache)
  try {
    const { data: existingRecord, error } = await supabase
      .from('analyses')
      .select('data')
      .eq('match_id', Number(matchId))
      .eq('account_id', Number(accountId))
      .maybeSingle();

    if (existingRecord?.data) {
      logger.info(`[Supabase] Cache hit for ${cacheKey}`);
      return res.json({ cached: true, ...existingRecord.data });
    }
  } catch (err) {
    logger.warn(`[Supabase] Check failed, falling back to memory cache: ${err.message}`);
  }

  // 1b. Check local fallback cache (for Vercel local dev / temporary)
  if (fallbackCache.has(cacheKey)) {
    logger.info(`[FallbackCache] Cache hit for ${cacheKey}`);
    return res.json({ cached: true, ...fallbackCache.get(cacheKey) });
  }

  try {
    // Step 2: Fetch match info from API
    logger.info(`[Analysis] Fetching match info for match ${matchId}`);
    const matchInfo = await getMatchInfo(matchId);

    // Step 3: Fetch player match history to get hero played in this match
    logger.info(`[Analysis] Fetching match history for account ${accountId}`);
    const matchHistory = await getMatchHistory(accountId);

    // Find the specific match in history
    const matchInHistory = matchHistory.find(m => m.match_id === Number(matchId));
    if (!matchInHistory) {
      throw new Error('Match not found in player history. The player may not have participated in this match.');
    }

    const heroId = matchInHistory.hero_id;

    // Step 4: Fetch hero-specific stats
    logger.info(`[Analysis] Fetching hero stats for hero ${heroId}`);
    const heroStats = await getPlayerHeroStats(accountId, heroId);

    // Step 5: Fetch general account stats
    logger.info(`[Analysis] Fetching account stats for account ${accountId}`);
    const accountStats = await getPlayerAccountStats(accountId);

    // Step 6: Fetch rank prediction
    logger.info(`[Analysis] Fetching rank prediction for account ${accountId}`);
    const rankPredict = await getPlayerRankPredict(accountId);

    // Step 7: Fetch player card for additional profile data
    logger.info(`[Analysis] Fetching player card for account ${accountId}`);
    const playerCard = await getPlayerCard(accountId);

    // Step 8: Build API-based data structure for pipeline
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

    res.json({ cached: false, ...result });
  } catch (err) {
    logger.error(`Analysis failed for match ${matchId}: ${err.message}`);
    next(err);
  }
}

/**
 * GET /api/analysis/:matchId/:accountId
 * Retrieve cached analysis (for shared links).
 */
async function getCachedAnalysis(req, res, next) {
  try {
    const { matchId, accountId } = req.params;
    
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
