const { clamp, safeDivide } = require('../../utils/helpers');
const { getRankInfo } = require('../../utils/ranks');

/**
 * Dynamic Rank Benchmarks Analyzer.
 *
 * Produces expected performance bands (KDA, soulsPerMin, damagePerMin) tailored
 * to the player's predicted rank tier. Higher-rank players face stiffer
 * opposition, so the same raw numbers map to different percentile scores.
 *
 * Tier scaling (relative to tier 5 / "Archon" baseline):
 *   Obscurus (1) → 0.55 × baseline
 *   Initiate (2) → 0.65 ×
 *   Seeker   (3) → 0.75 ×
 *   Alchemist(4) → 0.88 ×
 *   Arcanist (5) → 1.00 × (baseline)
 *   Ritualist(6) → 1.12 ×
 *   Emissary (7) → 1.22 ×
 *   Archon   (8) → 1.32 ×
 *   Oracle   (9) → 1.42 ×
 *   Phantom  (10)→ 1.52 ×
 *   Ascendant(11)→ 1.62 ×
 *   Eternus  (12)→ 1.72 ×
 */

const BASELINE = {
  soulsPerMin: 550,
  kda: 3.0,
  damagePerMin: 900,
  objectiveDamage: 8000,
  winrate: 50,
};

const TIER_MULTIPLIER = {
  1: 0.55, 2: 0.65, 3: 0.75, 4: 0.88, 5: 1.0,
  6: 1.12, 7: 1.22, 8: 1.32, 9: 1.42, 10: 1.52, 11: 1.62, 12: 1.72,
};

function tierFromBadge(badge) {
  if (badge == null || typeof badge !== 'number') return null;
  return Math.floor(badge / 10);
}

function scaleBaselineForTier(tier) {
  const mult = TIER_MULTIPLIER[tier] ?? 1.0;
  return {
    soulsPerMin: Math.round(BASELINE.soulsPerMin * mult),
    kda: Number((BASELINE.kda * Math.sqrt(mult)).toFixed(2)),
    damagePerMin: Math.round(BASELINE.damagePerMin * mult),
    objectiveDamage: Math.round(BASELINE.objectiveDamage * mult),
  };
}

/**
 * Produce a percentile-style 0-100 score comparing an observed value to a
 * tier-adjusted expected value. 50 = at benchmark, >50 = above, <50 = below.
 */
function percentileScore(observed, expected) {
  if (!expected || expected <= 0) return null;
  const ratio = observed / expected;
  // log2 scale so 2x = ~85, 0.5x = ~15
  const score = 50 + 35 * Math.log2(clamp(ratio, 0.25, 4));
  return Math.round(clamp(score, 0, 100));
}

/**
 * @param {Object} params
 * @param {Object} params.combat      Combat module output (kills/deaths/assists, kda, damagePerMin)
 * @param {Object} params.itemization Itemization module output (soulsPerMin)
 * @param {Object} params.rankPredict Rank prediction summary (badge, tier, ...)
 * @param {Object} params.playerStats Granular stats (objectiveDamage)
 */
function analyzeRankBenchmarks({ combat = {}, itemization = {}, rankPredict, playerStats = {} }) {
  const badge = rankPredict?.badge ?? null;
  const tier = tierFromBadge(badge) ?? 5; // default to Arcanist
  const rankInfo = getRankInfo(badge);
  const expected = scaleBaselineForTier(tier);

  const observed = {
    soulsPerMin: combat.soulsPerMin || itemization.soulsPerMin || 0,
    kda: combat.kda || 0,
    damagePerMin: combat.damagePerMin || 0,
    objectiveDamage: playerStats.objectiveDamage || combat.objectiveDamage || 0,
  };

  const scores = {
    soulsPerMin: percentileScore(observed.soulsPerMin, expected.soulsPerMin),
    kda: percentileScore(observed.kda, expected.kda),
    damagePerMin: percentileScore(observed.damagePerMin, expected.damagePerMin),
    objectiveDamage: observed.objectiveDamage > 0
      ? percentileScore(observed.objectiveDamage, expected.objectiveDamage)
      : null,
  };

  // Overall tier-adjusted grade (simple mean of available signals)
  const available = Object.values(scores).filter((v) => typeof v === 'number');
  const score = available.length
    ? Math.round(available.reduce((a, b) => a + b, 0) / available.length)
    : 50;

  // Comparison rows: what would a median player at this tier hit?
  const comparisons = [
    {
      metric: 'Souls / Min',
      observed: Math.round(observed.soulsPerMin),
      expected: expected.soulsPerMin,
      delta: Math.round(observed.soulsPerMin - expected.soulsPerMin),
      score: scores.soulsPerMin,
    },
    {
      metric: 'KDA',
      observed: Number(observed.kda.toFixed(2)),
      expected: expected.kda,
      delta: Number((observed.kda - expected.kda).toFixed(2)),
      score: scores.kda,
    },
    {
      metric: 'Damage / Min',
      observed: Math.round(observed.damagePerMin),
      expected: expected.damagePerMin,
      delta: Math.round(observed.damagePerMin - expected.damagePerMin),
      score: scores.damagePerMin,
    },
  ];
  if (scores.objectiveDamage != null) {
    comparisons.push({
      metric: 'Objective Damage',
      observed: Math.round(observed.objectiveDamage),
      expected: expected.objectiveDamage,
      delta: Math.round(observed.objectiveDamage - expected.objectiveDamage),
      score: scores.objectiveDamage,
    });
  }

  return {
    score,
    tier,
    tierName: rankInfo.name,
    tierImageUrl: rankInfo.imageUrl,
    badge,
    expected,
    observed: {
      soulsPerMin: Math.round(observed.soulsPerMin),
      kda: Number(observed.kda.toFixed(2)),
      damagePerMin: Math.round(observed.damagePerMin),
      objectiveDamage: Math.round(observed.objectiveDamage),
    },
    comparisons,
    summary:
      score >= 65
        ? `You performed ABOVE the typical ${rankInfo.name} player this match.`
        : score >= 45
        ? `You performed in line with a typical ${rankInfo.name} player this match.`
        : `You performed BELOW a typical ${rankInfo.name} player this match.`,
  };
}

module.exports = { analyzeRankBenchmarks, scaleBaselineForTier, TIER_MULTIPLIER };
