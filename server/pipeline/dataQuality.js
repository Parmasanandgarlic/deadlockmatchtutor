const { SOURCE_PAYLOAD_VERSION } = require('../utils/analysisVersioning');

function isFiniteNumber(value) {
  return value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
}

function firstNumber(...values) {
  for (const value of values) {
    if (isFiniteNumber(value)) return Number(value);
  }
  return null;
}

function findPlayer(matchInfo, accountId) {
  if (!Array.isArray(matchInfo?.players)) return null;
  return matchInfo.players.find((p) => Number(p.account_id ?? p.accountId) === Number(accountId)) || null;
}

function extractItemList(player, matchInHistory) {
  const candidates = [
    matchInHistory?.items,
    matchInHistory?.item_ids,
    matchInHistory?.itemIds,
    matchInHistory?.build,
    player?.items,
    player?.item_ids,
    player?.itemIds,
    player?.match_items,
    player?.matchItems,
    player?.player_items,
    player?.playerItems,
    player?.inventory,
    player?.final_build,
    player?.finalBuild,
    player?.build,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) return candidate;
  }
  if (Array.isArray(player?.stats)) {
    const lastStats = player.stats[player.stats.length - 1];
    if (Array.isArray(lastStats?.items) && lastStats.items.length > 0) return lastStats.items;
    if (Array.isArray(lastStats?.item_ids) && lastStats.item_ids.length > 0) return lastStats.item_ids;
    if (Array.isArray(lastStats?.itemIds) && lastStats.itemIds.length > 0) return lastStats.itemIds;
  }
  return [];
}

function buildCheck(name, passed, severity, message) {
  return { name, passed: Boolean(passed), severity, message };
}

