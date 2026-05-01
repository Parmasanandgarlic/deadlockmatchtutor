const { Configuration, PlayersApi, MatchesApi, AnalyticsApi } = require('../deadlock_api_client');
const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');
const redisClient = require('./redis.service');
const { warnOnContractMismatch, MATCH_HISTORY_SCHEMA } = require('../utils/responseContracts');
const { ApiUnavailableError } = require('../utils/apiAdapter');
const { CircuitBreaker } = require('../utils/circuitBreaker');

const apiBreaker = new CircuitBreaker('DeadlockAPI', { failureThreshold: 3, resetTimeoutMs: 30000 });

const configuration = new Configuration({
  basePath: config.deadlockApi.baseUrl,
});

const playersApi = new PlayersApi(configuration);
const matchesApi = new MatchesApi(configuration);
const analyticsApi = new AnalyticsApi(configuration);
const ASSETS_API_BASE_URL = 'https://assets.deadlock-api.com/v2';
const ASSET_CACHE_TTL_SECONDS = 24 * 60 * 60;
const ASSET_CACHE_TTL_MS = ASSET_CACHE_TTL_SECONDS * 1000;
const assetMemoryCache = new Map();

function normalizeMatchHistory(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.matches)) return data.matches;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

async function fetchAssetList(label, path, redisKey) {
  const now = Date.now();
  const memoryHit = assetMemoryCache.get(label);
  if (memoryHit && now - memoryHit.fetchedAt < ASSET_CACHE_TTL_MS) {
    return memoryHit.data;
  }

  const cached = redisKey ? await redisClient.get(redisKey).catch(() => null) : null;
  if (Array.isArray(cached) && cached.length > 0) {
    assetMemoryCache.set(label, { data: cached, fetchedAt: now });
    return cached;
  }

  const { data } = await apiBreaker.call(() => axios.get(`${ASSETS_API_BASE_URL}/${path}`, { timeout: 10000 }));
  const list = Array.isArray(data) ? data : [];
  if (list.length > 0) {
    assetMemoryCache.set(label, { data: list, fetchedAt: now });
    if (redisKey) {
      await redisClient.set(redisKey, list, ASSET_CACHE_TTL_SECONDS).catch(() => false);
    }
  }
  return list;
}

async function fetchMatchHistoryFromApi(accountId) {
  const url = `${config.deadlockApi.baseUrl}/v1/players/${Number(accountId)}/match-history`;
  const { data } = await apiBreaker.call(() => axios.get(url, {
    timeout: 15000,
  }));
  return data;
}

/**
 * Fetch a player's recent match history.
 * @param {string|number} accountId  Steam32 account ID
 * @returns {Promise<Array>} Array of match summary objects
 */
async function getMatchHistory(accountId, { bypassCache = false } = {}) {
  const cacheKey = redisClient.cacheKeys?.playerMatches?.(accountId);
  
  try {
    // 1. Check Redis Cache unless the caller explicitly wants a fresh fetch
    const cached = !bypassCache && cacheKey ? await redisClient.get(cacheKey) : null;
    if (cached) {
      logger.debug(`[Redis] Cache hit for match history: ${accountId}`);
      const matches = normalizeMatchHistory(cached);
      warnOnContractMismatch(`matchHistory.cached.${accountId}`, matches, MATCH_HISTORY_SCHEMA);
      return matches;
    }

    // 2. Fetch from API
    const data = await fetchMatchHistoryFromApi(accountId);
    const matches = normalizeMatchHistory(data);
    warnOnContractMismatch(`matchHistory.${accountId}`, matches, MATCH_HISTORY_SCHEMA);
    logger.debug(`Fetched ${matches.length} matches for account ${accountId}`);

    // 3. Save to Redis (2 minute TTL)
    if (cacheKey && matches.length > 0) {
      await redisClient.set(cacheKey, matches, 120);
    }

    return matches;
  } catch (err) {
    logger.error(`Failed to fetch match history for ${accountId}: ${err.message}`);
    if (err.response?.status === 404) {
      return []; // Return empty array instead of throwing for 404
    }
    if (err.response?.status === 400) {
      throw new Error('Invalid account ID. Please check the Steam ID and try again.');
    }
    if (err.response?.status === 500) {
      throw new ApiUnavailableError(
        'Deadlock API is currently experiencing issues. Please try again later.',
        500,
        'getMatchHistory'
      );
    }
    if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
      throw new ApiUnavailableError(
        'Deadlock API timed out while loading match history. Please try again in a moment.',
        408,
        'getMatchHistory'
      );
    }
    throw new ApiUnavailableError(
      'Failed to fetch match history from Deadlock API.',
      err.response?.status || 0,
      'getMatchHistory'
    );
  }
}

