const { FLOATING_SOULS_THRESHOLD, ITEM_COST_TIERS, PHASES } = require('../utils/constants');
const { safeDivide, formatTime } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Itemization & Power Spikes Analyzer (Module 2.2)
 *
 * Produces:
 *   - floatingSoulsEvents : Periods where unspent souls > threshold outside base
 *   - coreItemTimings     : Timestamps for first 3k and 6k item purchases
 *   - activeItemUsage     : Cast count vs. off-cooldown count during teamfights
 *   - score               : 0–100 module score
 */
function analyzeItemization(parsedData, playerSteamId) {
  logger.debug(`Running itemization analysis for ${playerSteamId}`);

  const { itemLog, playerTicks, matchMeta } = parsedData;
  const duration = matchMeta.durationSeconds || 1;

  // ---- Floating Souls ----
  const floatingSoulsEvents = detectFloatingSouls(playerTicks, itemLog, playerSteamId);

  // ---- Core Item Timings ----
  const coreItemTimings = extractCoreItemTimings(itemLog, playerSteamId);

  // ---- Active Item Usage ----
  const activeItemUsage = analyzeActiveItemUsage(parsedData, playerSteamId);

  // ---- Scoring ----
  const score = computeItemizationScore({
    floatingSoulsEvents,
    coreItemTimings,
    activeItemUsage,
    duration,
  });

  return {
    floatingSoulsEvents,
    coreItemTimings,
    activeItemUsage,
    score,
  };
}

/**
 * Detect periods where the player held more than FLOATING_SOULS_THRESHOLD
 * unspent souls while outside the base.
 */
function detectFloatingSouls(playerTicks, itemLog, steamId) {
  const events = [];

  // Requires per-tick "current_souls" field from the parser.
  // Stubbed until real data is available.
  // Logic outline:
  //   1. Walk through player ticks sorted by time.
  //   2. Maintain running unspent souls by tracking purchases.
  //   3. When unspent > threshold AND player is not near base, start a window.
  //   4. When unspent drops below threshold or player enters base, close window.

  if (!playerTicks || playerTicks.length === 0) return events;

  let windowStart = null;
  let peakSouls = 0;

  // Placeholder: no-op with scaffold data
  // Real implementation iterates tick-by-tick tracking net_worth - spent_on_items

  return events;
}

/**
 * Extract the timestamps for the first 3k-tier and 6k-tier item purchases.
 */
function extractCoreItemTimings(itemLog, steamId) {
  const playerItems = (itemLog || [])
    .filter((e) => e.steamId === steamId)
    .sort((a, b) => a.timeSeconds - b.timeSeconds);

  let first3k = null;
  let first6k = null;

  for (const item of playerItems) {
    if (!first3k && item.cost >= ITEM_COST_TIERS.HIGH) {
      first3k = {
        item: item.item,
        cost: item.cost,
        timeSeconds: item.timeSeconds,
        timeFormatted: formatTime(item.timeSeconds),
      };
    }
    if (!first6k && item.cost >= ITEM_COST_TIERS.ULTRA) {
      first6k = {
        item: item.item,
        cost: item.cost,
        timeSeconds: item.timeSeconds,
        timeFormatted: formatTime(item.timeSeconds),
      };
    }
    if (first3k && first6k) break;
  }

  return {
    first3k,
    first6k,
    allPurchases: playerItems.map((i) => ({
      item: i.item,
      cost: i.cost,
      timeSeconds: i.timeSeconds,
      timeFormatted: formatTime(i.timeSeconds),
    })),
  };
}

/**
 * Analyze active item usage: casts vs. off-cooldown during teamfights.
 */
function analyzeActiveItemUsage(parsedData, steamId) {
  // Requires ability-cast events correlated with item cooldowns.
  // Stubbed until parser provides ability_log with item activations.
  return {
    items: [],
    overallEfficiency: 0,
  };
}

/**
 * Compute 0–100 itemization score.
 */
function computeItemizationScore({ floatingSoulsEvents, coreItemTimings, activeItemUsage, duration }) {
  let score = 60; // baseline

  // Floating souls penalty (up to -25)
  const totalFloatSeconds = floatingSoulsEvents.reduce(
    (sum, e) => sum + (e.durationSeconds || 0),
    0
  );
  const floatRatio = Math.min(totalFloatSeconds / duration, 1);
  score -= floatRatio * 25;

  // Core item timing bonus (up to +20)
  // Faster is better: if first 3k item is before 8 min, full bonus
  if (coreItemTimings.first3k) {
    const timingRatio = Math.max(0, 1 - coreItemTimings.first3k.timeSeconds / 480);
    score += timingRatio * 10;
  }
  if (coreItemTimings.first6k) {
    const timingRatio = Math.max(0, 1 - coreItemTimings.first6k.timeSeconds / 960);
    score += timingRatio * 10;
  }

  // Active item usage bonus (up to +15)
  score += Math.min(activeItemUsage.overallEfficiency, 1) * 15;

  return Math.round(Math.max(0, Math.min(100, score)));
}

module.exports = { analyzeItemization };
