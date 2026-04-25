const { Router } = require('express');
const playerRoutes = require('./player.routes');
const matchRoutes = require('./match.routes');
const analysisRoutes = require('./analysis.routes');
const authRoutes = require('./auth.routes');
const cronRoutes = require('./cron.routes');
const trendsRoutes = require('./trends.routes');
const metaRoutes = require('./meta.routes');
const feedbackRoutes = require('./feedback.routes');
const { getCsrfToken } = require('../middleware/csrf.middleware');

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok' }));
router.get('/csrf', getCsrfToken);
router.use('/auth', authRoutes);
router.use('/players', playerRoutes);
router.use('/matches', matchRoutes);
router.use('/analysis', analysisRoutes);
router.use('/cron', cronRoutes);
router.use('/trends', trendsRoutes);
router.use('/meta', metaRoutes);
router.use('/feedback', feedbackRoutes);

module.exports = router;
