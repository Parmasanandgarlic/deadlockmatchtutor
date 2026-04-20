const { resolveSteamId } = require('../services/steam.service');
const {
  getMatchHistory,
  getPlayerRankPredict,
  getPlayerHeroStatsAll,
  getPlayerAccountStats,
  getPlayerCard,
  getHeroes,
  getRanks,
} = require('../services/deadlockApi.service');
const { trackAccount } = require('../services/sync.service');
const { buildMmrHistory, fetchRankPredictRaw } = require('../services/mmrHistory.service');
const { getRankInfo, setApiRanks } = require('../utils/ranks');
const { getHeroData, getHeroName, setApiHeroNames } = require('../utils/heroes');
const logger = require('../utils/logger');
const config = require('../config');

// ──────────────────────────────────────────────────────────────────────────────
// Metadata warmers (hero + rank lookup tables)
// Cached process-wide for 24h so the very first profile request doesn't
// serve "Tier 4" / "Unknown Hero" placeholders.
// ──────────────────────────────────────────────────────────────────────────────
const META_TTL_MS = 24 * 60 * 60 * 1000;
let heroesWarmedAt = 0;
let ranksWarmedAt = 0;

async function ensureHeroMetadata() {
  if (Date.now() - heroesWarmedAt < META_TTL_MS) return;
  try {
    const heroes = await getHeroes();
    if (Array.isArray(heroes) && heroes.length > 0) {
      setApiHeroNames(heroes);
      heroesWarmedAt = Date.now();
    }
  } catch (err) {
    logger.warn(`[ProfileWarm] Hero metadata warm failed: ${err.message}`);
  }
}

async function ensureRankMetadata() {
  if (Date.now() - ranksWarmedAt < META_TTL_MS) return;
  try {
    const ranks = await getRanks();
    if (Array.isArray(ranks) && ranks.length > 0) {
      setApiRanks(ranks);
      ranksWarmedAt = Date.now();
    }
  } catch (err) {
    logger.warn(`[ProfileWarm] Rank metadata warm failed: ${err.message}`);
  }
}

/**
 * POST /api/players/resolve
 * Resolve a Steam vanity URL / profile link / raw ID to Steam64 + Steam32.
 */
async function resolvePlayer(req, res, next) {
  try {
    const { steamInput } = req.body;
    if (!steamInput) {
      return res.status(400).json({ error: 'Steam input is required' });
    }
    
    const result = await resolveSteamId(steamInput);
    res.json(result);
  } catch (err) {
    let msg = err.message;
    let code = err.code || 'ERR_STEAM_RESOLVE';
    let status = 500;

    if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
      msg = 'Steam resolution timed out. This often happens due to Steam Community rate limits or network congestion.';
      code = 'ERR_TIMEOUT';
      status = 504;
    } else if (err.response && err.response.status >= 500) {
      msg = 'Steam community servers are currently having issues (5xx). Please try again later.';
      code = 'ERR_STEAM_DOWN';
      status = 502;
    } else if (msg.includes('Unrecognised') || msg.includes('Could not resolve') || msg.includes('Invalid')) {
      code = 'ERR_INVALID_INPUT';
      status = 400;
    }

    // Log full error details for production debugging
    logger.error(`Player resolution failed [${code}] for input "${req.body.steamInput}":`, {
      message: msg,
      raw: err.message,
      code: err.code,
      status: err.response?.status,
      stack: err.stack,
    });

    res.status(status).json({ 
      error: msg,
      code,
      details: config.isDev ? err.message : null
    });
  }
}

/**
 * GET /api/players/:accountId/matches
 * Fetch the player's recent match history.
 */
async function getPlayerMatches(req, res, next) {
  try {
    const { accountId } = req.params;
    const bypassCache = req.query?.refresh === '1' || req.query?.refresh === 'true';
    
    // Background track this account
    trackAccount(accountId);

    const matches = await getMatchHistory(accountId, { bypassCache });
    res.json(matches);
  } catch (err) {
    const msg = err.message || 'Failed to fetch match history.';
    const status = msg.toLowerCase().includes('timeout')
      ? 504
      : msg.includes('not found') || msg.includes('Invalid') || msg.includes('check')
        ? 400
        : 500;
    res.status(status).json({ error: msg });
  }
}

/**
 * GET /api/players/:accountId/mmr-history
 * Return an enriched MMR timeline derived from rank-predict + match history.
 */
async function getPlayerMmrHistory(req, res, next) {
  try {
    const { accountId } = req.params;
    const bypassCache = req.query?.refresh === '1' || req.query?.refresh === 'true';

    const [rankPredictRaw, rankPredictClient, matches] = await Promise.all([
      fetchRankPredictRaw(accountId).catch(() => null),
      getPlayerRankPredict(accountId).catch(() => null),
      getMatchHistory(accountId, { bypassCache }).catch(() => []),
    ]);

    // Prefer the richer mmr-history payload if available
    const rankPredict = rankPredictRaw || rankPredictClient || null;
    const mmr = buildMmrHistory(rankPredict, matches);
    res.json(mmr);
  } catch (err) {
    logger.error(`MMR history failed for ${req.params.accountId}: ${err.message}`);
    const status = err.message.toLowerCase().includes('timeout') ? 504 : 500;
    res.status(status).json({ error: err.message || 'Failed to build MMR history.' });
  }
}

