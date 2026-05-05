const { RANK_BENCHMARKS } = require('../pipeline/scoringCalibration');

const FIELD_ALIASES = {
  matchId: ['matchId', 'match_id', 'id'],
  accountId: ['accountId', 'account_id', 'steam32', 'steam_id32'],
  heroId: ['heroId', 'hero_id'],
  team: ['team', 'player_team'],
  winningTeam: ['winningTeam', 'winning_team', 'match_result'],
  durationSeconds: ['durationSeconds', 'duration_seconds', 'duration_s', 'duration', 'match_duration_s', 'match_duration'],
  startTime: ['startTime', 'start_time', 'match_start_time'],
  gameMode: ['gameMode', 'game_mode'],
  lobbyType: ['lobbyType', 'lobby_type'],
  patchVersion: ['patchVersion', 'patch_version', 'game_mode_version', 'match_version'],
  won: ['won', 'player_team_won'],

  kills: ['kills', 'player_kills'],
  deaths: ['deaths', 'player_deaths'],
  assists: ['assists', 'player_assists'],
  netWorth: ['netWorth', 'net_worth', 'networth'],
  souls: ['souls'],
  damageDealt: ['damageDealt', 'net_damage_dealt', 'player_damage', 'damage', 'hero_damage'],
  damageTaken: ['damageTaken', 'damage_taken', 'net_damage_taken', 'hero_damage_taken'],
  healing: ['healing', 'hero_healing', 'self_healing'],
  lastHits: ['lastHits', 'last_hits'],
  denies: ['denies'],
  objectiveDamage: ['objectiveDamage', 'objective_damage', 'obj_damage', 'hero_damage_to_objectives'],
  maxHealth: ['maxHealth', 'max_health'],
  level: ['level', 'hero_level'],
  rank: ['rank', 'predicted_rank', 'badge'],

  matchesPlayed: ['matchesPlayed', 'matches_played', 'matches'],
  winrate: ['winrate', 'win_rate'],
  avgKda: ['avgKda', 'avg_kda', 'kda'],
  avgSouls: ['avgSouls', 'avg_souls', 'avg_net_worth'],
  avgDamage: ['avgDamage', 'avg_damage', 'avg_hero_damage'],
};

const ITEM_ALIASES = [
  'items',
  'item_ids',
  'itemIds',
  'build',
  'match_items',
  'matchItems',
  'player_items',
  'playerItems',
  'inventory',
  'final_build',
  'finalBuild',
];

function firstPresent(raw, aliases) {
  if (!raw || typeof raw !== 'object') return undefined;
  for (const key of aliases) {
    if (raw[key] != null && raw[key] !== '') return raw[key];
  }
  return undefined;
}

