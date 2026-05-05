const { Router } = require('express');
const { getHeroesHandler, getItemsHandler, getRanksHandler, getTierListHandler, getHeroGuideHandler } = require('../controllers/meta.controller');

const router = Router();

/**
 * @swagger
 * /api/meta/heroes:
 *   get:
 *     summary: List known Deadlock heroes
 *     tags: [Metadata]
 *     responses:
 *       200:
 *         description: Hero metadata list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 additionalProperties: true
 */
router.get('/heroes', getHeroesHandler);

/**
 * @swagger
 * /api/meta/heroes/{id}/guide:
 *   get:
 *     summary: Get hero-specific guide metadata
 *     tags: [Metadata]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Hero guide metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/heroes/:id/guide', getHeroGuideHandler);

/**
 * @swagger
 * /api/meta/items:
 *   get:
 *     summary: List known Deadlock items
 *     tags: [Metadata]
 *     responses:
 *       200:
 *         description: Item metadata list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 additionalProperties: true
 */
router.get('/items', getItemsHandler);

/**
 * @swagger
 * /api/meta/ranks:
 *   get:
 *     summary: List Deadlock rank metadata
 *     tags: [Metadata]
 *     responses:
 *       200:
 *         description: Rank metadata list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 additionalProperties: true
 */
router.get('/ranks', getRanksHandler);

/**
 * @swagger
 * /api/meta/tierlist:
 *   get:
 *     summary: Get hero tier list metadata
 *     tags: [Metadata]
 *     responses:
 *       200:
 *         description: Tier list payload
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 */
router.get('/tierlist', getTierListHandler);

module.exports = router;
