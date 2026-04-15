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
    const result = await resolveSteamId(steamInput);
    res.json(result);
  } catch (err) {
    next(err);
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
    next(err);
  }
}

module.exports = { resolvePlayer, getPlayerMatches };
