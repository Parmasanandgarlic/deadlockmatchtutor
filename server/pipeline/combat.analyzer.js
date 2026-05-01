const { TEAMFIGHT, PHASES } = require('../utils/constants');
const { safeDivide, formatTime, clusterEvents, distance3D, idsMatch } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Combat & Engagement Analyzer (Module 2.3)
 *
 * Produces:
 *   - teamfightParticipation : % of team kills/assists the player contributed to
 *   - teamfights             : Detected teamfight clusters with player involvement
 *   - damageTakenBreakdown   : Pre-fight poke vs. in-fight damage
 *   - deadTimePenalty        : Total death time + estimated lost farm
 *   - spellRotationEfficiency: Ability sequencing score (placeholder)
 *   - score                  : 0–100 module score
 */
function analyzeCombat(parsedData, playerSteamId) {
  logger.debug(`Running combat analysis for ${playerSteamId}`);

  const { combatLog, playerTicks, matchMeta } = parsedData;
  const duration = matchMeta.durationSeconds || 1;

  // ---- Teamfight Detection ----
  const teamfights = detectTeamfights(combatLog);

  // ---- Teamfight Participation ----
  const teamfightParticipation = computeTeamfightParticipation(
    combatLog,
    teamfights,
    playerSteamId
  );

  // ---- Damage Taken Breakdown ----
  const damageTakenBreakdown = analyzeDamageTaken(combatLog, teamfights, playerSteamId);

  // ---- Dead-Time Penalty ----
  const deadTimePenalty = computeDeadTimePenalty(playerTicks, playerSteamId, duration);

  // ---- Spell Rotation Efficiency (placeholder) ----
  const spellRotationEfficiency = {
    score: 0,
    rotations: [],
    note: 'Requires ability_log data from parser',
  };

  // ---- Scoring ----
  const score = computeCombatScore({
    teamfightParticipation,
    damageTakenBreakdown,
    deadTimePenalty,
    spellRotationEfficiency,
    duration,
  });

  return {
    teamfights,
    teamfightParticipation,
    damageTakenBreakdown,
    deadTimePenalty,
    spellRotationEfficiency,
    score,
  };
}

/**
 * Cluster kill events into teamfights based on time and spatial proximity.
 */
function detectTeamfights(combatLog) {
  const kills = combatLog?.kills || [];
  if (kills.length === 0) return [];

  // Cluster kills within TEAMFIGHT.CLUSTER_TIME_WINDOW seconds
  const clusters = clusterEvents(kills, 'timeSeconds', TEAMFIGHT.CLUSTER_TIME_WINDOW);

  // Filter clusters that have enough participants
  return clusters
    .filter((cluster) => {
      const participants = new Set();
      cluster.forEach((kill) => {
        if (kill.attacker) participants.add(kill.attacker);
        if (kill.victim) participants.add(kill.victim);
        (kill.assisters || []).forEach((a) => participants.add(a));
      });
      return participants.size >= TEAMFIGHT.MIN_PARTICIPANTS;
    })
    .map((cluster, idx) => {
      const startTime = cluster[0].timeSeconds;
      const endTime = cluster[cluster.length - 1].timeSeconds;
      const participants = new Set();
      cluster.forEach((kill) => {
        if (kill.attacker) participants.add(kill.attacker);
        if (kill.victim) participants.add(kill.victim);
        (kill.assisters || []).forEach((a) => participants.add(a));
      });

      return {
        id: idx + 1,
        startSeconds: startTime,
        endSeconds: endTime,
        startFormatted: formatTime(startTime),
        endFormatted: formatTime(endTime),
        kills: cluster,
        participantCount: participants.size,
        participants: Array.from(participants),
      };
    });
}

/**
 * Calculate player's teamfight participation percentage.
 */