/**
 * Fetch metadata for a single match (includes salt for CDN download).
 * @param {string|number} matchId
 * @returns {Promise<Object>} Match metadata including `match_id`, `cluster_id`, `salt`, etc.
 */
async function getMatchMetadata(matchId) {
  try {
    const { data } = await apiBreaker.call(() => matchesApi.salts({ matchId: Number(matchId) }));
    logger.debug(`Fetched metadata salts for match ${matchId}`);
    return data;
  } catch (err) {
    logger.error(`Failed to fetch metadata for match ${matchId}: ${err.message}`);
    if (err.response?.status === 404) {
      throw new Error('Match not found. It may have expired or the ID is incorrect.');
    }
    if (err.response?.status === 500) {
      // FAIL FAST: Don't silently return {} — callers need to know data is missing.
      throw new ApiUnavailableError(
        `Match metadata unavailable for match ${matchId} (API 500).`,
        500,
        'getMatchMetadata'
      );
    }
    throw new ApiUnavailableError(
      'Failed to fetch match metadata from Deadlock API.',
      err.response?.status || 0,
      'getMatchMetadata'
    );
  }
}

/**
 * Fetch full match info (players, duration, result, etc.).
 * @param {string|number} matchId
 * @returns {Promise<Object>}
 */
async function getMatchInfo(matchId) {
  const cacheKey = redisClient.cacheKeys?.matchDetails?.(matchId);

  // 1. Check Redis Cache
  try {
    const cached = cacheKey ? await redisClient.get(cacheKey) : null;
    if (cached && Object.keys(cached).length > 0) {
      logger.debug(`[Redis] Cache hit for match info: ${matchId}`);
      return cached;
    }
  } catch (err) {
    logger.warn(`[Redis] Match info read failed for ${matchId}: ${err.message}`);
  }

  // 2. Prefer the bulk metadata endpoint because it supports include_player_items,
  //    include_player_stats, and include_player_death_details. Some match endpoints
  //    (e.g. /matches/{match_id}/metadata) ignore these flags and will not return
  //    item data, which breaks build-path grading.
  let lastErr = null;
  try {
    const { data } = await apiBreaker.call(() => matchesApi.bulkMetadata({
      includeInfo: true,
      includeMoreInfo: true,
      includePlayerInfo: true,
      includePlayerItems: true,
      includePlayerStats: true,
      includePlayerDeathDetails: true,
      matchIds: [Number(matchId)],
      limit: 1,
    }));

    const match = Array.isArray(data) ? data[0] : data;
    if (match && typeof match === 'object' && Object.keys(match).length > 0) {
      logger.debug(`Fetched bulk match info for ${matchId}`);
      if (cacheKey) {
        await redisClient.set(cacheKey, match, 2592000).catch(() => {});
      }
      return match;
    }
    logger.warn(`[MatchInfo] Empty bulk payload for ${matchId}`);
  } catch (err) {
    lastErr = err;
    const status = err.response?.status;
    logger.warn(`[MatchInfo] Bulk metadata failed for ${matchId} (status ${status || 'n/a'}): ${err.message}`);
  }

  // 3. Fall back to the generated client's basic metadata call (no item guarantees).
  try {
    const { data } = await apiBreaker.call(() => matchesApi.metadata({ matchId: Number(matchId) }));
    if (data && Object.keys(data).length > 0) {
      logger.debug(`Fetched fallback match info for ${matchId}`);
      if (cacheKey) {
        await redisClient.set(cacheKey, data, 2592000).catch(() => {});
      }
      return data;
    }
  } catch (fallbackErr) {
    lastErr = fallbackErr;
    logger.error(`Failed to fetch match info for ${matchId}: ${fallbackErr.message}`);
    if (fallbackErr.response?.status === 404) {
      throw new Error('Match not found.');
    }
  }

  // 4. Fail explicitly — callers must handle the absence of match info.
  if (lastErr?.response?.status === 404) throw new Error('Match not found.');
  throw new ApiUnavailableError(
    `Match info unavailable for ${matchId}. All API endpoints failed.`,
    lastErr?.response?.status || 0,
    'getMatchInfo'
  );
}

/**
 * Fetch hero-specific statistics for a player.
 * @param {string|number} accountId
 * @param {string|number} heroId
 * @returns {Promise<Object>} Hero-specific stats
 */
