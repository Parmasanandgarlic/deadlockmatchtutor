const { clamp } = require('../../utils/helpers');
const { getHeroName } = require('../../utils/heroes');
const { getRankInfo } = require('../../utils/ranks');

/**
 * Matchup Difficulty Analyzer.
 *
 * Evaluates how difficult the enemy team composition was for the player in this
 * match by combining:
 *   - Average enemy rank vs own rank (skill delta)
 *   - Composition balance (tanks, carries, supports)
 *   - Counter relationships against the player's hero (simple archetype matrix)
 *   - Net worth / souls disparity between teams (contextual)
 *
 * Output:
 *   {
 *     score, difficulty: 'easy'|'balanced'|'hard'|'extreme',
 *     playerTeamAvgRank, enemyTeamAvgRank, rankDelta,
 *     enemyComposition: { tank, carry, support, brawler },
 *     counters: [ { heroId, heroName, reason } ],
 *     netWorthDelta, summary
 *   }
 */

// Hero archetypes (verified against assets.deadlock-api.com/v2/heroes, Apr 2026)
// Maps hero_type from API to archetype roles used in counter analysis.
const HERO_ARCHETYPE = {
  1: 'brawler',   // Infernus
  2: 'carry',     // Seven
  3: 'carry',     // Vindicta
  4: 'brawler',   // Lady Geist
  6: 'tank',      // Abrams
  7: 'carry',     // Wraith
  8: 'support',   // McGinnis
  10: 'brawler',  // Paradox
  11: 'support',  // Dynamo
  12: 'support',  // Kelvin
  13: 'carry',    // Haze
  14: 'carry',    // Holliday
  15: 'support',  // Bebop
  16: 'support',  // Calico
  17: 'carry',    // Grey Talon
  18: 'tank',     // Mo & Krill
  19: 'brawler',  // Shiv
  20: 'support',  // Ivy
  21: 'carry',    // Kali
  25: 'brawler',  // Warden
  27: 'brawler',  // Yamato
  31: 'brawler',  // Lash
  35: 'support',  // Viscous
  38: 'carry',    // Gunslinger
  39: 'brawler',  // The Boss
  47: 'brawler',  // Tokamak
  48: 'tank',     // Wrecker
  49: 'tank',     // Rutger
  50: 'brawler',  // Pocket
  51: 'brawler',  // Thumper
  52: 'carry',    // Mirage
  53: 'brawler',  // Fathom
  54: 'support',  // Cadence
  56: 'brawler',  // Bomber
  58: 'carry',    // Vyper
  59: 'brawler',  // Vandal
  60: 'carry',    // Sinclair
  61: 'support',  // Trapper
  62: 'carry',    // Raven
  63: 'support',  // Mina
  64: 'brawler',  // Drifter
  65: 'brawler',  // Venator
  66: 'brawler',  // Victor
  67: 'support',  // Paige
  68: 'support',  // Boho
  69: 'support',  // The Doorman
  70: 'brawler',  // Skyrunner
  71: 'support',  // Swan
  72: 'brawler',  // Billy
  73: 'support',  // Druid
  74: 'brawler',  // Graf
  75: 'support',  // Fortuna
  76: 'carry',    // Graves
  77: 'brawler',  // Apollo
  78: 'carry',    // Airheart
  79: 'support',  // Rem
  80: 'brawler',  // Silver
  81: 'support',  // Celeste
  82: 'support',  // Opera
};

// Counter matrix: which archetype is strong against which.
// row counters column: score 0..1 (1 = hard counter).
const COUNTER_MATRIX = {
  tank:    { carry: 0.6, support: 0.4, brawler: 0.3, tank: 0.1 },
  carry:   { tank: 0.5, support: 0.5, brawler: 0.3, carry: 0.2 },
  support: { carry: 0.3, brawler: 0.4, tank: 0.2, support: 0.1 },
  brawler: { support: 0.6, carry: 0.4, tank: 0.3, brawler: 0.2 },
};

// Known specific hero counters (heroId → heroIds that counter them hard)
// IDs verified against live API (Apr 2026)
const SPECIFIC_COUNTERS = {
  3:  [6, 18],    // Vindicta countered by dive tanks (Abrams, Mo & Krill)
  13: [6, 18],    // Haze countered by tanks with silence / burst
  17: [6, 18],    // Grey Talon countered by tanks that close gap
  7:  [15, 11],   // Wraith countered by CC supports (Bebop, Dynamo)
  2:  [15, 6],    // Seven countered by silence / tank (Bebop, Abrams)
};

function getArchetype(heroId) {
  return HERO_ARCHETYPE[heroId] || 'brawler';
}

function averageRank(players) {
  const badges = players
    .map((p) => p?.rank ?? p?.ranked_badge_level ?? p?.predicted_rank ?? p?.rank_tier ?? null)
    .filter((b) => typeof b === 'number');
  if (badges.length === 0) return null;
  return Math.round(badges.reduce((a, b) => a + b, 0) / badges.length);
}

