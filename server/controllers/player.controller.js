const { resolveSteamId } = require('../services/steam.service');
const { getMatchHistory } = require('../services/deadlockApi.service');
const logger = require('../utils/logger');

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
    const msg = err.message || 'Failed to resolve Steam ID.';
    // Log full error details for production debugging
    logger.error('Player resolution failed:', {
      input: req.body.steamInput,
      error: msg,
      stack: err.stack,
    });

    const status = msg.includes('Unrecognised') || msg.includes('Could not resolve') || msg.includes('Invalid') ? 400 : 500;
    res.status(status).json({ error: msg });
  }
}

/**
 * GET /api/players/:accountId/matches
 * Fetch the player's recent match history.
 */
async function getPlayerMatches(req, res, next) {
  try {
    const { accountId } = req.params;
    const matches = await getMatchHistory(accountId);
    res.json(matches);
  } catch (err) {
    const msg = err.message || 'Failed to fetch match history.';
    const status = msg.includes('not found') || msg.includes('Invalid') || msg.includes('check') ? 400 : 500;
    res.status(status).json({ error: msg });
  }
}

module.exports = { resolvePlayer, getPlayerMatches };
