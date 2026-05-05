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
 *             $ref: '#/components/schemas/PlayerResolveRequest'
 *     responses:
 *       200:
 *         description: Resolved player IDs and basic info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *       400:
 *         $ref: '#/components/responses/BadRequest'
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
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MatchSummary'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get('/:accountId/matches', requireNumericParam('accountId'), getPlayerMatches);

/**
 * @swagger
 * /api/players/{accountId}/sync:
 *   post:
 *     summary: Trigger manual match history refresh from API
 *     tags: [Players]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Manual sync result
 *       400:
 *         $ref: '#/components/responses/BadRequest'
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
 *     responses:
 *       200:
 *         description: Rank prediction timeline
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *       400:
 *         $ref: '#/components/responses/BadRequest'
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
 *     responses:
 *       200:
 *         description: Unified player profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PlayerProfile'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get('/:accountId/profile', requireNumericParam('accountId'), getPlayerProfile);

module.exports = router;
