const { Router } = require('express');
const { runAnalysis, getCachedAnalysis } = require('../controllers/analysis.controller');

const router = Router();

// POST /api/analysis/run — trigger full analysis pipeline
router.post('/run', runAnalysis);

// GET /api/analysis/:matchId/:accountId — retrieve cached analysis (shared links)
router.get('/:matchId/:accountId', getCachedAnalysis);

module.exports = router;
