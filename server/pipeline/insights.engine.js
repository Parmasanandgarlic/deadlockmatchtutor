const logger = require('../utils/logger');

/**
 * Actionable Insights Engine (API-based).
 *
 * Generates 3–5 plain-language "Insight Cards" describing what went right or
 * wrong in THIS specific match. Each insight is sorted by estimated impact
 * so the most important takeaways surface first.
 *
 * Insight shape:
 *   severity  : 'critical' | 'warning' | 'info'
 *   module    : which module it relates to
 *   title     : short headline
 *   detail    : plain-English explanation with numbers
 *   impact    : estimated score-point impact (drives sort)
 */

function generateInsights(heroPerf, itemization, combat, benchmarks) {
  logger.debug('Generating insight cards');

  const insights = [];

  insightsFromMatchPerformance(heroPerf, insights);
  insightsFromItemization(itemization, insights);
  insightsFromCombat(combat, insights);
  insightsFromBenchmarks(benchmarks, insights);

  insights.sort((a, b) => b.impact - a.impact);
  const top = insights.slice(0, 5);
  logger.info(`Generated ${top.length} insight cards`);
  return top;
}

// ----------------------------------------------------------------
// Module-specific generators
// ----------------------------------------------------------------

function insightsFromMatchPerformance(mp, insights) {
  if (!mp) return;

  // Career context: many games on hero but low winrate
  if (mp.winrate > 0 && mp.winrate < 45 && mp.matchesPlayed > 10) {
    insights.push({
      severity: mp.winrate < 40 ? 'critical' : 'warning',
      module: 'heroPerformance',
      title: 'Struggling on This Hero',
      detail: `Career winrate on this hero is ${mp.winrate}% across ${mp.matchesPlayed} games. Consider watching guides or trying unranked practice.`,
      impact: Math.min((50 - mp.winrate) / 2, 20),
    });
  }

  // Match-level: strong individual performance this game
  if (mp.matchKda >= 4 && mp.soulsPerMin >= 600) {
    insights.push({
      severity: 'info',
      module: 'heroPerformance',
      title: 'Dominant Match Performance',
      detail: `This match you posted a ${mp.matchKda} KDA at ${mp.soulsPerMin} souls/min. A genuinely high-impact game — keep it up.`,
      impact: 0,
    });
  }
}

function insightsFromItemization(item, insights) {
  if (!item) return;

  if (item.soulsPerMin > 0 && item.soulsPerMin < 400) {
    insights.push({
      severity: item.soulsPerMin < 300 ? 'critical' : 'warning',
      module: 'itemization',
      title: 'Low Farm Efficiency',
      detail: `Only ${item.soulsPerMin} souls/min this match. Strong cores target 600+. Prioritise last-hits, rotate through jungle camps, and avoid idle time.`,
      impact: Math.max(5, Math.min((450 - item.soulsPerMin) / 15, 25)),
    });
  }

  if (item.soulsPerMin >= 700) {
    insights.push({
      severity: 'info',
      module: 'itemization',
      title: 'Excellent Farming',
      detail: `${item.soulsPerMin} souls/min is elite-tier economy pace. That kind of income compounds hard into the late game.`,
      impact: 0,
    });
  }
}

function insightsFromCombat(combat, insights) {
  if (!combat) return;

  if (combat.deaths > 10) {
    insights.push({
      severity: combat.deaths > 14 ? 'critical' : 'warning',
      module: 'combat',
      title: 'Excessive Deaths',
      detail: `You died ${combat.deaths} times this match (${combat.deathsPerMin}/min). Improve map awareness and disengage earlier in lost fights.`,
      impact: Math.min((combat.deaths - 5) * 2, 25),
    });
  }

  if (combat.kda < 1.5 && combat.kills + combat.assists > 0) {
    insights.push({
      severity: 'warning',
      module: 'combat',
      title: 'Low Combat Efficiency',
      detail: `Match KDA of ${combat.kda}. Focus on taking higher-percentage engagements and playing with teammates, not alone.`,
      impact: Math.min((2.5 - combat.kda) * 10, 18),
    });
  }

  if (combat.damagePerMin >= 1200) {
    insights.push({
      severity: 'info',
      module: 'combat',
      title: 'High Damage Output',
      detail: `You dealt ${combat.damagePerMin} damage/min this match — excellent teamfight contribution.`,
      impact: 0,
    });
  }
}

function insightsFromBenchmarks(benchmarks, insights) {
  if (!benchmarks) return;

  if (benchmarks.kdaDiff <= -1 && benchmarks.benchmarkKda > 0) {
    insights.push({
      severity: benchmarks.kdaDiff <= -2 ? 'critical' : 'warning',
      module: 'benchmarks',
      title: 'Below Your Career Average',
      detail: `KDA of ${benchmarks.userKda} is ${Math.abs(benchmarks.kdaDiff)} below your career avg (${benchmarks.benchmarkKda}). Review this match's fights — something went wrong.`,
      impact: Math.min(Math.abs(benchmarks.kdaDiff) * 6, 18),
    });
  }

  if (benchmarks.kdaDiff >= 1 && benchmarks.benchmarkKda > 0) {
    insights.push({
      severity: 'info',
      module: 'benchmarks',
      title: 'Above Your Career Average',
      detail: `KDA of ${benchmarks.userKda} is ${benchmarks.kdaDiff.toFixed(1)} above your career avg. A personal standout game.`,
      impact: 0,
    });
  }
}

module.exports = { generateInsights };
