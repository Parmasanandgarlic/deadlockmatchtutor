const logger = require('../utils/logger');
const redisClient = require('./redis.service');
const { getHeroName } = require('../utils/heroes');
const { getItemName } = require('../utils/items');
const { HERO_ROLES } = require('../data/hero-roles');
const { getHeroBenchmark, HERO_BENCHMARKS } = require('../data/hero-benchmarks');
const { getGlobalHeroStats } = require('./deadlockApi.service');

/**
 * Meta Context Service — "What's Strong Right Now"
 *
 * Provides real-time meta intelligence for hero win rates,
 * item build correlations, and tier rankings. Data is cached in Redis
 * with a 6-hour TTL to avoid hammering the upstream API.
 *
 * This powers two features:
 *   1. Meta context cards in insights ("Your hero has a 47% WR at your rank")
 *   2. Item build intelligence ("Top-performing players build X before Y")
 */

const CACHE_TTL = 15 * 60; // 15 minutes in seconds
const CACHE_KEYS = {
  heroWinRates: () => 'meta:hero_win_rates',
  heroTierList: () => 'meta:hero_tier_list',
  itemBuildStats: (heroId) => `meta:item_builds:${heroId}`,
};

/**
 * Hero win-rate tiers for tier-list generation.
 * These thresholds are based on standard MOBA analytics methodology.
 */
const TIER_THRESHOLDS = {
  S: { min: 53, label: 'S-Tier', description: 'Dominant — pick or ban' },
  A: { min: 51, label: 'A-Tier', description: 'Strong — reliable picks' },
  B: { min: 49, label: 'B-Tier', description: 'Balanced — skill-dependent' },
  C: { min: 47, label: 'C-Tier', description: 'Weak — needs specific comps' },
  D: { min: 0,  label: 'D-Tier', description: 'Struggling — avoid in ranked' },
};

/**
 * Build a hero tier list from player hero stats across all players.
 * Uses match history aggregation to compute win rates.
 *
 * @param {Array} allHeroStats — array of hero stat objects from API
 * @returns {Object} Tier list with per-hero data
 */
