const { resolveSteamId } = require('../services/steam.service');
const { getMatchHistory, getPlayerRankPredict } = require('../services/deadlockApi.service');
const { trackAccount } = require('../services/sync.service');
const { buildMmrHistory, fetchRankPredictRaw } = require('../services/mmrHistory.service');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * POST /api/players/resolve
 * Resolve a Steam vanity URL / profile link / raw ID to Steam64 + Steam32.
 */
async function resolvePlayer(req, res, next) {
  try {
    const { steamInput } = req.body;
    if (!steamInput) {
      return res.status(400).json({ error: 'Steam input is required' });
    }
    
    const result = await resolveSteamId(steamInput);
    res.json(result);
  } catch (err) {
    let msg = err.message;
    let code = err.code || 'ERR_STEAM_RESOLVE';
    let status = 500;

    if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
      msg = 'Steam resolution timed out. This often happens due to Steam Community rate limits or network congestion.';
      code = 'ERR_TIMEOUT';
      status = 504;
    } else if (err.response && err.response.status >= 500) {
      msg = 'Steam community servers are currently having issues (5xx). Please try again later.';
      code = 'ERR_STEAM_DOWN';
      status = 502;
    } else if (msg.includes('Unrecognised') || msg.includes('Could not resolve') || msg.includes('Invalid')) {
      code = 'ERR_INVALID_INPUT';
      status = 400;
    }

    // Log full error details for production debugging
    logger.error(`Player resolution failed [${code}] for input "${req.body.steamInput}":`, {
      message: msg,
      raw: err.message,
      code: err.code,
      status: err.response?.status,
      stack: err.stack,
    });

    res.status(status).json({ 
      error: msg,
      code,
      details: config.isDev ? err.message : null
    });
  }
}

/**
 * GET /api/players/:accountId/matches
 * Fetch the player's recent match history.
 */
async function getPlayerMatches(req, res, next) {
  try {
    const { accountId } = req.params;
    
    // Background track this account
    trackAccount(accountId);

    const matches = await getMatchHistory(accountId);
    res.json(matches);
  } catch (err) {
    const msg = err.message || 'Failed to fetch match history.';
    const status = msg.toLowerCase().includes('timeout')
      ? 504
      : msg.includes('not found') || msg.includes('Invalid') || msg.includes('check')
        ? 400
        : 500;
    res.status(status).json({ error: msg });
  }
}

/**
 * GET /api/players/:accountId/mmr-history
 * Return an enriched MMR timeline derived from rank-predict + match history.
 */
async function getPlayerMmrHistory(req, res, next) {
  try {
    const { accountId } = req.params;

    const [rankPredictRaw, rankPredictClient, matches] = await Promise.all([
      fetchRankPredictRaw(accountId).catch(() => null),
      getPlayerRankPredict(accountId).catch(() => null),
      getMatchHistory(accountId).catch(() => []),
    ]);

    // Prefer the richer mmr-history payload if available
    const rankPredict = rankPredictRaw || rankPredictClient || null;
    const mmr = buildMmrHistory(rankPredict, matches);
    res.json(mmr);
  } catch (err) {
    logger.error(`MMR history failed for ${req.params.accountId}: ${err.message}`);
    const status = err.message.toLowerCase().includes('timeout') ? 504 : 500;
    res.status(status).json({ error: err.message || 'Failed to build MMR history.' });
  }
}

module.exports = { resolvePlayer, getPlayerMatches, getPlayerMmrHistory };
