const { Router } = require('express');
const { getMatch, getMetadata } = require('../controllers/match.controller');
const { requireNumericParam } = require('../middleware/validation');

const router = Router();

// GET /api/matches/:matchId — full match info
router.get('/:matchId', requireNumericParam('matchId'), getMatch);

// GET /api/matches/:matchId/metadata — match metadata with CDN salt
router.get('/:matchId/metadata', requireNumericParam('matchId'), getMetadata);

module.exports = router;