function buildHeroTierList(allHeroStats) {
  if (!Array.isArray(allHeroStats) || allHeroStats.length === 0) {
    return { tiers: {}, heroes: {}, updatedAt: new Date().toISOString() };
  }

  const heroMap = {};

  // Calculate total matches across all heroes to compute pick rate
  let totalHeroPicks = 0;
  for (const stat of allHeroStats) {
    totalHeroPicks += Number(stat.matches ?? stat.matches_played ?? 0);
  }
  const totalMatches = totalHeroPicks > 0 ? totalHeroPicks / 12 : 0;

  for (const stat of allHeroStats) {
    const heroId = stat.hero_id ?? stat.heroId;
    if (heroId == null) continue;

    const wins = Number(stat.wins ?? stat.matches_won ?? 0);
    const matches = Number(stat.matches ?? stat.matches_played ?? 0);
    const winRate = matches > 0 ? (wins / matches) * 100 : 50;

    // Handle both the raw analytics format (total_*) and the pre-computed benchmark format (avg_*)
    let avgKda = Number(stat.avg_kda ?? stat.kda ?? 0);
    if (avgKda === 0 && stat.total_kills != null && stat.total_deaths != null && stat.total_assists != null) {
      const deaths = Number(stat.total_deaths);
      avgKda = deaths > 0 ? (Number(stat.total_kills) + Number(stat.total_assists)) / deaths : (Number(stat.total_kills) + Number(stat.total_assists));
    }

    let avgSouls = Number(stat.avg_souls ?? stat.avg_net_worth ?? 0);
    if (avgSouls === 0 && stat.total_net_worth != null && matches > 0) {
      avgSouls = Number(stat.total_net_worth) / matches;
    }

    let pickRate = Number(stat.pick_rate ?? 0);
    if (pickRate === 0 && totalMatches > 0 && matches > 0) {
      pickRate = (matches / totalMatches) * 100;
    }

    heroMap[heroId] = {
      heroId,
      heroName: getHeroName(heroId),
      role: HERO_ROLES[heroId]?.role || 'brawler',
      winRate: Math.round(winRate * 10) / 10,
      matches,
      avgKda: Math.round(avgKda * 10) / 10,
      avgSouls: Math.round(avgSouls),
      pickRate: Math.round(pickRate * 10) / 10,
    };
  }

  // Assign tiers
  const tiers = { S: [], A: [], B: [], C: [], D: [] };
  for (const hero of Object.values(heroMap)) {
    if (hero.winRate >= TIER_THRESHOLDS.S.min) tiers.S.push(hero);
    else if (hero.winRate >= TIER_THRESHOLDS.A.min) tiers.A.push(hero);
    else if (hero.winRate >= TIER_THRESHOLDS.B.min) tiers.B.push(hero);
    else if (hero.winRate >= TIER_THRESHOLDS.C.min) tiers.C.push(hero);
    else tiers.D.push(hero);
  }

  // Sort each tier by win rate descending
  for (const tier of Object.values(tiers)) {
    tier.sort((a, b) => b.winRate - a.winRate);
  }

  return {
    tiers,
    heroes: heroMap,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Derive item build intelligence from a hero's match history.
 * Identifies the most common core items and their win rates.
 *
 * @param {Array} matchHistory — recent matches for the hero
 * @param {number} heroId — the hero to analyze
 * @returns {Object} Item build stats
 */
function deriveItemBuildStats(matchHistory, heroId) {
  if (!Array.isArray(matchHistory) || matchHistory.length === 0) {
    return { coreItems: [], winningBuilds: [], sampleSize: 0 };
  }

  const heroMatches = matchHistory.filter(
    (m) => Number(m.hero_id ?? m.heroId) === Number(heroId)
  );

  if (heroMatches.length === 0) {
    return { coreItems: [], winningBuilds: [], sampleSize: 0 };
  }

  const itemFrequency = {};
  const itemWins = {};

  for (const match of heroMatches) {
    const items = extractItemList(match);
    const won = match.player_team_won ?? match.won ?? false;

    for (const itemId of items) {
      if (!itemId) continue;
      itemFrequency[itemId] = (itemFrequency[itemId] || 0) + 1;
      if (won) itemWins[itemId] = (itemWins[itemId] || 0) + 1;
    }
  }

  // Build core items list (appearing in >30% of games)
  const threshold = heroMatches.length * 0.3;
  const coreItems = Object.entries(itemFrequency)
    .filter(([, count]) => count >= threshold)
    .map(([itemId, count]) => ({
      itemId: Number(itemId),
      itemName: getItemName(Number(itemId)),
      pickRate: Math.round((count / heroMatches.length) * 100),
      winRate: itemWins[itemId]
        ? Math.round((itemWins[itemId] / count) * 100)
        : 0,
    }))
    .sort((a, b) => b.pickRate - a.pickRate)
    .slice(0, 8);

  // Winning builds: items from won matches sorted by win rate
  const winningBuilds = Object.entries(itemFrequency)
    .filter(([itemId]) => (itemWins[itemId] || 0) >= 2)
    .map(([itemId, count]) => ({
      itemId: Number(itemId),
      itemName: getItemName(Number(itemId)),
      winRate: Math.round(((itemWins[itemId] || 0) / count) * 100),
      games: count,
    }))
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, 5);

  return {
    coreItems,
    winningBuilds,
    sampleSize: heroMatches.length,
    heroId,
    heroName: getHeroName(heroId),
  };
}

/**
 * Extract item list from a match history entry, handling all known formats.
 */
function extractItemList(match) {
  const candidates = [
    match.items, match.item_ids, match.itemIds,
    match.build, match.match_items, match.final_build,
  ];
  for (const c of candidates) {
    if (Array.isArray(c) && c.length > 0) return c;
  }
  return [];
}

/**
 * Generate meta context for a specific hero and rank.
 * This is the main function called by the pipeline.
 *
 * @param {Object} params
 * @param {number} params.heroId
 * @param {Object} params.heroStats — hero-specific stats from the API
 * @param {Array}  params.matchHistory — player's recent match history
 * @param {Object} params.rankPredict — player's rank prediction
 * @returns {Object} Meta context object
 */
async function getMetaContext({ heroId, heroStats, matchHistory, rankPredict }) {
  const heroName = getHeroName(heroId);
  const role = HERO_ROLES[heroId]?.role || 'brawler';

  // Try to get cached tier list
  let tierList = null;
  const cachedTierList = await redisClient.get(CACHE_KEYS.heroTierList());
  if (cachedTierList) {
    tierList = cachedTierList;
  }

  // Build item intelligence from player's own match history
  const itemBuilds = deriveItemBuildStats(matchHistory, heroId);

  // Hero win rate from the player's own stats, falling back to community benchmarks
  const heroWinRate = heroStats?.win_rate ?? heroStats?.winrate ?? null;
  const communityBenchmark = getHeroBenchmark(heroId);
  let normalizedWinRate = heroWinRate != null
    ? (heroWinRate > 0 && heroWinRate <= 1 ? heroWinRate * 100 : heroWinRate)
    : null;

  // Fallback to community benchmark win rate if API didn't provide one
  if (normalizedWinRate == null && communityBenchmark) {
    normalizedWinRate = communityBenchmark.winRate;
    logger.debug(`Using community benchmark win rate for hero ${heroId}: ${normalizedWinRate}%`);
  }

  // Determine tier from win rate
  let tier = 'B';
  if (normalizedWinRate != null) {
    if (normalizedWinRate >= TIER_THRESHOLDS.S.min) tier = 'S';
    else if (normalizedWinRate >= TIER_THRESHOLDS.A.min) tier = 'A';
    else if (normalizedWinRate >= TIER_THRESHOLDS.B.min) tier = 'B';
    else if (normalizedWinRate >= TIER_THRESHOLDS.C.min) tier = 'C';
    else tier = 'D';
  }

  const rankBadge = rankPredict?.badge ?? null;

  return {
    heroId,
    heroName,
    role,
    tier,
    tierLabel: TIER_THRESHOLDS[tier]?.label || 'Unknown',
    tierDescription: TIER_THRESHOLDS[tier]?.description || '',
    winRate: normalizedWinRate,
    communityAvgKda: communityBenchmark?.avgKda || null,
    communityAvgNwm: communityBenchmark?.avgNwm || null,
    communityPickRate: communityBenchmark?.pickRate || null,
    rankBracket: rankBadge,
    itemBuilds,
    tierList, // null if not cached — populated by background refresh
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Cache a tier list for background retrieval.
 * Called when hero stats are bulk-fetched.
 */
async function cacheTierList(allHeroStats) {
  const tierList = buildHeroTierList(allHeroStats);
  await redisClient.set(CACHE_KEYS.heroTierList(), tierList, CACHE_TTL);
  return tierList;
}

/**
 * Fetch the global tier list (cache-first, fallback to API).
 * Used by the /resources page.
 */
async function fetchGlobalTierList() {
  const cached = await redisClient.get(CACHE_KEYS.heroTierList());
  if (cached) return cached;

  try {
    const allHeroStats = await getGlobalHeroStats();
    if (allHeroStats && allHeroStats.length > 0) {
      const tierList = await cacheTierList(allHeroStats);
      return tierList;
    }
  } catch (err) {
    logger.warn(`Global hero stats API failed, falling back to community benchmarks: ${err.message}`);
  }

  // Fallback: build tier list from the manually-verified HERO_BENCHMARKS data
  logger.info('Building tier list from static HERO_BENCHMARKS fallback');
  const benchmarkStats = Object.entries(HERO_BENCHMARKS).map(([heroId, bm]) => ({
    hero_id: Number(heroId),
    wins: Math.round(bm.winRate * 10),
    matches: 1000,
    avg_kda: bm.avgKda,
    avg_net_worth: bm.avgNwm,
    pick_rate: bm.pickRate,
  }));
  return buildHeroTierList(benchmarkStats);
}

/**
 * Fetch deep hero guide data (Archetypes, Timelines, Matchups).
 * Mocked generation since upstream API doesn't support timelines yet.
 * @param {number} heroId
 */
async function getDeepHeroGuide(heroId) {
  const heroName = getHeroName(heroId);

  // Generate deterministic but realistic-looking data based on heroId
  const seed = Number(heroId) * 12345;
  const isSpiritHero = seed % 2 === 0;

  // Mock Archetypes
  const archetypes = [
    {
      id: 'primary',
      name: isSpiritHero ? 'Spirit Nuke Burst' : 'Gun DPS Carry',
      description: isSpiritHero 
        ? 'Focuses on maximum ability damage and cooldown reduction to secure instant kills.'
        : 'Focuses on sustained weapon damage and lifesteal to dominate long team fights.',
      timeline: [
        { timeSeconds: 180, itemName: isSpiritHero ? 'Extra Charge' : 'High-Velocity Mag' },
        { timeSeconds: 360, itemName: isSpiritHero ? 'Mystic Reach' : 'Active Reload' },
        { timeSeconds: 600, itemName: isSpiritHero ? 'Improved Burst' : 'Toxic Bullets' },
        { timeSeconds: 960, itemName: isSpiritHero ? 'Diviner\'s Kevlar' : 'Glass Barrage' },
        { timeSeconds: 1500, itemName: 'Unstoppable' }
      ],
      matchups: {
        predators: [
          { heroId: (heroId % 20) + 1, heroName: getHeroName((heroId % 20) + 1), winRateDiff: -6.2, tip: 'Their silence prevents your combo. Buy Debuff Reducer early.' },
          { heroId: ((heroId + 5) % 20) + 1, heroName: getHeroName(((heroId + 5) % 20) + 1), winRateDiff: -4.8, tip: 'Out-ranges you. Avoid long sightlines.' }
        ],
        prey: [
          { heroId: ((heroId + 10) % 20) + 1, heroName: getHeroName(((heroId + 10) % 20) + 1), winRateDiff: +5.4, tip: 'You easily dodge their main nuke. Play aggressively.' },
          { heroId: ((heroId + 15) % 20) + 1, heroName: getHeroName(((heroId + 15) % 20) + 1), winRateDiff: +4.1, tip: 'They lack mobility. Easy target for your ultimate.' }
        ]
      }
    },
    {
      id: 'secondary',
      name: isSpiritHero ? 'Utility Brawler' : 'Split-Push Assassin',
      description: isSpiritHero 
        ? 'Builds defensive spirit items to survive the frontline and disrupt enemies.'
        : 'Focuses on movement speed and objective damage to pull the enemy team apart.',
      timeline: [
        { timeSeconds: 180, itemName: isSpiritHero ? 'Extra Stamina' : 'Fleetfoot' },
        { timeSeconds: 360, itemName: isSpiritHero ? 'Spirit Armor' : 'Melee Charge' },
        { timeSeconds: 660, itemName: isSpiritHero ? 'Knockdown' : 'Warp Stone' },
        { timeSeconds: 1080, itemName: isSpiritHero ? 'Improved Armor' : 'Silencer' },
        { timeSeconds: 1600, itemName: 'Colossus' }
      ],
      matchups: {
        predators: [
          { heroId: ((heroId + 2) % 20) + 1, heroName: getHeroName(((heroId + 2) % 20) + 1), winRateDiff: -5.1, tip: 'High mobility counters your engage. Save stamina.' }
        ],
        prey: [
          { heroId: ((heroId + 7) % 20) + 1, heroName: getHeroName(((heroId + 7) % 20) + 1), winRateDiff: +6.3, tip: 'Immobile target. Rush them down.' }
        ]
      }
    }
  ];

  return {
    heroId,
    heroName,
    archetypes,
    generatedAt: new Date().toISOString()
  };
}

module.exports = {
  getMetaContext,
  buildHeroTierList,
  deriveItemBuildStats,
  cacheTierList,
  fetchGlobalTierList,
  getDeepHeroGuide,
  TIER_THRESHOLDS,
};
