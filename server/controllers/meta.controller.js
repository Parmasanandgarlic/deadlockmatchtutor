const { getHeroes, getItems, getRanks } = require('../services/deadlockApi.service');
const logger = require('../utils/logger');

/**
 * GET /api/meta/heroes
 * Fetch hero metadata from Deadlock Assets API.
 */
async function getHeroesHandler(req, res, next) {
  try {
    const heroes = await getHeroes();
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
    res.json(ranks);
  } catch (err) {
    logger.error(`Failed to serve ranks metadata: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch ranks metadata' });
  }
}

module.exports = { getHeroesHandler, getItemsHandler, getRanksHandler };
