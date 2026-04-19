const express = require('express');
const router = express.Router();
const { getPlayerProfileTrends } = require('../services/trends.service');
const { requireNumericParam } = require('../middleware/validation');

/**
 * @swagger
 * /api/trends/{accountId}:
 *   get:
 *     summary: Get trend analysis for a player
 *     description: Aggregates recent match analyses to compute rolling averages and trajectory for performance, itemization, and economy metrics.
 *     tags: [Trends]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The player's Steam32 account ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of recent matches to analyze (default 10, max 30)
 *     responses:
 *       200:
 *         description: Successful trend aggregation
 *       400:
 *         description: Invalid account ID format
 *       500:
 *         description: Internal server error
 */
router.get('/:accountId', requireNumericParam('accountId'), async (req, res, next) => {
  try {
    const { accountId } = req.params;
    let limit = parseInt(req.query.limit, 10);
    if (isNaN(limit) || limit < 1) limit = 10;
    if (limit > 30) limit = 30; // Cap to prevent DB strain

    const trends = await getPlayerProfileTrends(accountId, limit);
    res.json(trends);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
