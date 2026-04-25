const { getHeroes, getItems, getRanks } = require('../services/deadlockApi.service');
const logger = require('../utils/logger');

/**
 * Cache-Control header for metadata endpoints.
 * These change at most once per day — aggressive caching is safe.
 *   - Browser: cache for 1 hour (max-age)
 *   - CDN/Edge: cache for 24 hours (s-maxage)
 *   - Serve stale for 1 hour while revalidating in background
 */
const META_CACHE_HEADER = 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=3600';

/**
 * GET /api/meta/heroes
 * Fetch hero metadata from Deadlock Assets API.
 */
async function getHeroesHandler(req, res, next) {
  try {
    const heroes = await getHeroes();
    res.setHeader('Cache-Control', META_CACHE_HEADER);
    res.json(heroes);
  } catch (err) {
    logger.error(`Failed to serve heroes metadata: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch heroes metadata' });
  }
}

/**
 * GET /api/meta/items
 * Fetch item metadata from Deadlock Assets API.
 */
async function getItemsHandler(req, res, next) {
  try {
    const items = await getItems();
    res.setHeader('Cache-Control', META_CACHE_HEADER);
    res.json(items);
  } catch (err) {
    logger.error(`Failed to serve items metadata: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch items metadata' });
  }
}

/**
 * GET /api/meta/ranks
 * Fetch rank metadata from Deadlock Assets API.
 */
async function getRanksHandler(req, res, next) {
  try {
    const ranks = await getRanks();
    res.setHeader('Cache-Control', META_CACHE_HEADER);
    res.json(ranks);
  } catch (err) {
    logger.error(`Failed to serve ranks metadata: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch ranks metadata' });
  }
}

module.exports = { getHeroesHandler, getItemsHandler, getRanksHandler };
