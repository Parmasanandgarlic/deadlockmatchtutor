const { Router } = require('express');
const playerRoutes = require('./player.routes');
const matchRoutes = require('./match.routes');
const analysisRoutes = require('./analysis.routes');
const cronRoutes = require('./cron.routes');

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok' }));
router.use('/players', playerRoutes);
router.use('/matches', matchRoutes);
router.use('/analysis', analysisRoutes);
router.use('/cron', cronRoutes);

module.exports = router;
