const { PHASES, FLOATING_SOULS_THRESHOLD, NEUTRAL_BASELINES } = require('../utils/constants');
const { safeDivide, formatTime, idsMatch } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Economy & Farming Analyzer (Module 2.1)
 *
 * Produces:
 *   - spmTimeline       : Array of { timeSeconds, spm } data-points for charting
 *   - totalSouls        : Total souls earned
 *   - averageSpm        : Overall average SPM
 *   - laningDenyRate    : Soul deny rate during laning phase
 *   - neutralEfficiency : Camp clears vs. role baseline
 *   - stagnationWindows : Time-ranges where SPM dropped below threshold
 *   - score             : 0–100 module score
 */
function analyzeEconomy(parsedData, playerSteamId, heroRole = 'flex') {
  logger.debug(`Running economy analysis for ${playerSteamId}`);

  const { playerTicks, neutralLog, matchMeta } = parsedData;
  const duration = matchMeta.durationSeconds || 1;

  // ---- SPM Timeline ----
  const spmTimeline = buildSpmTimeline(playerTicks, playerSteamId, duration);
  const totalSouls = spmTimeline.length
    ? spmTimeline[spmTimeline.length - 1].cumulativeSouls || 0
    : 0;
  const averageSpm = safeDivide(totalSouls, duration / 60);

  // ---- Stagnation Windows (SPM < 60% of average for >60 s) ----
  const stagnationThreshold = averageSpm * 0.6;
  const stagnationWindows = detectStagnation(spmTimeline, stagnationThreshold);

  // ---- Laning Deny Rate ----
  const laningDenyRate = computeDenyRate(parsedData, playerSteamId);

  // ---- Neutral Camp Efficiency ----
  const neutralEfficiency = computeNeutralEfficiency(neutralLog, playerSteamId, heroRole, duration);

  // ---- Scoring ----
  const score = computeEconomyScore({
    averageSpm,
    stagnationWindows,
    laningDenyRate,
    neutralEfficiency,
    duration,
  });

  return {
    spmTimeline,
    totalSouls,
    averageSpm: Math.round(averageSpm),
    laningDenyRate: Math.round(laningDenyRate * 100) / 100,
    neutralEfficiency,
    stagnationWindows,
    score,
  };
}

/**
 * Build a per-minute SPM timeline from player tick data.
 */
function buildSpmTimeline(playerTicks, steamId, duration) {
  const bucketSizeSeconds = 60;
  const buckets = Math.ceil(duration / bucketSizeSeconds);
  const timeline = [];

  // In real implementation, accumulate souls from tick data.
  // With scaffold data, produce empty timeline.
  if (!playerTicks || playerTicks.length === 0) {
    for (let i = 0; i < buckets; i++) {
      timeline.push({
        timeSeconds: i * bucketSizeSeconds,
        minute: i,
        spm: 0,
        cumulativeSouls: 0,
        deadSeconds: 0,
      });
    }
    return timeline;
  }

  const playerData = playerTicks.filter((t) => idsMatch(t.steamId, steamId));
  let lastSouls = 0;

  for (let i = 0; i < buckets; i++) {
    const bucketEnd = (i + 1) * bucketSizeSeconds;
    const ticksInBucket = playerData.filter(
      (t) => t.timeSeconds > i * bucketSizeSeconds && t.timeSeconds <= bucketEnd
    );

    const currentSouls = ticksInBucket.length
      ? ticksInBucket[ticksInBucket.length - 1].souls || lastSouls
      : lastSouls;

    const earned = currentSouls - lastSouls;
    lastSouls = currentSouls;

    // Calculate how many ticks the player was dead in this bucket.
    const deadTicks = ticksInBucket.filter(t => t.isAlive === false).length;
    let deadSeconds = 0;
    if (ticksInBucket.length > 0) {
      deadSeconds = (deadTicks / ticksInBucket.length) * bucketSizeSeconds;
    }

    timeline.push({
      timeSeconds: i * bucketSizeSeconds,
      minute: i,
      spm: earned,
      cumulativeSouls: currentSouls,
      deadSeconds,
    });
  }

  // If the last bucket represents less than 30 seconds of gameplay, its SPM calculation
  // will be artificially skewed. Drop it to keep the timeline clean.
  if (duration % bucketSizeSeconds > 0 && duration % bucketSizeSeconds < 30) {
    timeline.pop();
  }

  return timeline;
}

