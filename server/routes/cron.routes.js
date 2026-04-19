const express = require('express');
const router = express.Router();
const syncController = require('../controllers/sync.controller');

/**
 * @swagger
 * /api/cron/sync:
 *   get:
 *     summary: Trigger background match synchronization for active accounts.
 *     tags: [Utility]
 */
router.get('/sync', syncController.handleCronSync);

module.exports = router;