async function getPlayerHeroStats(accountId, heroId) {
  try {
    const { data } = await apiBreaker.call(() => playersApi.playerHeroStats({
      accountIds: [Number(accountId)],
      heroIds: [Number(heroId)],
    }));
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
 * Fetch hero-specific statistics for a player across ALL heroes.
 * Powers the player profile "Top Heroes" strip.
 * @param {string|number} accountId
 * @returns {Promise<Array>} Array of per-hero stats objects
 */
async function getPlayerHeroStatsAll(accountId) {
  try {
    const { data } = await apiBreaker.call(() => playersApi.playerHeroStats({
      accountIds: [Number(accountId)],
    }));
    const arr = Array.isArray(data) ? data : [];
    logger.debug(`Fetched all hero stats for account ${accountId}: ${arr.length} heroes`);
    return arr;
  } catch (err) {
    if (err.response?.status === 403 || err.response?.status === 404 || err.response?.status === 500) {
      logger.warn(`All-hero stats error (${err.response?.status}) for ${accountId}. Continuing without it.`);
      return [];
    }
    logger.error(`Failed to fetch all-hero stats for ${accountId}: ${err.message}`);
    return [];
  }
}

/**
 * Fetch rank prediction for a player.
 * @param {string|number} accountId
 * @returns {Promise<Object>} Rank prediction data
 */
async function getPlayerRankPredict(accountId) {
  try {
    const { data } = await apiBreaker.call(() => playersApi.rankPredict({ accountId: Number(accountId) }));
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
    const { data } = await apiBreaker.call(() => playersApi.accountStats({ accountId: Number(accountId) }));
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
  const cacheKey = redisClient.cacheKeys?.userProfile?.(accountId);
  
  try {
    // 1. Check Redis Cache
    const cached = cacheKey ? await redisClient.get(cacheKey) : null;
    if (cached) {
      logger.debug(`[Redis] Cache hit for player card: ${accountId}`);
      return cached;
    }

    const { data } = await apiBreaker.call(() => playersApi.card({ accountId: Number(accountId) }));
    logger.debug(`Fetched player card for account ${accountId}`);

    // 3. Save to Redis (1 hour TTL)
    if (cacheKey && data && Object.keys(data).length > 0) {
      await redisClient.set(cacheKey, data, 3600);
    }

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
    const data = await fetchAssetList('heroes', 'heroes', redisClient.cacheKeys?.heroData?.());
    logger.debug('Fetched heroes from Deadlock Assets API');
    return data;
  } catch (err) {
    logger.warn(`Failed to fetch heroes from API: ${err.message}. Using static mapping.`);
    return [];
  }
}

/**
 * Fetch item names from Deadlock Assets API.
 * @returns {Promise<Object>} Map of item_id to item_name
 */
async function getItems() {
  try {
    const data = await fetchAssetList('items', 'items', redisClient.cacheKeys?.itemData?.());
    logger.debug('Fetched items from Deadlock Assets API');
    return data;
  } catch (err) {
    logger.warn(`Failed to fetch items from API: ${err.message}. Using static mapping.`);
    return [];
  }
}

/**
 * Fetch global hero stats from Analytics API.
 * Used for building global tier lists.
 * @returns {Promise<Array>} Array of global hero stats
 */
async function getGlobalHeroStats() {
  try {
    const { data } = await apiBreaker.call(() => analyticsApi.heroStats());
    logger.debug('Fetched global hero stats from Analytics API');
    const arr = Array.isArray(data) ? data : [];
    return arr;
  } catch (err) {
    logger.error(`Failed to fetch global hero stats: ${err.message}`);
    return [];
  }
}

/**
 * Fetch rank data from Deadlock Assets API.
 * @returns {Promise<Array>} Array of rank objects with tier, name, images
 */
async function getRanks() {
  try {
    const data = await fetchAssetList('ranks', 'ranks', redisClient.cacheKeys?.rankData?.());
    logger.debug('Fetched ranks from Deadlock Assets API');
    // Return as-is (array of { tier, name, images: { small_webp, large_webp, ... } })
    return data;
  } catch (err) {
    logger.warn(`Failed to fetch ranks from API: ${err.message}. Using empty array.`);
    return [];
  }
}

module.exports = {
  getMatchHistory,
  getMatchMetadata,
  getMatchInfo,
  getPlayerHeroStats,
  getPlayerHeroStatsAll,
  getPlayerRankPredict,
  getPlayerAccountStats,
  getPlayerCard,
  getGlobalHeroStats,
  getHeroes,
  getItems,
  getRanks,
};
