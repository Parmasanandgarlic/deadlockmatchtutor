const logger = require('./logger');

/**
 * Deadlock API Response Adapter
 *
 * The Deadlock community API returns different field names depending on
 * the endpoint, version, and even time of day. This adapter normalizes
 * all responses at the boundary so downstream code uses a single set
 * of canonical field names.
 *
 * If the API adds new fields we don't recognize, they're logged as
 * drift warnings so we can update the adapter proactively.
 */

// ------------------------------------------------------------------
// Known field-name mappings (source → canonical)
// ------------------------------------------------------------------

/** @type {Record<string, string>} */
const PLAYER_FIELD_MAP = {
  // Kills
  kills: 'kills',
  player_kills: 'kills',
  // Deaths
  deaths: 'deaths',
  player_deaths: 'deaths',
  // Assists
  assists: 'assists',
  player_assists: 'assists',
  // Net worth / Souls
  net_worth: 'netWorth',
  networth: 'netWorth',
  souls: 'souls',
  // Damage dealt
  net_damage_dealt: 'damageDealt',
  player_damage: 'damageDealt',
  damage: 'damageDealt',
  hero_damage: 'damageDealt',
  // Damage taken
  damage_taken: 'damageTaken',
  net_damage_taken: 'damageTaken',
  hero_damage_taken: 'damageTaken',
  // Healing
  healing: 'healing',
  hero_healing: 'healing',
  self_healing: 'healing',
  // Misc stats
  last_hits: 'lastHits',
  denies: 'denies',
  obj_damage: 'objectiveDamage',
  objective_damage: 'objectiveDamage',
  hero_damage_to_objectives: 'objectiveDamage',
  max_health: 'maxHealth',
  level: 'level',
  hero_level: 'level',
  // Identity
  account_id: 'accountId',
  team: 'team',
  hero_id: 'heroId',
};

/** @type {Record<string, string>} */
const MATCH_FIELD_MAP = {
  match_id: 'matchId',
  matchId: 'matchId',
  duration_s: 'durationSeconds',
  match_duration_s: 'durationSeconds',
  start_time: 'startTime',
  match_start_time: 'startTime',
  winning_team: 'winningTeam',
  game_mode: 'gameMode',
  lobby_type: 'lobbyType',
  game_mode_version: 'patchVersion',
  patch_version: 'patchVersion',
  match_version: 'patchVersion',
};

/** @type {Record<string, string>} */
const MATCH_HISTORY_FIELD_MAP = {
  match_id: 'matchId',
  hero_id: 'heroId',
  player_kills: 'kills',
  kills: 'kills',
  player_deaths: 'deaths',
  deaths: 'deaths',
  player_assists: 'assists',
  assists: 'assists',
  net_worth: 'netWorth',
  netWorth: 'netWorth',
  souls: 'souls',
  player_damage: 'damageDealt',
  damage: 'damageDealt',
  hero_damage: 'damageDealt',
  match_duration_s: 'durationSeconds',
  duration_s: 'durationSeconds',
  start_time: 'startTime',
  match_start_time: 'startTime',
  player_team_won: 'won',
  won: 'won',
  match_result: 'matchResult',
  player_team: 'playerTeam',
};

const ITEM_ALIAS_KEYS = [
  'items', 'item_ids', 'itemIds', 'build', 'match_items',
  'matchItems', 'player_items', 'playerItems', 'inventory',
  'final_build', 'finalBuild',
];

// Fields we expect but don't need to warn about
const KNOWN_PASSTHROUGH_FIELDS = new Set([
  'players', 'rank', 'predicted_rank', 'badge', 'division',
  'rank_name', 'label', 'win_rate', 'winrate', 'matches_played',
  'matches', 'avg_kda', 'kda', 'avg_souls', 'avg_net_worth',
  'avg_damage', 'avg_hero_damage', 'stats',
]);

// ------------------------------------------------------------------
// Normalizers
// ------------------------------------------------------------------

/**
 * Normalize a single player object from match data.
 * Returns canonical field names. Unknown fields are preserved but logged.
 *
 * @param {Object} raw — raw player object from the Deadlock API
 * @returns {Object} — normalized player object
 */
