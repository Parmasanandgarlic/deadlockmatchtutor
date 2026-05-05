const { Router } = require('express');
const { getMatch, getMetadata } = require('../controllers/match.controller');
const { requireNumericParam } = require('../middleware/validation');

const router = Router();

/**
 * @swagger
 * /api/matches/{matchId}:
 *   get:
 *     summary: Fetch full match information
 *     tags: [Matches]
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Full match data object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:matchId', requireNumericParam('matchId'), getMatch);

/**
 * @swagger
 * /api/matches/{matchId}/metadata:
 *   get:
 *     summary: Fetch match metadata with CDN salt
 *     tags: [Matches]
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Match metadata (salt, cluster_id, etc.)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:matchId/metadata', requireNumericParam('matchId'), getMetadata);

module.exports = router;
