const { OBJECTIVES, MID_BOSS_PROXIMITY_RADIUS } = require('../utils/constants');
const { safeDivide, formatTime, distance3D } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Map Control & Objectives Analyzer (Module 2.4)
 *
 * Produces:
 *   - objectiveDamageShare : % of team objective damage dealt by the player
 *   - midBossPresence      : Was the player near Mid Boss when it was taken/contested?
 *   - objectiveTimeline    : Chronological list of objective events
 *   - score                : 0–100 module score
 */
function analyzeObjectives(parsedData, playerSteamId) {
  logger.debug(`Running objectives analysis for ${playerSteamId}`);

  const { objectiveLog, playerTicks, matchMeta } = parsedData;

  // ---- Objective Damage Share ----
  const objectiveDamageShare = computeObjectiveDamageShare(objectiveLog, playerSteamId);

  // ---- Mid Boss Presence ----
  const midBossPresence = checkMidBossPresence(objectiveLog, playerTicks, playerSteamId);

  // ---- Objective Timeline ----
  const objectiveTimeline = buildObjectiveTimeline(objectiveLog);

  // ---- Scoring ----
  const score = computeObjectivesScore({
    objectiveDamageShare,
    midBossPresence,
  });

  return {
    objectiveDamageShare,
    midBossPresence,
    objectiveTimeline,
    score,
  };
}

/**
 * Calculate the player's share of total team damage to objectives.
 */
function computeObjectiveDamageShare(objectiveLog, steamId) {
  if (!objectiveLog || objectiveLog.length === 0) {
    return {
      playerDamage: 0,
      teamDamage: 0,
      sharePercent: 0,
      byObjective: {},
    };
  }

  let playerDamage = 0;
  let teamDamage = 0;
  const byObjective = {};

  for (const event of objectiveLog) {
    const objType = event.objectiveType || 'unknown';
    if (!byObjective[objType]) {
      byObjective[objType] = { player: 0, team: 0 };
    }

    teamDamage += event.damage || 0;
    byObjective[objType].team += event.damage || 0;

    if (event.steamId === steamId || event.attacker === steamId) {
      playerDamage += event.damage || 0;
      byObjective[objType].player += event.damage || 0;
    }
  }

  // Calculate per-objective share
  for (const key of Object.keys(byObjective)) {
    byObjective[key].sharePercent = Math.round(
      safeDivide(byObjective[key].player, byObjective[key].team) * 100
    );
  }

  return {
    playerDamage,
    teamDamage,
    sharePercent: Math.round(safeDivide(playerDamage, teamDamage) * 100),
    byObjective,
  };
}

/**
 * Check if the player was within MID_BOSS_PROXIMITY_RADIUS when Mid Boss was taken.
 */
function checkMidBossPresence(objectiveLog, playerTicks, steamId) {
  const midBossEvents = (objectiveLog || []).filter(
    (e) => e.objectiveType === OBJECTIVES.MID_BOSS && e.isSecured
  );

  if (midBossEvents.length === 0) {
    return { events: [], wasPresent: false };
  }

  const playerData = (playerTicks || []).filter((t) => t.steamId === steamId);

  const events = midBossEvents.map((mb) => {
    // Find the player's position at the time of the mid boss event
    const closestTick = playerData.reduce((best, tick) => {
      if (!best) return tick;
      return Math.abs(tick.timeSeconds - mb.timeSeconds) <
        Math.abs(best.timeSeconds - mb.timeSeconds)
        ? tick
        : best;
    }, null);

    const wasPresent =
      closestTick && mb.position
        ? distance3D(closestTick.position, mb.position) <= MID_BOSS_PROXIMITY_RADIUS
        : false;

    return {
      timeSeconds: mb.timeSeconds,
      timeFormatted: formatTime(mb.timeSeconds),
      securedByTeam: mb.team || 'unknown',
      wasPresent,
    };
  });

  return {
    events,
    wasPresent: events.some((e) => e.wasPresent),
    presenceRate: safeDivide(
      events.filter((e) => e.wasPresent).length,
      events.length
    ),
  };
}

/**
 * Build a chronological timeline of all objective events.
 */
function buildObjectiveTimeline(objectiveLog) {
  if (!objectiveLog || objectiveLog.length === 0) return [];

  return [...objectiveLog]
    .sort((a, b) => a.timeSeconds - b.timeSeconds)
    .map((e) => ({
      timeSeconds: e.timeSeconds,
      timeFormatted: formatTime(e.timeSeconds),
      objectiveType: e.objectiveType,
      destroyed: !!e.isDestroyed,
      team: e.team || 'unknown',
    }));
}

/**
 * Compute 0–100 objectives score.
 */
function computeObjectivesScore({ objectiveDamageShare, midBossPresence }) {
  let score = 50;

  // Objective damage share bonus (up to +30)
  // 20% share = full marks for a 6-player team contribution
  const shareRatio = Math.min(objectiveDamageShare.sharePercent / 20, 1.5);
  score += shareRatio * 20;

  // Mid Boss presence bonus (up to +20)
  if (midBossPresence.events && midBossPresence.events.length > 0) {
    score += (midBossPresence.presenceRate || 0) * 20;
  } else {
    // No mid boss events — neutral (no bonus, no penalty)
    score += 10;
  }

  return Math.round(Math.max(0, Math.min(100, score)));
}

module.exports = { analyzeObjectives };
