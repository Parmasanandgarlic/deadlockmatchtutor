const { Router } = require('express');
const { runAnalysis, getCachedAnalysis } = require('../controllers/analysis.controller');

const router = Router();

/**
 * @swagger
 * /api/analysis/run:
 *   post:
 *     summary: Trigger full match analysis pipeline
 *     tags: [Analysis]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - matchId
 *               - accountId
 *             properties:
 *               matchId:
 *                 type: integer
 *                 description: The unique ID of the match to analyze
 *               accountId:
 *                 type: integer
 *                 description: The account ID of the player being analyzed
 *     responses:
 *       200:
 *         description: Analysis complete or retrieved from cache
 *       400:
 *         description: Missing or invalid parameters
 */
router.post('/run', runAnalysis);

/**
 * @swagger
 * /api/analysis/{matchId}/{accountId}:
 *   get:
 *     summary: Retrieve cached analysis result
 *     tags: [Analysis]
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cached analysis payload
 *       404:
 *         description: Analysis not found
 */
router.get('/:matchId/:accountId', getCachedAnalysis);

module.exports = router;