function normalizePlayer(raw) {
  if (!raw || typeof raw !== 'object') return {};

  const result = {};
  const unmapped = [];

  for (const [key, value] of Object.entries(raw)) {
    if (PLAYER_FIELD_MAP[key]) {
      const canonical = PLAYER_FIELD_MAP[key];
      // First-write wins (prefer the more specific field)
      if (result[canonical] === undefined || result[canonical] === 0) {
        result[canonical] = value;
      }
    } else if (!KNOWN_PASSTHROUGH_FIELDS.has(key) && !ITEM_ALIAS_KEYS.includes(key)) {
      unmapped.push(key);
    }
  }

  // Extract items from whichever alias exists
  result.items = extractItems(raw);

  // Ensure numeric types
  result.kills = Number(result.kills ?? 0);
  result.deaths = Number(result.deaths ?? 0);
  result.assists = Number(result.assists ?? 0);
  result.netWorth = Number(result.netWorth ?? result.souls ?? 0);
  result.damageDealt = Number(result.damageDealt ?? 0);
  result.damageTaken = Number(result.damageTaken ?? 0);
  result.healing = Number(result.healing ?? 0);
  result.lastHits = Number(result.lastHits ?? 0);
  result.denies = Number(result.denies ?? 0);
  result.objectiveDamage = Number(result.objectiveDamage ?? 0);
  result.maxHealth = Number(result.maxHealth ?? 0);
  result.level = Number(result.level ?? 0);
  result.souls = Number(result.souls ?? result.netWorth ?? 0);
  result.accountId = Number(result.accountId ?? 0);
  result.team = result.team != null ? Number(result.team) : null;
  result.heroId = result.heroId != null ? Number(result.heroId) : null;

  if (unmapped.length > 0) {
    logger.debug(`[ApiAdapter] Unmapped player fields (API drift?): ${unmapped.join(', ')}`);
  }

  return result;
}

/**
 * Normalize full match info from the Deadlock API.
 *
 * @param {Object} raw — raw match metadata
 * @returns {Object} — normalized match object
 */
function normalizeMatchInfo(raw) {
  if (!raw || typeof raw !== 'object') return {};

  const result = {};

  for (const [key, value] of Object.entries(raw)) {
    if (MATCH_FIELD_MAP[key]) {
      const canonical = MATCH_FIELD_MAP[key];
      if (result[canonical] === undefined) {
        result[canonical] = value;
      }
    }
  }

  // Normalize players array
  if (Array.isArray(raw.players)) {
    result.players = raw.players.map(normalizePlayer);
  }

  // Ensure numeric types
  result.durationSeconds = Number(result.durationSeconds ?? 0);
  result.matchId = result.matchId != null ? Number(result.matchId) : null;
  result.winningTeam = result.winningTeam != null ? Number(result.winningTeam) : null;

  return result;
}

/**
 * Normalize a match-history entry.
 *
 * @param {Object} raw — raw match-history item
 * @returns {Object} — normalized match-history entry
 */
function normalizeMatchHistoryEntry(raw) {
  if (!raw || typeof raw !== 'object') return {};

  const result = {};

  for (const [key, value] of Object.entries(raw)) {
    if (MATCH_HISTORY_FIELD_MAP[key]) {
      const canonical = MATCH_HISTORY_FIELD_MAP[key];
      if (result[canonical] === undefined) {
        result[canonical] = value;
      }
    }
  }

  // Extract items
  result.items = extractItems(raw);

  // Derive 'won' from match_result + player_team if not directly available
  if (result.won === undefined && result.matchResult != null && result.playerTeam != null) {
    result.won = Number(result.matchResult) === Number(result.playerTeam);
  }

  // Ensure numeric types
  result.kills = Number(result.kills ?? 0);
  result.deaths = Number(result.deaths ?? 0);
  result.assists = Number(result.assists ?? 0);
  result.netWorth = Number(result.netWorth ?? 0);
  result.souls = Number(result.souls ?? 0);
  result.damageDealt = Number(result.damageDealt ?? 0);
  result.durationSeconds = Number(result.durationSeconds ?? 0);
  result.matchId = result.matchId != null ? Number(result.matchId) : null;
  result.heroId = result.heroId != null ? Number(result.heroId) : null;

  return result;
}