function toNumberOrNull(value) {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function pickNumber(raw, field, fallback = 0) {
  const parsed = toNumberOrNull(firstPresent(raw, FIELD_ALIASES[field]));
  return parsed == null ? fallback : parsed;
}

function pickString(raw, field, fallback = null) {
  const value = firstPresent(raw, FIELD_ALIASES[field]);
  return value == null ? fallback : String(value);
}

function pickBoolean(raw, field) {
  const value = firstPresent(raw, FIELD_ALIASES[field]);
  return typeof value === 'boolean' ? value : null;
}

function normalizeItemList(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  for (const key of ITEM_ALIASES) {
    if (Array.isArray(raw[key])) return raw[key];
  }
  if (Array.isArray(raw.stats)) {
    const lastStats = raw.stats[raw.stats.length - 1];
    if (lastStats) return normalizeItemList(lastStats);
  }
  return [];
}

function normalizePlayer(raw = {}) {
  const damageDealt = pickNumber(raw, 'damageDealt');
  const damageTaken = pickNumber(raw, 'damageTaken');
  let positioningScore = toNumberOrNull(raw.positioningScore ?? raw.positioning_score);
  if (positioningScore == null && damageDealt > 0 && damageTaken > 0) {
    const ratio = damageDealt / damageTaken;
    const curve = RANK_BENCHMARKS.percentileCurve;
    const normalised = curve.benchmarkScore +
      curve.logScale * Math.log2(Math.min(Math.max(ratio, curve.ratioFloor), curve.ratioCeiling));
    positioningScore = Math.round(Math.max(0, Math.min(100, normalised)));
  }

  const accountId = pickNumber(raw, 'accountId', null);
  const heroId = pickNumber(raw, 'heroId', null);
  const team = pickNumber(raw, 'team', null);
  const netWorth = pickNumber(raw, 'netWorth');
  const souls = pickNumber(raw, 'souls', netWorth);
  const objectiveDamage = pickNumber(raw, 'objectiveDamage');

  return {
    ...raw,
    accountId,
    account_id: accountId,
    heroId,
    hero_id: heroId,
    team,
    player_team: team,
    kills: pickNumber(raw, 'kills'),
    deaths: pickNumber(raw, 'deaths'),
    assists: pickNumber(raw, 'assists'),
    netWorth,
    net_worth: netWorth,
    souls,
    damageDealt,
    hero_damage: damageDealt,
    damageTaken,
    healing: pickNumber(raw, 'healing'),
    lastHits: pickNumber(raw, 'lastHits'),
    denies: pickNumber(raw, 'denies'),
    objectiveDamage,
    objective_damage: objectiveDamage,
    maxHealth: pickNumber(raw, 'maxHealth', null),
    level: pickNumber(raw, 'level', null),
    rank: pickNumber(raw, 'rank', null),
    items: normalizeItemList(raw),
    positioningScore,
  };
}

function normalizeMatchInfo(raw = {}) {
  if (!raw || typeof raw !== 'object') return {};
  const matchId = pickNumber(raw, 'matchId', null);
  const durationSeconds = pickNumber(raw, 'durationSeconds', 0);
  const winningTeam = pickNumber(raw, 'winningTeam', null);
  const patchVersion = pickString(raw, 'patchVersion', null);
  const players = Array.isArray(raw.players)
    ? raw.players.map(normalizePlayer)
    : [];

  return {
    ...raw,
    matchId,
    match_id: matchId,
    durationSeconds,
    duration_seconds: durationSeconds,
    duration_s: durationSeconds,
    winningTeam,
    winning_team: winningTeam,
    startTime: pickString(raw, 'startTime', null),
    gameMode: pickString(raw, 'gameMode', null),
    game_mode: pickString(raw, 'gameMode', null),
    lobbyType: pickNumber(raw, 'lobbyType', null),
    lobby_type: pickNumber(raw, 'lobbyType', null),
    patchVersion,
    patch_version: patchVersion,
    players,
  };
}

function normalizeMatchHistoryEntry(raw = {}) {
  if (!raw || typeof raw !== 'object') return {};
  const player = normalizePlayer(raw);
  const matchId = pickNumber(raw, 'matchId', null);
  const durationSeconds = pickNumber(raw, 'durationSeconds', 0);
  const won = pickBoolean(raw, 'won');
  const winningTeam = pickNumber(raw, 'winningTeam', null);

  return {
    ...raw,
    ...player,
    matchId,
    match_id: matchId,
    durationSeconds,
    duration_seconds: durationSeconds,
    duration_s: durationSeconds,
    startTime: pickString(raw, 'startTime', null),
    start_time: pickString(raw, 'startTime', null),
    won,
    player_team_won: won,
    winningTeam,
    match_result: winningTeam,
    items: normalizeItemList(raw),
  };
}

function matchHistoryArrayFromEnvelope(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.matches)) return data.matches;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function normalizeMatchHistory(data) {
  return matchHistoryArrayFromEnvelope(data).map(normalizeMatchHistoryEntry);
}

function normalizeHeroStats(raw = {}) {
  if (!raw || typeof raw !== 'object') {
    return { winrate: 0, matchesPlayed: 0, avgKda: 0, avgSouls: 0, avgDamage: 0 };
  }
  let winrate = pickNumber(raw, 'winrate');
  if (winrate > 0 && winrate <= 1) winrate *= 100;
  winrate = Number(winrate.toFixed(2));
  return {
    ...raw,
    heroId: pickNumber(raw, 'heroId', null),
    hero_id: pickNumber(raw, 'heroId', null),
    winrate,
    matchesPlayed: pickNumber(raw, 'matchesPlayed'),
    avgKda: pickNumber(raw, 'avgKda'),
    avgSouls: pickNumber(raw, 'avgSouls'),
    avgDamage: pickNumber(raw, 'avgDamage'),
  };
}

function normalizeRankPredict(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (Array.isArray(raw)) return raw.map(normalizeRankPredict);
  const badge = pickNumber(raw, 'rank', null);
  return {
    ...raw,
    badge,
    rank: pickNumber(raw, 'rank', null),
    division: toNumberOrNull(raw.division),
    label: raw.rank_name || raw.label || null,
  };
}

function findPlayer(matchInfo, accountId) {
  if (!matchInfo || !Array.isArray(matchInfo.players)) return null;
  return matchInfo.players.find((player) => String(player.accountId) === String(accountId)) || null;
}

module.exports = {
  FIELD_ALIASES,
  normalizeMatchInfo,
  normalizeMatchHistory,
  normalizeMatchHistoryEntry,
  normalizeHeroStats,
  normalizeRankPredict,
  normalizePlayer,
  normalizeItemList,
  findPlayer,
  pickNumber,
};
