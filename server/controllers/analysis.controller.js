const { getMatchMetadata, getMatchInfo } = require('../services/deadlockApi.service');
const { downloadReplay, decompressReplay, cleanup } = require('../services/replay.service');
const { parseDemoFile } = require('../services/parser.service');
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

  let bz2Path = null;
  let demPath = null;

  try {
    // Step 2: Metadata
    logger.info(`[Analysis] Fetching metadata for match ${matchId}`);
    const metadata = await getMatchMetadata(matchId);

    // Step 2b: Match info
    let matchInfo = {};
    try {
      matchInfo = await getMatchInfo(matchId);
    } catch (_) {
      logger.warn('Could not fetch match info; continuing with metadata only.');
    }

    // Step 3: Download
    logger.info(`[Analysis] Downloading replay for match ${matchId}`);
    bz2Path = await downloadReplay(matchId, metadata);

    // Step 4: Decompress
    logger.info(`[Analysis] Decompressing replay`);
    demPath = await decompressReplay(bz2Path);

    // Step 5: Parse
    logger.info(`[Analysis] Parsing demo file`);
    const parsedData = await parseDemoFile(demPath);

    // Release storage immediately post-parse in Serverless
    cleanup(demPath);
    demPath = null; 

    // Step 6: ETL Pipeline
    logger.info(`[Analysis] Running analysis pipeline`);
    const result = await runPipeline(parsedData, accountId, matchInfo);

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
  } finally {
    // Aggressive cleanup — free /tmp storage immediately
    if (bz2Path) cleanup(bz2Path);
    if (demPath) cleanup(demPath);
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