/**
 * Normalize hero stats from the Deadlock API.
 * Handles both decimal (0–1) and percentage (0–100) win rates.
 *
 * @param {Object} raw
 * @returns {{ winrate: number, matchesPlayed: number, avgKda: number, avgSouls: number, avgDamage: number }}
 */
function normalizeHeroStats(raw) {
  if (!raw || typeof raw !== 'object') {
    return { winrate: 0, matchesPlayed: 0, avgKda: 0, avgSouls: 0, avgDamage: 0 };
  }

  let matchesPlayed = Number(raw.matches_played ?? raw.matches ?? 0);
  let winrate = raw.win_rate ?? raw.winrate ?? 0;

  // Fallback: If win_rate isn't explicitly provided, compute it from wins and matches
  if (winrate === 0 && matchesPlayed > 0 && (raw.wins || raw.matches_won)) {
    const wins = Number(raw.wins ?? raw.matches_won ?? 0);
    winrate = (wins / matchesPlayed);
  }

  // Normalize: anything <= 1 is a fraction -> convert to percentage
  if (winrate > 0 && winrate <= 1) winrate = winrate * 100;

  // KDA fallback using totals
  let avgKda = Number(raw.avg_kda ?? raw.kda ?? 0);
  if (avgKda === 0 && raw.total_kills != null && raw.total_deaths != null && raw.total_assists != null) {
      const deaths = Number(raw.total_deaths);
      avgKda = deaths > 0 ? (Number(raw.total_kills) + Number(raw.total_assists)) / deaths : (Number(raw.total_kills) + Number(raw.total_assists));
  }

  // Souls fallback using totals
  let avgSouls = Number(raw.avg_souls ?? raw.avg_net_worth ?? 0);
  if (avgSouls === 0 && raw.total_net_worth != null && matchesPlayed > 0) {
      avgSouls = Number(raw.total_net_worth) / matchesPlayed;
  }

  // Damage fallback using totals
  let avgDamage = Number(raw.avg_damage ?? raw.avg_hero_damage ?? 0);
  if (avgDamage === 0 && (raw.total_player_damage != null || raw.total_damage != null) && matchesPlayed > 0) {
      const totalDamage = Number(raw.total_player_damage ?? raw.total_damage);
      avgDamage = totalDamage / matchesPlayed;
  }

  return {
    winrate,
    matchesPlayed,
    avgKda,
    avgSouls,
    avgDamage,
  };
}

// ------------------------------------------------------------------
// Item extraction helper
// ------------------------------------------------------------------

/**
 * Extract items array from any of the known alias keys.
 * @param {Object} obj
 * @returns {Array}
 */
function extractItems(obj) {
  if (!obj) return [];

  for (const key of ITEM_ALIAS_KEYS) {
    const val = obj[key];
    if (Array.isArray(val) && val.length > 0) return val;
    if (val && typeof val === 'object') {
      // Nested: { items: [...] } or { item_ids: [...] }
      if (Array.isArray(val.items)) return val.items;
      if (Array.isArray(val.item_ids)) return val.item_ids;
      if (Array.isArray(val.itemIds)) return val.itemIds;
    }
  }

  // Check nested stats array as last resort
  if (Array.isArray(obj.stats)) {
    const lastStats = obj.stats[obj.stats.length - 1];
    if (lastStats) {
      for (const key of ['items', 'item_ids', 'itemIds']) {
        if (Array.isArray(lastStats[key]) && lastStats[key].length > 0) {
          return lastStats[key];
        }
      }
    }
  }

  return [];
}

// ------------------------------------------------------------------
// Custom error for API failures that downstream should handle explicitly
// ------------------------------------------------------------------

class ApiUnavailableError extends Error {
  /**
   * @param {string} message
   * @param {number} statusCode — HTTP status from the upstream API
   * @param {string} endpoint — which API call failed
   */
  constructor(message, statusCode, endpoint) {
    super(message);
    this.name = 'ApiUnavailableError';
    this.statusCode = statusCode;
    this.endpoint = endpoint;
  }
}

module.exports = {
  normalizePlayer,
  normalizeMatchInfo,
  normalizeMatchHistoryEntry,
  normalizeHeroStats,
  extractItems,
  ApiUnavailableError,
};
