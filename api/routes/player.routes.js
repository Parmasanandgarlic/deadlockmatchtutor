const { Router } = require('express');
const { resolvePlayer, getPlayerMatches } = require('../controllers/player.controller');
const { validateSteamInput, requireNumericParam } = require('../middleware/validation');

const router = Router();

// POST /api/players/resolve — resolve Steam input to IDs
router.post('/resolve', validateSteamInput, resolvePlayer);

// GET /api/players/:accountId/matches — fetch match history
router.get('/:accountId/matches', requireNumericParam('accountId'), getPlayerMatches);

module.exports = router;
