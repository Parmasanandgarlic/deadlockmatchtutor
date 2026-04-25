const { Router } = require('express');
const { getHeroesHandler, getItemsHandler, getRanksHandler, getTierListHandler } = require('../controllers/meta.controller');

const router = Router();

router.get('/heroes', getHeroesHandler);
router.get('/items', getItemsHandler);
router.get('/ranks', getRanksHandler);
router.get('/tierlist', getTierListHandler);

module.exports = router;
