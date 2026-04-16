const { Configuration, PlayersApi, MatchesApi } = require('deadlock_api_client');
const config = require('../config');
const logger = require('../utils/logger');

const configuration = new Configuration({
  basePath: config.deadlockApi.baseUrl,
});

const playersApi = new PlayersApi(configuration);
const matchesApi = new MatchesApi(configuration);

/**
 * Fetch a player's recent match history.
 * @param {string|number} accountId  Steam32 account ID
 * @returns {Promise<Array>} Array of match summary objects
 */
async function getMatchHistory(accountId) {
  try {
    const { data } = await playersApi.matchHistory({ accountId: Number(accountId) });
    logger.debug(`Fetched ${data.length ?? 0} matches for account ${accountId}`);
    return data;
  } catch (err) {
    logger.error(`Failed to fetch match history for ${accountId}: ${err.message}`);
    if (err.response?.status === 404) {
      throw new Error('Player not found. Please check the Steam ID and try again.');
    }
    throw new Error('Failed to fetch match history from Deadlock API.');
  }
}

/**
 * Fetch metadata for a single match (includes salt for CDN download).
 * @param {string|number} matchId
 * @returns {Promise<Object>} Match metadata including `match_id`, `cluster_id`, `salt`, etc.
 */
async function getMatchMetadata(matchId) {
  try {
    const { data } = await matchesApi.salts({ matchId: Number(matchId) });
    logger.debug(`Fetched metadata salts for match ${matchId}`);
    return data;
  } catch (err) {
    logger.error(`Failed to fetch metadata for match ${matchId}: ${err.message}`);
    if (err.response?.status === 404) {
      throw new Error('Match not found. It may have expired or the ID is incorrect.');
    }
    throw new Error('Failed to fetch match metadata from Deadlock API.');
  }
}

/**
 * Fetch full match info (players, duration, result, etc.).
 * @param {string|number} matchId
 * @returns {Promise<Object>}
 */
async function getMatchInfo(matchId) {
  try {
    const { data } = await matchesApi.metadata({ matchId: Number(matchId) });
    logger.debug(`Fetched match info for ${matchId}`);
    return data;
  } catch (err) {
    logger.error(`Failed to fetch match info for ${matchId}: ${err.message}`);
    if (err.response?.status === 404) {
      throw new Error('Match not found.');
    }
    throw new Error('Failed to fetch match info from Deadlock API.');
  }
}

module.exports = {
  getMatchHistory,
  getMatchMetadata,
  getMatchInfo,
};
