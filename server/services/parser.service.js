const fs = require('fs');
const logger = require('../utils/logger');
const { tickToSeconds } = require('../utils/helpers');

/**
 * Parse a raw .dem file and extract structured game-state data.
 *
 * ----- PARSER STRATEGY -----
 * Source 2 .dem files are dense binary protobuf streams. For the MVP we use
 * a JS-based parser stub that returns a normalised data structure.
 *
 * In production this should delegate to:
 *   • `@laihoe/demoparser2` (JS bindings for Rust Source 2 parser)
 *   • or a custom Rust binary invoked via child_process
 *
 * The parser must extract the following data tables per tick/event:
 *   1. player_ticks  — per-tick snapshots of each player (position, souls, hp, alive)
 *   2. combat_log    — damage events, kills, assists
 *   3. item_log      — item purchase / sell events with timestamps
 *   4. ability_log   — ability cast events
 *   5. objective_log — damage to objectives (guardians, walkers, shrines, patron)
 *   6. neutral_log   — neutral camp kill events
 *   7. match_meta    — tick rate, duration, team composition
 * ---------------------------
 */

/**
 * Top-level parse function.
 * @param {string} demFilePath  Absolute path to the decompressed .dem file
 * @returns {Promise<Object>}   Normalised game data
 */
async function parseDemoFile(demFilePath) {
  logger.info(`Parsing demo file: ${demFilePath}`);

  if (!fs.existsSync(demFilePath)) {
    throw new Error(`Demo file not found: ${demFilePath}`);
  }

  const fileSize = fs.statSync(demFilePath).size;
  logger.debug(`Demo file size: ${(fileSize / 1024 / 1024).toFixed(1)} MB`);

  // --------------- Parser Integration Point ---------------
  // Replace this stub with actual parser call, e.g.:
  //   const { parseDemo } = require('@laihoe/demoparser2');
  //   const raw = parseDemo(demFilePath);
  //
  // For now, return the normalised structure so the rest of the pipeline
  // can be developed and tested independently.
  // --------------------------------------------------------

  try {
    const parsed = await extractDemoData(demFilePath);
    logger.info('Demo parse complete');
    return parsed;
  } catch (err) {
    logger.error(`Demo parse failed: ${err.message}`);
    throw new Error('Failed to parse demo file. The replay may be corrupted or in an unsupported format.');
  }
}

/**
 * Extract and normalise data from the demo file.
 * This is the integration seam — swap internals when the real parser is wired up.
 */
async function extractDemoData(demFilePath) {
  // Attempt to use @laihoe/demoparser2 if available
  try {
    const demoparser2 = require('@laihoe/demoparser2');
    return await parseWithDemoparser2(demoparser2, demFilePath);
  } catch (_) {
    // Parser not installed — return scaffold structure
    logger.warn('demoparser2 not available. Returning scaffold data structure.');
    return buildScaffoldData();
  }
}

/**
 * Parse using demoparser2 library and normalise output.
 */
async function parseWithDemoparser2(parser, demFilePath) {
  const buf = fs.readFileSync(demFilePath);

  // demoparser2 exposes methods like listGameEvents, parseEvents, parseTicks, etc.
  const header = parser.parseHeader(buf);
  const tickRate = header.playback_ticks / header.playback_time || 64;

  const gameEvents = parser.listGameEvents(buf);
  const killEvents = parser.parseEvents(buf, ['player_death']) || [];
  const damageEvents = parser.parseEvents(buf, ['player_hurt']) || [];
  const itemEvents = parser.parseEvents(buf, ['item_purchase']) || [];

  // Parse tick-level player data
  const tickFields = [
    'X', 'Y', 'Z',
    'health', 'max_health',
    'is_alive',
    'team_num',
  ];
  const playerTicks = parser.parseTicks(buf, tickFields, { tickInterval: 64 }) || [];

  return {
    matchMeta: {
      tickRate,
      durationSeconds: header.playback_time || 0,
      mapName: header.map_name || 'unknown',
      players: [], // populated from match info API
    },
    playerTicks: normalisePlayerTicks(playerTicks, tickRate),
    combatLog: normaliseCombatLog(killEvents, damageEvents, tickRate),
    itemLog: normaliseItemLog(itemEvents, tickRate),
    abilityLog: [],       // TODO: extract from game events
    objectiveLog: [],     // TODO: extract from entity damage events
    neutralLog: [],       // TODO: extract from NPC kill events
  };
}

/**
 * Build a scaffold data structure matching the expected schema.
 * Used for development when no real parser is available.
 */
function buildScaffoldData() {
  return {
    matchMeta: {
      tickRate: 64,
      durationSeconds: 0,
      mapName: 'unknown',
      players: [],
    },
    playerTicks: [],
    combatLog: {
      kills: [],
      damage: [],
    },
    itemLog: [],
    abilityLog: [],
    objectiveLog: [],
    neutralLog: [],
  };
}

// ----------- Normalisation helpers -----------

function normalisePlayerTicks(raw, tickRate) {
  if (!Array.isArray(raw)) return [];
  return raw.map((t) => ({
    tick: t.tick,
    timeSeconds: tickToSeconds(t.tick, tickRate),
    steamId: t.steamid,
    position: { x: t.X || 0, y: t.Y || 0, z: t.Z || 0 },
    health: t.health || 0,
    maxHealth: t.max_health || 0,
    isAlive: !!t.is_alive,
    team: t.team_num || 0,
  }));
}

function normaliseCombatLog(kills, damage, tickRate) {
  return {
    kills: (kills || []).map((e) => ({
      tick: e.tick,
      timeSeconds: tickToSeconds(e.tick, tickRate),
      attacker: e.attacker_steamid || e.attacker,
      victim: e.user_steamid || e.victim,
      weapon: e.weapon || 'unknown',
      assisters: e.assisters || [],
    })),
    damage: (damage || []).map((e) => ({
      tick: e.tick,
      timeSeconds: tickToSeconds(e.tick, tickRate),
      attacker: e.attacker_steamid || e.attacker,
      victim: e.user_steamid || e.victim,
      damage: e.dmg_health || e.damage || 0,
      weapon: e.weapon || 'unknown',
    })),
  };
}

function normaliseItemLog(items, tickRate) {
  if (!Array.isArray(items)) return [];
  return items.map((e) => ({
    tick: e.tick,
    timeSeconds: tickToSeconds(e.tick, tickRate),
    steamId: e.user_steamid || e.steamid,
    item: e.item || e.weapon || 'unknown',
    cost: e.cost || 0,
  }));
}

module.exports = { parseDemoFile };