function buildDataQuality({ matchInfo = {}, matchInHistory = null, heroStats = null, rankPredict = null, accountId }) {
  const player = findPlayer(matchInfo, accountId);
  const itemList = extractItemList(player, matchInHistory);
  const duration = firstNumber(
    matchInfo?.duration_s,
    matchInfo?.duration_seconds,
    matchInfo?.duration,
    matchInfo?.match_duration_s,
    matchInfo?.match_duration,
    matchInHistory?.match_duration_s,
    matchInHistory?.duration_seconds,
    matchInHistory?.duration_s,
    matchInHistory?.duration
  );
  const kills = firstNumber(player?.kills, player?.player_kills, matchInHistory?.player_kills, matchInHistory?.kills);
  const deaths = firstNumber(player?.deaths, player?.player_deaths, matchInHistory?.player_deaths, matchInHistory?.deaths);
  const assists = firstNumber(player?.assists, player?.player_assists, matchInHistory?.player_assists, matchInHistory?.assists);
  const netWorth = firstNumber(player?.net_worth, player?.networth, player?.souls, matchInHistory?.net_worth, matchInHistory?.netWorth, matchInHistory?.souls);
  const damage = firstNumber(player?.net_damage_dealt, player?.player_damage, player?.damage, player?.hero_damage, matchInHistory?.player_damage, matchInHistory?.damage, matchInHistory?.hero_damage);
  const objectiveDamage = firstNumber(player?.obj_damage, player?.objective_damage, player?.hero_damage_to_objectives, matchInHistory?.objective_damage);

  const signals = {
    hasMatchInfo: Boolean(matchInfo && Object.keys(matchInfo).length > 0),
    hasTargetPlayer: Boolean(player),
    hasHistoryEntry: Boolean(matchInHistory),
    hasDuration: Boolean(duration && duration > 0),
    hasKda: kills !== null && deaths !== null && assists !== null,
    hasEconomy: netWorth !== null && netWorth > 0,
    hasDamage: damage !== null && damage > 0,
    hasObjectiveDamage: objectiveDamage !== null && objectiveDamage > 0,
    hasItems: itemList.length > 0,
    hasHeroStats: Boolean(heroStats && Object.keys(heroStats).length > 0),
    hasRankPredict: Boolean(rankPredict && (Array.isArray(rankPredict) ? rankPredict.length > 0 : Object.keys(rankPredict).length > 0)),
  };

  const modules = {
    heroPerformance: {
      available: signals.hasDuration && (signals.hasKda || signals.hasEconomy || signals.hasDamage),
      required: ['duration', 'kda/economy/damage'],
    },
    itemization: {
      available: signals.hasDuration && signals.hasEconomy,
      required: ['duration', 'net worth or souls'],
    },
    combat: {
      available: signals.hasDuration && signals.hasKda,
      required: ['duration', 'kills/deaths/assists'],
    },
    benchmarks: {
      available: signals.hasDuration && signals.hasKda && signals.hasEconomy,
      required: ['duration', 'kills/deaths/assists', 'net worth or souls'],
    },
    rankBenchmarks: {
      available: signals.hasRankPredict && signals.hasDuration && (signals.hasKda || signals.hasEconomy || signals.hasObjectiveDamage),
      required: ['rank prediction', 'match stat signals'],
    },
    matchupDifficulty: {
      available: signals.hasTargetPlayer && Array.isArray(matchInfo?.players) && matchInfo.players.length >= 2,
      required: ['full player list'],
    },
    buildPath: {
      available: signals.hasItems,
      required: ['item list'],
    },
    decisionQuality: {
      available: signals.hasDuration && [signals.hasKda, signals.hasEconomy, signals.hasItems, signals.hasObjectiveDamage].filter(Boolean).length >= 2,
      required: ['at least two decision signals'],
    },
  };

  const checks = [
    buildCheck('matchInfo', signals.hasMatchInfo, 'medium', 'Full match metadata was returned.'),
    buildCheck('targetPlayer', signals.hasTargetPlayer || signals.hasHistoryEntry, 'critical', 'The requested player was found in match metadata or match history.'),
    buildCheck('duration', signals.hasDuration, 'critical', 'Match duration is required for per-minute scoring.'),
    buildCheck('kda', signals.hasKda, 'high', 'Kills/deaths/assists are required for combat scoring.'),
    buildCheck('economy', signals.hasEconomy, 'high', 'Net worth or souls are required for economy scoring.'),
    buildCheck('damage', signals.hasDamage, 'medium', 'Hero damage improves combat confidence.'),
    buildCheck('objectiveDamage', signals.hasObjectiveDamage, 'medium', 'Objective damage improves macro confidence.'),
    buildCheck('items', signals.hasItems, 'medium', 'Item lists are required for build-path scoring.'),
  ];

  const criticalMissing = checks.filter((check) => !check.passed && check.severity === 'critical');
  const highMissing = checks.filter((check) => !check.passed && check.severity === 'high');
  const availableCount = Object.values(modules).filter((module) => module.available).length;
  const confidenceScore = Math.max(
    0,
    Math.min(100, Math.round((checks.filter((check) => check.passed).length / checks.length) * 100))
  );

  return {
    schemaVersion: 1,
    sourcePayloadVersion: SOURCE_PAYLOAD_VERSION,
    confidence: criticalMissing.length > 0 ? 'insufficient' : highMissing.length > 0 ? 'limited' : confidenceScore >= 85 ? 'high' : 'medium',
    confidenceScore,
    canGradeOverall: criticalMissing.length === 0 && availableCount >= 2,
    signals,
    checks,
    modules,
    missingRequired: checks.filter((check) => !check.passed).map((check) => check.name),
    suppressedModules: Object.entries(modules)
      .filter(([, value]) => !value.available)
      .map(([key, value]) => ({ key, required: value.required })),
  };
}

function unavailableModule(key, quality) {
  const moduleQuality = quality?.modules?.[key];
  return {
    available: false,
    score: null,
    note: `Suppressed because required source data is missing: ${(moduleQuality?.required || []).join(', ') || 'unknown fields'}.`,
    required: moduleQuality?.required || [],
  };
}

function withModuleAvailability(key, module, quality) {
  if (!quality?.modules?.[key]?.available) return unavailableModule(key, quality);
  return { available: true, ...module };
}

module.exports = {
  buildDataQuality,
  unavailableModule,
  withModuleAvailability,
};
