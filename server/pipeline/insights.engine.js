const logger = require('../utils/logger');

/**
 * Actionable Insights Engine (API-based)
 *
 * Analyzes the outputs of all four modules and generates 3–5 plain-language
 * "Insight Cards" prioritised by the magnitude of the mathematical leak.
 *
 * Each insight has:
 *   - severity  : 'critical' | 'warning' | 'info'
 *   - module    : which module it relates to
 *   - title     : short headline
 *   - detail    : plain-English explanation with numbers
 *   - impact    : estimated score-point impact
 */

function generateInsights(heroPerformanceResult, itemizationResult, combatResult, benchmarksResult) {
  logger.debug('Generating insight cards');

  const insights = [];

  // ---- Hero Performance Insights ----
  insightsFromHeroPerformance(heroPerformanceResult, insights);

  // ---- Itemization Insights ----
  insightsFromItemization(itemizationResult, insights);

  // ---- Combat Insights ----
  insightsFromCombat(combatResult, insights);

  // ---- Benchmark Insights ----
  insightsFromBenchmarks(benchmarksResult, insights);

  // Sort by impact descending, take top 5
  insights.sort((a, b) => b.impact - a.impact);
  const topInsights = insights.slice(0, 5);

  logger.info(`Generated ${topInsights.length} insight cards`);
  return topInsights;
}

// ----------------------------------------------------------------
// Module-specific insight generators
// ----------------------------------------------------------------

function insightsFromHeroPerformance(heroPerf, insights) {
  if (!heroPerf) return;

  // Low winrate
  if (heroPerf.winrate < 45 && heroPerf.matchesPlayed > 5) {
    insights.push({
      severity: heroPerf.winrate < 40 ? 'critical' : 'warning',
      module: 'heroPerformance',
      title: 'Low Hero Winrate',
      detail: `Your winrate on this hero is ${heroPerf.winrate}% over ${heroPerf.matchesPlayed} matches. Consider practicing in unranked matches or switching to a hero you're more comfortable with.`,
      impact: Math.min((50 - heroPerf.winrate) / 2, 25),
    });
  }

  // Low KDA
  if (heroPerf.avgKda < 2.0 && heroPerf.matchesPlayed > 5) {
    insights.push({
      severity: heroPerf.avgKda < 1.5 ? 'critical' : 'warning',
      module: 'heroPerformance',
      title: 'Below-Average KDA',
      detail: `Your average KDA on this hero is ${heroPerf.avgKda}. Focus on improving positioning and survival to increase your effectiveness in teamfights.`,
      impact: Math.min((3 - heroPerf.avgKda) * 10, 20),
    });
  }

  // High winrate - positive reinforcement
  if (heroPerf.winrate > 60 && heroPerf.matchesPlayed > 10) {
    insights.push({
      severity: 'info',
      module: 'heroPerformance',
      title: 'Excellent Hero Performance',
      detail: `Your winrate on this hero is ${heroPerf.winrate}% over ${heroPerf.matchesPlayed} matches. You're performing well above average!`,
      impact: 0,
    });
  }
}

function insightsFromItemization(item, insights) {
  if (!item) return;

  // Low net worth
  if (item.netWorth < 5000 && item.souls > 0) {
    insights.push({
      severity: 'warning',
      module: 'itemization',
      title: 'Low Net Worth Efficiency',
      detail: `Your net worth (${item.netWorth}) seems low for your souls (${item.souls}). Focus on efficient farming and timely item purchases to convert souls into power.`,
      impact: Math.min((10000 - item.netWorth) / 500, 15),
    });
  }

  // No items purchased
  if (item.items && item.items.length === 0) {
    insights.push({
      severity: 'critical',
      module: 'itemization',
      title: 'No Items Purchased',
      detail: `No item data available for this match. Ensure you're purchasing items throughout the game to scale into the late game.`,
      impact: 20,
    });
  }
}

function insightsFromCombat(combat, insights) {
  if (!combat) return;

  // High death count
  if (combat.deaths > 10) {
    insights.push({
      severity: combat.deaths > 15 ? 'critical' : 'warning',
      module: 'combat',
      title: 'Excessive Deaths',
      detail: `You died ${combat.deaths} times this match. Focus on positioning and knowing when to retreat to stay alive for teamfights.`,
      impact: Math.min((combat.deaths - 5) * 2, 25),
    });
  }

  // Low KDA
  if (combat.kda < 1.5 && combat.kills + combat.assists > 0) {
    insights.push({
      severity: 'warning',
      module: 'combat',
      title: 'Low Combat Efficiency',
      detail: `Your KDA is ${combat.kda}. Try to secure more kills/assists while minimizing deaths to improve your combat impact.`,
      impact: Math.min((2.5 - combat.kda) * 10, 15),
    });
  }

  // High damage output - positive reinforcement
  if (combat.damage > 25000) {
    insights.push({
      severity: 'info',
      module: 'combat',
      title: 'High Damage Output',
      detail: `You dealt ${combat.damage} damage this match. Great job contributing to your team's damage output!`,
      impact: 0,
    });
  }
}

function insightsFromBenchmarks(benchmarks, insights) {
  if (!benchmarks) return;

  // Below benchmark winrate
  if (benchmarks.winrateDiff < -15) {
    insights.push({
      severity: benchmarks.winrateDiff < -25 ? 'critical' : 'warning',
      module: 'benchmarks',
      title: 'Below Top Player Winrate',
      detail: `Your winrate is ${Math.abs(benchmarks.winrateDiff)}% below top player benchmarks. Study high-level gameplay and guides for this hero to improve.`,
      impact: Math.min(Math.abs(benchmarks.winrateDiff) / 2, 20),
    });
  }

  // Below benchmark KDA
  if (benchmarks.kdaDiff < -1.5) {
    insights.push({
      severity: 'warning',
      module: 'benchmarks',
      title: 'Below Top Player KDA',
      detail: `Your KDA is ${Math.abs(benchmarks.kdaDiff)} below top player benchmarks. Work on your combat mechanics and positioning to close the gap.`,
      impact: Math.min(Math.abs(benchmarks.kdaDiff) * 10, 15),
    });
  }

  // Above benchmarks - positive reinforcement
  if (benchmarks.winrateDiff > 10 && benchmarks.kdaDiff > 0.5) {
    insights.push({
      severity: 'info',
      module: 'benchmarks',
      title: 'Exceeding Top Player Benchmarks',
      detail: `Your performance exceeds top player benchmarks! You're in the top percentile of players for this hero.`,
      impact: 0,
    });
  }
}

module.exports = { generateInsights };
