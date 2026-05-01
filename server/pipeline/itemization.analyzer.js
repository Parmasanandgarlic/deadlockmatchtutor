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
    .filter((e) => matchesSteamId(e, steamId))
    .sort((a, b) => getItemTimeSeconds(a) - getItemTimeSeconds(b));

  let first3k = null;
  let first6k = null;

  for (const item of playerItems) {
    const itemCost = getItemCost(item);
    const itemId = getItemId(item);
    const itemTimeSeconds = getItemTimeSeconds(item);

    if (!first3k && itemCost >= ITEM_COST_TIERS.HIGH) {
      first3k = {
        item: itemId,
        cost: itemCost,
        timeSeconds: itemTimeSeconds,
        timeFormatted: formatTime(itemTimeSeconds),
      };
    }
    if (!first6k && itemCost >= ITEM_COST_TIERS.ULTRA) {
      first6k = {
        item: itemId,
        cost: itemCost,
        timeSeconds: itemTimeSeconds,
        timeFormatted: formatTime(itemTimeSeconds),
      };
    }
    if (first3k && first6k) break;
  }

  return {
    first3k,
    first6k,
    allPurchases: playerItems.map((i) => ({
      item: getItemId(i),
      cost: getItemCost(i),
      timeSeconds: getItemTimeSeconds(i),
      timeFormatted: formatTime(getItemTimeSeconds(i)),
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

function matchesSteamId(entry, steamId) {
  const entrySteamId = entry?.steamId ?? entry?.steam_id ?? entry?.account_id ?? entry?.accountId;
  return entrySteamId != null && String(entrySteamId) === String(steamId);
}

function getItemId(entry) {
  return entry?.item ?? entry?.item_id ?? entry?.itemId ?? entry?.id ?? null;
}

function getItemCost(entry) {
  return entry?.cost ?? entry?.item_cost ?? entry?.price ?? 0;
}

function getItemTimeSeconds(entry) {
  return entry?.timeSeconds ?? entry?.time_seconds ?? entry?.timestampSeconds ?? entry?.time ?? 0;
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
  // 3k Item: Elite <= 8 min (480s), Baseline = 12 min (720s)
  if (coreItemTimings.first3k) {
    const time = coreItemTimings.first3k.timeSeconds;
    const timingRatio = Math.max(0, Math.min(1, (720 - time) / (720 - 480)));
    score += timingRatio * 10;
  }
  
  // 6k Item: Elite <= 16 min (960s), Baseline = 22 min (1320s)
  if (coreItemTimings.first6k) {
    const time = coreItemTimings.first6k.timeSeconds;
    const timingRatio = Math.max(0, Math.min(1, (1320 - time) / (1320 - 960)));
    score += timingRatio * 10;
  }

  // Active item usage bonus (up to +15)
  score += Math.min(activeItemUsage.overallEfficiency, 1) * 15;

  return Math.round(Math.max(0, Math.min(100, score)));
}

module.exports = { analyzeItemization };
