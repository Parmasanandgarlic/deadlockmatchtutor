const express = require('express');
const router = express.Router();
const syncController = require('../controllers/sync.controller');

/**
 * @swagger
 * /api/cron/sync:
 *   get:
 *     summary: Trigger background match synchronization for active accounts.
 *     tags: [Utility]
 *     responses:
 *       200:
 *         description: Sync result
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/sync', syncController.handleCronSync);

module.exports = router;