function averageNetWorth(players) {
  const values = players
    .map((p) => Number(p?.net_worth ?? p?.souls ?? 0))
    .filter((v) => v > 0);
  if (values.length === 0) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

/**
 * @param {Object} params
 * @param {Object} params.matchInfo   Full match metadata (has players[])
 * @param {string|number} params.accountId
 * @param {number} params.heroId      The target player's hero ID
 * @param {Object} [params.rankPredict] Player's current rank prediction for skill delta
 */
function analyzeMatchupDifficulty({ matchInfo, accountId, heroId, rankPredict }) {
  const players = Array.isArray(matchInfo?.players) ? matchInfo.players : [];
  const target = players.find((p) => Number(p.account_id) === Number(accountId));
  const playerTeam = target?.team ?? target?.player_team ?? null;

  if (!target || playerTeam == null || players.length === 0) {
    return {
      score: 50,
      difficulty: 'unknown',
      note: 'Match info missing — cannot evaluate matchup difficulty.',
    };
  }

  const allies = players.filter((p) => p.team === playerTeam);
  const enemies = players.filter((p) => p.team !== playerTeam);

  const playerTeamAvgRank =
    averageRank(allies) ?? (rankPredict?.badge ?? null);
  const enemyTeamAvgRank = averageRank(enemies);
  const rankDelta =
    playerTeamAvgRank != null && enemyTeamAvgRank != null
      ? enemyTeamAvgRank - playerTeamAvgRank
      : 0;

  const allyNet = averageNetWorth(allies);
  const enemyNet = averageNetWorth(enemies);
  const netWorthDelta = allyNet != null && enemyNet != null ? allyNet - enemyNet : 0;

  // Count enemy composition archetypes
  const composition = { tank: 0, carry: 0, support: 0, brawler: 0 };
  for (const e of enemies) {
    const arch = getArchetype(e.hero_id ?? e.heroId);
    composition[arch] = (composition[arch] || 0) + 1;
  }

  // Counter analysis: which enemy heroes counter the player's hero?
  const playerArch = getArchetype(heroId);
  const counters = [];
  for (const e of enemies) {
    const eHeroId = e.hero_id ?? e.heroId;
    if (eHeroId == null) continue;
    const eArch = getArchetype(eHeroId);
    const archCounter = COUNTER_MATRIX[eArch]?.[playerArch] ?? 0;
    const isSpecific = (SPECIFIC_COUNTERS[heroId] || []).includes(eHeroId);
    if (archCounter >= 0.4 || isSpecific) {
      counters.push({
        heroId: eHeroId,
        heroName: getHeroName(eHeroId),
        archetype: eArch,
        strength: isSpecific ? 'hard' : archCounter >= 0.5 ? 'moderate' : 'soft',
        reason: isSpecific
          ? `${getHeroName(eHeroId)} is a known counter to ${getHeroName(heroId)}.`
          : `${eArch} heroes tend to pressure ${playerArch} heroes.`,
      });
    }
  }

  // Difficulty score: starts at 50, shifts based on factors.
  let score = 50;
  // Rank delta: each tier differential shifts ±10
  score += clamp(rankDelta * 1.0, -20, 20);
  // Counters: each hard counter +8 difficulty, moderate +4
  for (const c of counters) {
    if (c.strength === 'hard') score += 10;
    else if (c.strength === 'moderate') score += 5;
    else score += 2;
  }
  // Heavy enemy carry presence increases difficulty
  if (composition.carry >= 3) score += 6;
  if (composition.tank === 0) score -= 3; // no enemy tanks → easier
  if (composition.support >= 2) score += 4; // strong enemy utility

  // Net worth gap: if ally team out-farmed enemies, difficulty was lower
  if (netWorthDelta > 5000) score -= 8;
  else if (netWorthDelta < -5000) score += 8;

  score = Math.round(clamp(score, 0, 100));

  let difficulty = 'balanced';
  if (score >= 75) difficulty = 'extreme';
  else if (score >= 60) difficulty = 'hard';
  else if (score <= 35) difficulty = 'easy';

  const playerRankInfo = getRankInfo(playerTeamAvgRank);
  const enemyRankInfo = getRankInfo(enemyTeamAvgRank);

  return {
    score,
    difficulty,
    playerTeamAvgRank,
    enemyTeamAvgRank,
    playerRankName: playerRankInfo.name,
    enemyRankName: enemyRankInfo.name,
    rankDelta,
    netWorthDelta,
    enemyComposition: composition,
    playerArchetype: playerArch,
    counters,
    summary:
      difficulty === 'extreme'
        ? 'This match was an extreme-difficulty matchup — factor that into your grade.'
        : difficulty === 'hard'
        ? 'This was a harder-than-average matchup for your hero.'
        : difficulty === 'easy'
        ? 'This matchup favored your team and hero composition.'
        : 'This was a balanced matchup on paper.',
  };
}

module.exports = { analyzeMatchupDifficulty, HERO_ARCHETYPE, COUNTER_MATRIX };
