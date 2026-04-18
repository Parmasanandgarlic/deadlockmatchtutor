const { Configuration, PlayersApi, MatchesApi } = require('deadlock_api_client');
const axios = require('axios');
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
    if (err.response?.status === 400) {
      throw new Error('Invalid account ID. Please check the Steam ID and try again.');
    }
    if (err.response?.status === 500) {
      throw new Error('Deadlock API is currently experiencing issues. Please try again later.');
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
    if (err.response?.status === 500) {
      logger.warn(`Match metadata 500 error for match ${matchId}. Continuing without it.`);
      return {};
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
    if (err.response?.status === 500) {
      logger.warn(`Match info 500 error for match ${matchId}. Continuing without it.`);
      return {};
    }
    throw new Error('Failed to fetch match info from Deadlock API.');
  }
}

/**
 * Fetch hero-specific statistics for a player.
 * @param {string|number} accountId
 * @param {string|number} heroId
 * @returns {Promise<Object>} Hero-specific stats
 */
async function getPlayerHeroStats(accountId, heroId) {
  try {
    const { data } = await playersApi.playerHeroStats({
      accountIds: [Number(accountId)],
      heroIds: [Number(heroId)],
    });
    logger.debug(`Fetched hero stats for account ${accountId}, hero ${heroId}`);

    // The API returns an array, so we find the matching hero stats
    const stats = Array.isArray(data) ? data.find(h => Number(h.hero_id) === Number(heroId)) : data;
    return stats || {};
  } catch (err) {
    if (err.response?.status === 403 || err.response?.status === 404 || err.response?.status === 500) {
      logger.warn(`Hero stats error (${err.response?.status}) for ${accountId}/${heroId}. Continuing without it.`);
      return {};
    }
    logger.error(`Failed to fetch hero stats for ${accountId}/${heroId}: ${err.message}`);
    throw new Error('Failed to fetch hero stats from Deadlock API.');
  }
}

/**
 * Fetch rank prediction for a player.
 * @param {string|number} accountId
 * @returns {Promise<Object>} Rank prediction data
 */
async function getPlayerRankPredict(accountId) {
  try {
    const { data } = await playersApi.rankPredict({ accountId: Number(accountId) });
    logger.debug(`Fetched rank predict for account ${accountId}`);
    return data;
  } catch (err) {
    if (err.response?.status === 403 || err.response?.status === 404 || err.response?.status === 500) {
      logger.warn(`Rank predict error (${err.response?.status}) for ${accountId}. Continuing without it.`);
      return {};
    }
    logger.error(`Failed to fetch rank predict for ${accountId}: ${err.message}`);
    throw new Error('Failed to fetch rank prediction from Deadlock API.');
  }
}

/**
 * Fetch general account statistics for a player.
 * @param {string|number} accountId
 * @returns {Promise<Object>} Account stats
 */
async function getPlayerAccountStats(accountId) {
  try {
    const { data } = await playersApi.accountStats({ accountId: Number(accountId) });
    logger.debug(`Fetched account stats for account ${accountId}`);
    return data;
  } catch (err) {
    if (err.response?.status === 403 || err.response?.status === 500) {
      logger.warn(`Account stats error (${err.response?.status}) for ${accountId}. Continuing without it.`);
      return {};
    }
    logger.error(`Failed to fetch account stats for ${accountId}: ${err.message}`);
    throw new Error('Failed to fetch account stats from Deadlock API.');
  }
}

/**
 * Fetch player card/profile data.
 * @param {string|number} accountId
 * @returns {Promise<Object>} Player card data
 */
async function getPlayerCard(accountId) {
  try {
    const { data } = await playersApi.card({ accountId: Number(accountId) });
    logger.debug(`Fetched player card for account ${accountId}`);
    return data;
  } catch (err) {
    if (err.response?.status === 403 || err.response?.status === 500) {
      logger.warn(`Player card error (${err.response?.status}) for ${accountId}. Continuing without it.`);
      return {};
    }
    logger.error(`Failed to fetch player card for ${accountId}: ${err.message}`);
    throw new Error('Failed to fetch player card from Deadlock API.');
  }
}

/**
 * Fetch hero names from Deadlock API.
 * Uses the assets API which provides hero data.
 * @returns {Promise<Object>} Map of hero_id to hero_name
 */
async function getHeroes() {
  try {
    const { data } = await axios.get('https://assets.deadlock-api.com/v2/heroes');
    logger.debug('Fetched heroes from Deadlock Assets API');
    // Convert array to object: { hero_id: hero_name }
    const heroMap = {};
    if (Array.isArray(data)) {
      data.forEach(hero => {
        if (hero.id && hero.name) {
          heroMap[hero.id] = hero.name;
        }
      });
    }
    return heroMap;
  } catch (err) {
    logger.warn(`Failed to fetch heroes from API: ${err.message}. Using static mapping.`);
    return {};
  }
}

/**
 * Fetch item names from Deadlock Assets API.
 * @returns {Promise<Object>} Map of item_id to item_name
 */
async function getItems() {
  try {
    const { data } = await axios.get('https://assets.deadlock-api.com/v2/items');
    logger.debug('Fetched items from Deadlock Assets API');
    // Convert array to object: { item_id: item_name }
    const itemMap = {};
    if (Array.isArray(data)) {
      data.forEach(item => {
        if (item.id && item.name) {
          itemMap[item.id] = item.name;
        }
      });
    }
    return itemMap;
  } catch (err) {
    logger.warn(`Failed to fetch items from API: ${err.message}. Using static mapping.`);
    return {};
  }
}

module.exports = {
  getMatchHistory,
  getMatchMetadata,
  getMatchInfo,
  getPlayerHeroStats,
  getPlayerRankPredict,
  getPlayerAccountStats,
  getPlayerCard,
  getHeroes,
  getItems,
};
