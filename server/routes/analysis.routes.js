const { Router } = require('express');
const { runAnalysis, getCachedAnalysis, createSharedAnalysisLink } = require('../controllers/analysis.controller');

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
 *             $ref: '#/components/schemas/AnalysisRequest'
 *     responses:
 *       200:
 *         description: Analysis complete or retrieved from cache
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnalysisResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/run', runAnalysis);

/**
 * @swagger
 * /api/analysis/share:
 *   post:
 *     summary: Create a signed shared-report token
 *     tags: [Analysis]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AnalysisRequest'
 *     responses:
 *       200:
 *         description: Signed share path and token
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/share', createSharedAnalysisLink);

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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnalysisResponse'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:matchId/:accountId', getCachedAnalysis);

module.exports = router;