/**
 * Detect windows where SPM drops below a threshold for extended periods.
 */
function detectStagnation(timeline, threshold) {
  const windows = [];
  let windowStart = null;

  for (const point of timeline) {
    // If the player was dead for a significant portion of this minute (>20s),
    // it's a death penalty, not a farming stagnation.
    const isEffectivelyDead = point.deadSeconds > 20;

    if (point.spm < threshold && !isEffectivelyDead) {
      if (windowStart === null) windowStart = point.timeSeconds;
    } else {
      if (windowStart !== null) {
        const duration = point.timeSeconds - windowStart;
        if (duration >= 60) {
          windows.push({
            startSeconds: windowStart,
            endSeconds: point.timeSeconds,
            startFormatted: formatTime(windowStart),
            endFormatted: formatTime(point.timeSeconds),
            durationSeconds: duration,
          });
        }
        windowStart = null;
      }
    }
  }

  return windows;
}

/**
 * Compute soul deny rate during laning phase.
 * deny_rate = (souls_denied / total_contested_souls) * 100
 */
function computeDenyRate(parsedData, playerSteamId) {
  // Requires contested-soul events from the demo.
  // Stubbed at 0 until parser provides deny events.
  return 0;
}

/**
 * Compare neutral camp clears against role-specific baselines.
 */
function computeNeutralEfficiency(neutralLog, steamId, role, durationSeconds) {
  const baseline = NEUTRAL_BASELINES[role] || NEUTRAL_BASELINES.flex;
  const periodsPer10Min = durationSeconds / 600;

  const playerClears = (neutralLog || []).filter((e) => idsMatch(e.steamId, steamId));

  const tier1 = playerClears.filter((e) => e.tier === 1).length;
  const tier2 = playerClears.filter((e) => e.tier === 2).length;
  const tier3 = playerClears.filter((e) => e.tier === 3).length;

  const expectedTier1 = Math.round(baseline.tier1 * periodsPer10Min);
  const expectedTier2 = Math.round(baseline.tier2 * periodsPer10Min);
  const expectedTier3 = Math.round(baseline.tier3 * periodsPer10Min);

  return {
    tier1: { actual: tier1, expected: expectedTier1, ratio: safeDivide(tier1, expectedTier1) },
    tier2: { actual: tier2, expected: expectedTier2, ratio: safeDivide(tier2, expectedTier2) },
    tier3: { actual: tier3, expected: expectedTier3, ratio: safeDivide(tier3, expectedTier3) },
  };
}

/**
 * Compute 0–100 score for the economy module.
 */
function computeEconomyScore({ averageSpm, stagnationWindows, laningDenyRate, neutralEfficiency, duration }) {
  let score = 50; // baseline

  // SPM contribution (up to +25)
  // Approximate expected SPM is ~80–120 for a carry, scaled by game time
  const spmRatio = Math.min(averageSpm / 100, 1.5);
  score += spmRatio * 20;

  // Stagnation penalty (up to -20)
  const totalStagnation = stagnationWindows.reduce((sum, w) => sum + w.durationSeconds, 0);
  const stagnationRatio = Math.min(totalStagnation / duration, 1);
  score -= stagnationRatio * 20;

  // Neutral camp bonus (up to +15)
  const avgNeutralRatio =
    ((neutralEfficiency.tier1?.ratio || 0) +
      (neutralEfficiency.tier2?.ratio || 0) +
      (neutralEfficiency.tier3?.ratio || 0)) / 3;
  score += Math.min(avgNeutralRatio, 1) * 15;

  // Deny rate bonus (up to +10)
  score += Math.min(laningDenyRate / 50, 1) * 10;

  return Math.round(Math.max(0, Math.min(100, score)));
}

module.exports = { analyzeEconomy };
