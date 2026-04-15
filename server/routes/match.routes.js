const { Router } = require('express');
const { getMatch, getMetadata } = require('../controllers/match.controller');
const { requireParam } = require('../middleware/validation');

const router = Router();

// GET /api/matches/:matchId — full match info
router.get('/:matchId', requireParam('matchId'), getMatch);

// GET /api/matches/:matchId/metadata — match metadata with CDN salt
router.get('/:matchId/metadata', requireParam('matchId'), getMetadata);

module.exports = router;
