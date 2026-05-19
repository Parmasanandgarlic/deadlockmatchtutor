const { Router } = require('express');
const logger = require('../utils/logger');
const { getHeroes, getGlobalHeroStats } = require('../services/deadlockApi.service');

const router = Router();

/**
 * @swagger
 * /api/stats/benchmarks:
 *   get:
 *     summary: Get hero benchmarks by patch
 *     tags: [Stats]
 *     parameters:
 *       - in: query
 *         name: hero
 *         schema:
 *           type: string
 *         description: Hero ID or name
 *       - in: query
 *         name: patch
 *         schema:
 *           type: string
 *         description: Patch version
 *     responses:
 *       200:
 *         description: Benchmark data
 */
router.get('/benchmarks', async (req, res) => {
  try {
    const { hero = 'Seven', patch = '0.9.2' } = req.query;

    const heroes = await getHeroes();
    const targetHero = heroes.find(h => 
      h.name.toLowerCase().replace(/[^a-z0-9]/g, '') === hero.toLowerCase().replace(/[^a-z0-9]/g, '') ||
      h.class_name.toLowerCase().replace(/[^a-z0-9]/g, '') === hero.toLowerCase().replace(/[^a-z0-9]/g, '')
    );

    if (!targetHero) {
      return res.status(404).json({ error: 'Hero not found' });
    }

    const stats = await getGlobalHeroStats();
    const heroStats = stats.find(s => s.hero_id === targetHero.id);

    if (!heroStats) {
      return res.status(404).json({ error: 'Hero stats not found in API' });
    }

    const winRateTarget = Math.round((heroStats.wins / heroStats.matches) * 100);
    const analysisScope = heroStats.matches;
    
    // Estimate SPM (assuming average 35 minute match duration from global metrics)
    const avgNetWorth = heroStats.total_net_worth / heroStats.matches;
    const estimatedSpm = Math.round(avgNetWorth / 35);

    const data = {
      hero: targetHero.name,
      patch,
      midLaneSpmTarget: estimatedSpm,
      analysisScope,
      winRateTarget,
      highScalingSpmTarget: estimatedSpm + 150,
      tankSpmTarget: Math.max(500, estimatedSpm - 150)
    };

    res.json(data);
  } catch (err) {
    logger.error('Error fetching stats benchmarks:', err);
    res.status(500).json({ error: 'Failed to fetch benchmarks' });
  }
});

module.exports = router;
