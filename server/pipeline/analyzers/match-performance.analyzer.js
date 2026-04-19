const { ROLE_BENCHMARKS } = require('../../data/hero-roles');
const { safeDivide, clamp } = require('../../utils/helpers');

/**
 * Perform a context-aware analysis of player performance.
 * @param {Object} data - Raw match data from API
 * @param {import('../types').AnalysisContext} context - Metadata about hero role and benchmarks
 */
function analyzeMatchPerformance(data, context) {
  const { benchmarks, matchDuration } = context;
  const stats = data.playerStats || {};
  const heroStats = data.normalizedHeroStats || {};
  
  // 1. Economy Scoring (SPM)
  const durationMins = matchDuration / 60;
  const spm = safeDivide(stats.netWorth || 0, durationMins);
  
  let spmScore = 0;
  if (spm >= benchmarks.soulsPerMin.excellent) spmScore = 100;
  else if (spm >= benchmarks.soulsPerMin.average) {
    // Linear scale between average and excellent
    const range = benchmarks.soulsPerMin.excellent - benchmarks.soulsPerMin.average;
    spmScore = 70 + ((spm - benchmarks.soulsPerMin.average) / range) * 30;
  } else if (spm >= benchmarks.soulsPerMin.poor) {
    const range = benchmarks.soulsPerMin.average - benchmarks.soulsPerMin.poor;
    spmScore = 40 + ((spm - benchmarks.soulsPerMin.poor) / range) * 30;
  } else {
    spmScore = (spm / benchmarks.soulsPerMin.poor) * 40;
  }

  // 2. Combat Scoring (KDA Weighting)
  const { kills = 0, deaths = 0, assists = 0 } = stats;
  // Weighted KDA components based on role
  const killPoints = kills * benchmarks.kdaWeight.kills * 10;
  const assistPoints = assists * benchmarks.kdaWeight.assists * 10;
  const deathPenalty = deaths * Math.abs(benchmarks.kdaWeight.deaths) * 10;
  
  // Base combat score
  let combatScore = clamp(50 + killPoints + assistPoints - deathPenalty, 0, 100);

  // 3. Objective Impact
  // Scale objective damage by benchmarks.objectiveWeight
  const objDmg = stats.objectiveDamage || 0;
  const objTarget = context.isRanked ? 5000 : 3000; // Example target
  const rawObjScore = (objDmg / objTarget) * 100;
  const objectiveScore = clamp(rawObjScore * benchmarks.objectiveWeight, 0, 100);

  // 4. Final Aggregation
  // Weightings for final grade: Economy (40%), Combat (40%), Objectives (20%)
  const finalScore = (spmScore * 0.4) + (combatScore * 0.4) + (objectiveScore * 0.2);
  const grade = calculateGrade(finalScore);

  return {
    score: Math.round(finalScore),
    grade,
    metrics: {
      spm: Math.round(spm),
      spmScore: Math.round(spmScore),
      combatScore: Math.round(combatScore),
      objectiveScore: Math.round(objectiveScore)
    },
    winrate: Math.round((heroStats.winrate || 0) * 10) / 10,
    avgKda: Math.round((heroStats.avgKda || 0) * 100) / 100,
    matchesPlayed: heroStats.matchesPlayed || 0,
    avgSouls: Math.round(heroStats.avgSouls || 0),
    roleContext: {
      role: context.heroRole.role,
      subRole: context.heroRole.sub_role,
      dominantStat: context.heroRole.role === 'support' ? 'Assists' : 'Souls'
    }
  };
}

function calculateGrade(score) {
  if (score >= 97) return 'A+';
  if (score >= 93) return 'A';
  if (score >= 90) return 'A-';
  if (score >= 87) return 'B+';
  if (score >= 83) return 'B';
  if (score >= 80) return 'B-';
  if (score >= 77) return 'C+';
  if (score >= 73) return 'C';
  if (score >= 70) return 'C-';
  if (score >= 60) return 'D';
  return 'F';
}

module.exports = { analyzeMatchPerformance };