/**
 * GET /api/players/:accountId/profile
 * Unified player dossier: rank badge (current + peak), career totals,
 * recent form, and top-played heroes. Backs the PlayerProfilePage header.
 *
 * Every data source is optional — we degrade gracefully if the community
 * API is missing a given slice so the page never blanks out.
 */
async function getPlayerProfile(req, res) {
  const { accountId } = req.params;
  try {
    // Warm the hero + rank lookup tables so names / images resolve.
    await Promise.all([ensureHeroMetadata(), ensureRankMetadata()]);

    const [rankPredictRaw, rankPredictClient, accountStats, card, heroStats, matches] = await Promise.all([
      fetchRankPredictRaw(accountId).catch(() => null),
      getPlayerRankPredict(accountId).catch(() => null),
      getPlayerAccountStats(accountId).catch(() => ({})),
      getPlayerCard(accountId).catch(() => ({})),
      getPlayerHeroStatsAll(accountId).catch(() => []),
      getMatchHistory(accountId).catch(() => []),
    ]);

    const rankPredict = rankPredictRaw || rankPredictClient || null;

    // ── Rank: current = most-recent prediction, peak = highest badge seen.
    const rankTimeline = Array.isArray(rankPredict) ? rankPredict : [];
    const currentBadge =
      rankTimeline[0]?.rank ??
      rankTimeline[0]?.predicted_rank ??
      rankTimeline[0]?.badge ??
      (rankPredict && !Array.isArray(rankPredict)
        ? rankPredict.rank ?? rankPredict.predicted_rank ?? rankPredict.badge
        : null) ??
      null;
    const peakBadge = rankTimeline.reduce((peak, entry) => {
      const b = entry?.rank ?? entry?.predicted_rank ?? entry?.badge ?? 0;
      return b > peak ? b : peak;
    }, currentBadge || 0);

    const currentRank = currentBadge != null ? getRankInfo(Number(currentBadge)) : null;
    const peakRank = peakBadge != null && peakBadge !== currentBadge ? getRankInfo(Number(peakBadge)) : null;

    // ── Career totals: prefer account-stats, fall back to aggregating hero-stats.
    const aggregatedMatches = heroStats.reduce((sum, h) => sum + Number(h.matches_played ?? h.matches ?? 0), 0);
    const aggregatedWins = heroStats.reduce((sum, h) => sum + Number(h.wins ?? 0), 0);
    const totalMatches = Number(accountStats?.matches_played ?? accountStats?.matches ?? aggregatedMatches ?? 0);
    const totalWins = Number(accountStats?.wins ?? aggregatedWins ?? 0);
    const winrate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 1000) / 10 : 0;

    // ── Recent form: last 20 from match-history.
    const recent = Array.isArray(matches) ? matches.slice(0, 20) : [];
    const recentWins = recent.reduce((n, m) => {
      const won =
        m.player_team_won === true ||
        m.won === true ||
        (m.match_result != null && m.player_team != null && Number(m.match_result) === Number(m.player_team));
      return won ? n + 1 : n;
    }, 0);
    const recentWinrate = recent.length > 0 ? Math.round((recentWins / recent.length) * 1000) / 10 : null;

    // ── Top heroes (by matches played, with winrate + KDA).
    const topHeroes = [...heroStats]
      .sort((a, b) => Number(b.matches_played ?? b.matches ?? 0) - Number(a.matches_played ?? a.matches ?? 0))
      .slice(0, 5)
      .map((h) => {
        const heroId = Number(h.hero_id ?? h.heroId ?? 0);
        const played = Number(h.matches_played ?? h.matches ?? 0);
        const wins = Number(h.wins ?? 0);
        const hwr = played > 0 ? Math.round((wins / played) * 1000) / 10 : 0;
        const kills = Number(h.kills ?? h.avg_kills ?? 0);
        const deaths = Number(h.deaths ?? h.avg_deaths ?? 0);
        const assists = Number(h.assists ?? h.avg_assists ?? 0);
        const avgKda =
          played > 0 && deaths > 0
            ? Math.round(((kills + assists) / deaths) * 100) / 100
            : kills + assists;
        const heroData = getHeroData(heroId) || {};
        return {
          heroId,
          heroName: heroData.name || getHeroName(heroId) || 'Unknown',
          heroImage: heroData.image || heroData.image_webp || null,
          matchesPlayed: played,
          wins,
          winrate: hwr,
          avgKda,
        };
      });

    res.json({
      accountId: Number(accountId),
      rank: {
        current: currentRank,
        peak: peakRank,
        currentBadge,
        peakBadge,
      },
      stats: {
        matchesPlayed: totalMatches,
        wins: totalWins,
        winrate,
        recentMatches: recent.length,
        recentWinrate,
      },
      topHeroes,
      card: card && Object.keys(card).length > 0 ? card : null,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    logger.error(`Player profile failed for ${accountId}: ${err.message}`);
    res.status(500).json({ error: err.message || 'Failed to build player profile.' });
  }
}

module.exports = { resolvePlayer, getPlayerMatches, getPlayerMmrHistory, getPlayerProfile };
