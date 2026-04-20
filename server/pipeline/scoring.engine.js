const { MODULE_WEIGHTS, GRADE_THRESHOLDS } = require('../utils/constants');
const { clamp } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Scoring Engine (API-based)
 *
 * Combines the four module scores into a single weighted Impact Score (0–100)
 * and maps it to a letter grade (A+ through F).
 */

/**
 * Compute the overall impact score from module scores.
 *
 * @param {Object} moduleScores  { heroPerformance, itemization, combat, benchmarks } — each 0–100
 * @returns {Object} { impactScore, letterGrade, breakdown }
 */
function computeOverallScore(moduleScores) {
  const heroPerformance = clamp(moduleScores.heroPerformance ?? 0, 0, 100);
  const itemization = clamp(moduleScores.itemization ?? 0, 0, 100);
  const combat = clamp(moduleScores.combat ?? 0, 0, 100);
  const benchmarks = clamp(moduleScores.benchmarks ?? 0, 0, 100);
  const hasDecisionQuality = typeof moduleScores.decisionQuality === 'number';
  const decisionQuality = clamp(moduleScores.decisionQuality ?? 0, 0, 100);

  // Updated weights — when decision quality is present, it is the single
  // strongest signal because it synthesizes the others.
  const weights = hasDecisionQuality
    ? { heroPerformance: 0.22, itemization: 0.20, combat: 0.22, benchmarks: 0.16, decisionQuality: 0.20 }
    : { heroPerformance: 0.30, itemization: 0.25, combat: 0.25, benchmarks: 0.20 };

  let impactScore = Math.round(
    heroPerformance * weights.heroPerformance +
    itemization * weights.itemization +
    combat * weights.combat +
    benchmarks * weights.benchmarks +
    (hasDecisionQuality ? decisionQuality * weights.decisionQuality : 0)
  );

  const letterGrade = scoreToGrade(impactScore);

  const breakdown = {
    heroPerformance: { score: heroPerformance, weight: weights.heroPerformance, weighted: Math.round(heroPerformance * weights.heroPerformance) },
    itemization: { score: itemization, weight: weights.itemization, weighted: Math.round(itemization * weights.itemization) },
    combat: { score: combat, weight: weights.combat, weighted: Math.round(combat * weights.combat) },
    benchmarks: { score: benchmarks, weight: weights.benchmarks, weighted: Math.round(benchmarks * weights.benchmarks) },
  };
  if (hasDecisionQuality) {
    breakdown.decisionQuality = {
      score: decisionQuality,
      weight: weights.decisionQuality,
      weighted: Math.round(decisionQuality * weights.decisionQuality),
    };
  }

  logger.info(`Impact Score: ${impactScore} (${letterGrade})`);

  return {
    impactScore,
    letterGrade,
    breakdown,
  };
}

/**
 * Map a numeric score to a letter grade.
 */
function scoreToGrade(score) {
  for (const threshold of GRADE_THRESHOLDS) {
    if (score >= threshold.min) return threshold.grade;
  }
  return 'F';
}

module.exports = { computeOverallScore, scoreToGrade };
