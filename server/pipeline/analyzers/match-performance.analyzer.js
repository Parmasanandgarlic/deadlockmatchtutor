const { ROLE_BENCHMARKS } = require('../../data/hero-roles');
const { safeDivide, clamp } = require('../../utils/helpers');

/**
 * Perform a context-aware analysis of player performance.
 * @param {Object} data - Raw match data from API
 * @param {import('../types').AnalysisContext} context - Metadata about hero role and benchmarks
 */
function analyzeMatchPerformance(data, context) {
  const { benchmarks, matchDuration } = context;
  const granular = data.playerStats || {};
  const history = data.matchInHistory || {};
  const heroStats = data.normalizedHeroStats || {};

  // Merge: prefer granular match-metadata values, but fall back to the
  // summary match-history payload whenever a field is missing. This keeps
  // the dashboard populated even when the /v1/matches/{id}/metadata
  // endpoint returns an empty object (a common 500 response upstream).
  const pickNumber = (...values) => {
    for (const v of values) {
      if (v == null) continue;
      const n = Number(v);
      if (!Number.isNaN(n)) return n;
    }
    return 0;
  };

  const kills = pickNumber(granular.kills, history.player_kills, history.kills);
  const deaths = pickNumber(granular.deaths, history.player_deaths, history.deaths);
  const assists = pickNumber(granular.assists, history.player_assists, history.assists);
  const netWorth = pickNumber(granular.netWorth, granular.souls, history.net_worth, history.netWorth);
  const damageDealt = pickNumber(granular.damageDealt, history.player_damage, history.damage);
  const objectiveDamage = pickNumber(granular.objectiveDamage, history.objective_damage);

  const stats = {
    ...granular,
    kills,
    deaths,
    assists,
    netWorth,
    damageDealt,
    objectiveDamage,
  };

  // 1. Economy Scoring (SPM)
  const durationMins = matchDuration / 60;
  const spm = safeDivide(netWorth, durationMins);

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
    kills: stats.kills || 0,
    deaths: stats.deaths || 0,
    assists: stats.assists || 0,
    matchKda: roundKda(stats.kills || 0, stats.deaths || 0, stats.assists || 0),
    soulsPerMin: Math.round(spm),
    damagePerMin: Math.round(safeDivide(stats.damageDealt || 0, durationMins)),
    objectiveDamage: stats.objectiveDamage || 0,
    positioningScore: stats.positioningScore ?? null,
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

function roundKda(kills, deaths, assists) {
  const value = deaths > 0 ? (kills + assists) / deaths : kills + assists;
  return Math.round(value * 100) / 100;
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
