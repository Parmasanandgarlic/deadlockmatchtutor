const { getMatchMetadata, getMatchInfo } = require('../services/deadlockApi.service');
const { downloadReplay, decompressReplay, cleanup } = require('../services/replay.service');
const { parseDemoFile } = require('../services/parser.service');
const { runPipeline } = require('../pipeline');
const logger = require('../utils/logger');

/**
 * In-memory cache for analysis results.
 * Key: `${matchId}_${accountId}`, Value: analysis JSON
 * Replace with Redis in production.
 */
const analysisCache = new Map();

/**
 * POST /api/analysis/run
 * Body: { matchId, accountId }
 *
 * Full analysis pipeline:
 *   1. Fetch metadata (for CDN salt)
 *   2. Download .dem.bz2
 *   3. Decompress
 *   4. Parse
 *   5. Run ETL pipeline
 *   6. Return results
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

  // Check cache
  if (analysisCache.has(cacheKey)) {
    logger.info(`Cache hit for ${cacheKey}`);
    return res.json({ cached: true, ...analysisCache.get(cacheKey) });
  }

  let demPath = null;

  try {
    // Step 1: Metadata
    logger.info(`[Analysis] Fetching metadata for match ${matchId}`);
    const metadata = await getMatchMetadata(matchId);

    // Step 1b: Match info
    let matchInfo = {};
    try {
      matchInfo = await getMatchInfo(matchId);
    } catch (_) {
      logger.warn('Could not fetch match info; continuing with metadata only.');
    }

    // Step 2: Download
    logger.info(`[Analysis] Downloading replay for match ${matchId}`);
    const bz2Path = await downloadReplay(matchId, metadata);

    // Step 3: Decompress
    logger.info(`[Analysis] Decompressing replay`);
    demPath = await decompressReplay(bz2Path);

    // Step 4: Parse
    logger.info(`[Analysis] Parsing demo file`);
    const parsedData = await parseDemoFile(demPath);

    // Step 5: ETL Pipeline
    logger.info(`[Analysis] Running analysis pipeline`);
    const result = await runPipeline(parsedData, accountId, matchInfo);

    // Cache result
    analysisCache.set(cacheKey, result);

    // Limit cache size (simple LRU — evict oldest after 100 entries)
    if (analysisCache.size > 100) {
      const firstKey = analysisCache.keys().next().value;
      analysisCache.delete(firstKey);
    }

    res.json({ cached: false, ...result });
  } catch (err) {
    logger.error(`Analysis failed for match ${matchId}: ${err.message}`);
    next(err);
  } finally {
    // Aggressive cleanup — delete .dem immediately
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
    const cacheKey = `${matchId}_${accountId}`;

    if (analysisCache.has(cacheKey)) {
      return res.json(analysisCache.get(cacheKey));
    }

    return res.status(404).json({
      error: 'Analysis not found. It may not have been run yet, or the cache has been cleared.',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { runAnalysis, getCachedAnalysis };
