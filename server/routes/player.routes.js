const { Router } = require('express');
const {
  resolvePlayer,
  getPlayerMatches,
  getPlayerMmrHistory,
  getPlayerProfile,
} = require('../controllers/player.controller');
const { handleManualSync } = require('../controllers/sync.controller');
const { validateSteamInput, requireNumericParam } = require('../middleware/validation');

const router = Router();

/**
 * @swagger
 * /api/players/resolve:
 *   post:
 *     summary: Resolve Steam input (URL, ID, Vanity) to account IDs
 *     tags: [Players]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - steamInput
 *             properties:
 *               steamInput:
 *                 type: string
 *                 description: Steam ID, Vanity name, or Profile URL
 *     responses:
 *       200:
 *         description: Resolved player IDs and basic info
 *       400:
 *         description: Invalid input format
 */
router.post('/resolve', validateSteamInput, resolvePlayer);

/**
 * @swagger
 * /api/players/{accountId}/matches:
 *   get:
 *     summary: Fetch match history for a player
 *     tags: [Players]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of recent matches
 */
router.get('/:accountId/matches', requireNumericParam('accountId'), getPlayerMatches);

/**
 * @swagger
 * /api/players/{accountId}/sync:
 *   post:
 *     summary: Trigger manual match history refresh from API
 *     tags: [Players]
 */
router.post('/:accountId/sync', requireNumericParam('accountId'), handleManualSync);

/**
 * @swagger
 * /api/players/{accountId}/mmr-history:
 *   get:
 *     summary: Longitudinal MMR / rank-predict timeline
 *     tags: [Players]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: integer
 */
router.get('/:accountId/mmr-history', requireNumericParam('accountId'), getPlayerMmrHistory);

/**
 * @swagger
 * /api/players/{accountId}/profile:
 *   get:
 *     summary: Unified player profile — rank, career stats, top heroes
 *     tags: [Players]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: integer
 */
router.get('/:accountId/profile', requireNumericParam('accountId'), getPlayerProfile);

module.exports = router;
