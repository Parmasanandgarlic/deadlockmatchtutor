const { getMatchMetadata, getMatchInfo } = require('../services/deadlockApi.service');
const logger = require('../utils/logger');

/**
 * GET /api/matches/:matchId
 * Fetch full match info (players, duration, result).
 */
async function getMatch(req, res, next) {
  try {
    const { matchId } = req.params;
    const matchInfo = await getMatchInfo(matchId);
    res.json(matchInfo);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/matches/:matchId/metadata
 * Fetch match metadata (salt for CDN download).
 */
async function getMetadata(req, res, next) {
  try {
    const { matchId } = req.params;
    const metadata = await getMatchMetadata(matchId);
    res.json(metadata);
  } catch (err) {
    next(err);
  }
}

module.exports = { getMatch, getMetadata };
