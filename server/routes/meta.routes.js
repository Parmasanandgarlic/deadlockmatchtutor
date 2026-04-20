const { Router } = require('express');
const { getHeroesHandler, getItemsHandler, getRanksHandler } = require('../controllers/meta.controller');

const router = Router();

router.get('/heroes', getHeroesHandler);
router.get('/items', getItemsHandler);
router.get('/ranks', getRanksHandler);

module.exports = router;
