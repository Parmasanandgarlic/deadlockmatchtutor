const { MODULE_WEIGHTS, GRADE_THRESHOLDS } = require('../utils/constants');
const { clamp } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Scoring Engine
 *
 * Combines the four module scores into a single weighted Impact Score (0–100)
 * and maps it to a letter grade (A+ through F).
 */

/**
 * Compute the overall impact score from module scores.
 *
 * @param {Object} moduleScores  { economy, itemization, combat, objectives } — each 0–100
 * @returns {Object} { impactScore, letterGrade, breakdown }
 */
function computeOverallScore(moduleScores) {
  const economy = clamp(moduleScores.economy ?? 0, 0, 100);
  const itemization = clamp(moduleScores.itemization ?? 0, 0, 100);
  const combat = clamp(moduleScores.combat ?? 0, 0, 100);
  const objectives = clamp(moduleScores.objectives ?? 0, 0, 100);

  const impactScore = Math.round(
    economy * MODULE_WEIGHTS.economy +
    itemization * MODULE_WEIGHTS.itemization +
    combat * MODULE_WEIGHTS.combat +
    objectives * MODULE_WEIGHTS.objectives
  );

  const letterGrade = scoreToGrade(impactScore);

  const breakdown = {
    economy: { score: economy, weight: MODULE_WEIGHTS.economy, weighted: Math.round(economy * MODULE_WEIGHTS.economy) },
    itemization: { score: itemization, weight: MODULE_WEIGHTS.itemization, weighted: Math.round(itemization * MODULE_WEIGHTS.itemization) },
    combat: { score: combat, weight: MODULE_WEIGHTS.combat, weighted: Math.round(combat * MODULE_WEIGHTS.combat) },
    objectives: { score: objectives, weight: MODULE_WEIGHTS.objectives, weighted: Math.round(objectives * MODULE_WEIGHTS.objectives) },
  };

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
