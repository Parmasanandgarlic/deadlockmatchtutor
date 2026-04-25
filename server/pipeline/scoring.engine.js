const { MODULE_WEIGHTS, GRADE_THRESHOLDS } = require('../utils/constants');
const { clamp } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Scoring Engine (API-based)
 *
 * Combines the module scores into a single weighted Impact Score (0–100)
 * and maps it to a letter grade (A+ through F).
 *
 * Weights are now ROLE-AWARE: a support gets graded on participation and
 * utility; a carry gets graded on economy and fight output.
 */

/**
 * Role-specific weight distributions.
 *
 * Design rationale:
 *   - Carry: economy + itemization matter most (you ARE the net worth)
 *   - Support: combat participation + benchmarks matter (assists, healing, obj)
 *   - Tank: combat scoring leans on damage taken ratio (positioning)
 *   - Brawler: balanced, slight combat bias
 *
 * Each set must sum to 1.0 (with and without decisionQuality).
 */
const ROLE_WEIGHTS = {
  carry: {
    withDQ:    { heroPerformance: 0.20, itemization: 0.25, combat: 0.18, benchmarks: 0.17, decisionQuality: 0.20 },
    withoutDQ: { heroPerformance: 0.28, itemization: 0.30, combat: 0.22, benchmarks: 0.20 },
  },
  support: {
    withDQ:    { heroPerformance: 0.24, itemization: 0.15, combat: 0.24, benchmarks: 0.17, decisionQuality: 0.20 },
    withoutDQ: { heroPerformance: 0.30, itemization: 0.18, combat: 0.30, benchmarks: 0.22 },
  },
  tank: {
    withDQ:    { heroPerformance: 0.22, itemization: 0.18, combat: 0.25, benchmarks: 0.15, decisionQuality: 0.20 },
    withoutDQ: { heroPerformance: 0.28, itemization: 0.22, combat: 0.28, benchmarks: 0.22 },
  },
  brawler: {
    withDQ:    { heroPerformance: 0.22, itemization: 0.20, combat: 0.22, benchmarks: 0.16, decisionQuality: 0.20 },
    withoutDQ: { heroPerformance: 0.30, itemization: 0.25, combat: 0.25, benchmarks: 0.20 },
  },
};

function getWeightsForRole(role, hasDecisionQuality) {
  const roleConfig = ROLE_WEIGHTS[role] || ROLE_WEIGHTS.brawler;
  return hasDecisionQuality ? roleConfig.withDQ : roleConfig.withoutDQ;
}

/**
 * Compute the overall impact score from module scores.
 *
 * @param {Object} moduleScores  { heroPerformance, itemization, combat, benchmarks, decisionQuality } — each 0–100
 * @param {string} [role]        Hero role for weight calibration (carry/support/tank/brawler)
 * @returns {Object} { impactScore, letterGrade, breakdown }
 */
function computeOverallScore(moduleScores, role) {
  const heroPerformance = clamp(moduleScores.heroPerformance ?? 0, 0, 100);
  const itemization = clamp(moduleScores.itemization ?? 0, 0, 100);
  const combat = clamp(moduleScores.combat ?? 0, 0, 100);
  const benchmarks = clamp(moduleScores.benchmarks ?? 0, 0, 100);
  const hasDecisionQuality = typeof moduleScores.decisionQuality === 'number';
  const decisionQuality = clamp(moduleScores.decisionQuality ?? 0, 0, 100);

  const weights = getWeightsForRole(role || 'brawler', hasDecisionQuality);

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

  logger.info(`Impact Score: ${impactScore} (${letterGrade}) [role: ${role || 'brawler'}]`);

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

module.exports = { computeOverallScore, scoreToGrade, getWeightsForRole };