function computeTeamfightParticipation(combatLog, teamfights, steamId) {
  const kills = combatLog?.kills || [];

  // Total team kills (kills by anyone on the player's team)
  // Without team data, approximate by counting all kills
  const totalTeamKills = kills.length;

  // Player's involvement: kills + assists
  const playerKills = kills.filter((k) => idsMatch(k.attacker, steamId)).length;
  const playerAssists = kills.filter(
    (k) => !idsMatch(k.attacker, steamId) && (k.assisters || []).some((a) => idsMatch(a, steamId))
  ).length;

  const participation = safeDivide(playerKills + playerAssists, totalTeamKills) * 100;

  return {
    totalTeamKills,
    playerKills,
    playerAssists,
    participationPercent: Math.round(participation * 10) / 10,
    teamfightsPresent: teamfights.filter((tf) =>
      (tf.participants || []).some((id) => idsMatch(id, steamId))
    ).length,
    teamfightsTotal: teamfights.length,
  };
}

/**
 * Analyze damage taken: separate pre-fight poke from in-fight damage.
 */
function analyzeDamageTaken(combatLog, teamfights, steamId) {
  const damageEvents = (combatLog?.damage || []).filter((d) => idsMatch(d.victim, steamId));
  let pokeDamage = 0;
  let fightDamage = 0;

  for (const dmg of damageEvents) {
    const inFight = teamfights.some(
      (tf) => dmg.timeSeconds >= tf.startSeconds - 5 && dmg.timeSeconds <= tf.endSeconds + 5
    );
    if (inFight) {
      fightDamage += dmg.damage;
    } else {
      pokeDamage += dmg.damage;
    }
  }

  return {
    totalDamageTaken: pokeDamage + fightDamage,
    pokeDamage,
    fightDamage,
    pokeRatio: safeDivide(pokeDamage, pokeDamage + fightDamage),
  };
}

/**
 * Calculate total death time and estimated lost farm.
 */
function computeDeadTimePenalty(playerTicks, steamId, duration) {
  if (!playerTicks || playerTicks.length === 0) {
    return {
      totalDeadSeconds: 0,
      deathCount: 0,
      lostFarmEstimate: 0,
      averageSpmAtDeath: 0,
    };
  }

  const playerData = playerTicks.filter((t) => idsMatch(t.steamId, steamId));
  let totalDeadSeconds = 0;
  let deathCount = 0;
  let wasAlive = true;
  let deathStart = 0;

  for (const tick of playerData) {
    if (wasAlive && !tick.isAlive) {
      deathStart = tick.timeSeconds;
      deathCount++;
      wasAlive = false;
    } else if (!wasAlive && tick.isAlive) {
      totalDeadSeconds += tick.timeSeconds - deathStart;
      wasAlive = true;
    }
  }

  // Rough SPM estimate for lost-farm calculation
  const averageSpm = 80; // placeholder — should come from economy module
  const lostFarmEstimate = Math.round((totalDeadSeconds / 60) * averageSpm);

  return {
    totalDeadSeconds: Math.round(totalDeadSeconds),
    deathCount,
    lostFarmEstimate,
    lostFarmDescription: `You spent ${Math.round(totalDeadSeconds)} seconds dead, costing an estimated ${lostFarmEstimate} souls based on average SPM.`,
  };
}

/**
 * Compute 0–100 combat score.
 */
function computeCombatScore({ teamfightParticipation, damageTakenBreakdown, deadTimePenalty, spellRotationEfficiency, duration }) {
  let score = 50;

  // Participation bonus (up to +25)
  score += Math.min(teamfightParticipation.participationPercent / 100, 1) * 25;

  // Low poke damage bonus (up to +10) — less poke = better positioning
  const pokeRatio = damageTakenBreakdown.pokeRatio || 0;
  score += (1 - pokeRatio) * 10;

  // Dead-time penalty (up to -20)
  // Dynamic threshold: Being dead for 12% of the match is the max penalty threshold.
  const expectedMaxDeadSeconds = Math.max(duration * 0.12, 1);
  const deadRatio = Math.min(deadTimePenalty.totalDeadSeconds / expectedMaxDeadSeconds, 1);
  score -= deadRatio * 20;

  // Spell rotation (up to +10, placeholder)
  score += (spellRotationEfficiency.score / 100) * 10;

  return Math.round(Math.max(0, Math.min(100, score)));
}

module.exports = { analyzeCombat };
