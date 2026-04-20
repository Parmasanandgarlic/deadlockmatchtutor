const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');
const redisClient = require('./redis.service');
const { getRankInfo } = require('../utils/ranks');

/**
 * MMR History Service
 *
 * Builds a longitudinal MMR / rank-prediction timeline for a given player by
 * combining the Deadlock API's rank-predict endpoint (which can return either
 * a per-match array or an aggregate object) with the player's match history.
 *
 * Output shape:
 *   {
 *     current: { badge, tier, subtier, rank, name, imageUrl },
 *     peak:    { badge, tier, ... },
 *     trend:   'climbing' | 'declining' | 'stable',
 *     delta30: +N / -N (tier units over ~30 recent matches),
 *     history: [ { matchId, startTime, badge, tier, subtier, delta } ... ],
 *   }
 */

function toRankBadge(entry) {
  if (entry == null) return null;
  return entry.rank ?? entry.predicted_rank ?? entry.badge ?? entry.rank_tier ?? null;
}

function normalizeRankPredictArray(rankPredict) {
  if (Array.isArray(rankPredict)) return rankPredict;
  if (Array.isArray(rankPredict?.history)) return rankPredict.history;
  if (Array.isArray(rankPredict?.matches)) return rankPredict.matches;
  if (rankPredict && typeof rankPredict === 'object') return [rankPredict];
  return [];
}

/**
 * Build a full MMR history timeline from rankPredict + matchHistory.
 * rankPredict entries are matched by match_id when possible, otherwise by order.
 */
function buildMmrHistory(rankPredict, matchHistory = []) {
  const entries = normalizeRankPredictArray(rankPredict);
  if (entries.length === 0) {
    return {
      current: null,
      peak: null,
      trend: 'unknown',
      delta30: 0,
      history: [],
    };
  }

  // Index match history by id for quick lookup.
  const matchesById = new Map();
  for (const m of matchHistory || []) {
    const id = m?.match_id ?? m?.matchId;
    if (id != null) matchesById.set(Number(id), m);
  }

  // Sort entries chronologically (oldest first) if we can find a timestamp.
  const enriched = entries
    .map((e) => {
      const matchId = e?.match_id ?? e?.matchId ?? null;
      const matchRef = matchId != null ? matchesById.get(Number(matchId)) : null;
      const startTime =
        e?.start_time ?? e?.match_start_time ?? matchRef?.start_time ?? null;
      const badge = toRankBadge(e);
      return { matchId, startTime, badge, raw: e };
    })
    .filter((e) => e.badge != null)
    .sort((a, b) => {
      if (a.startTime && b.startTime) return Number(a.startTime) - Number(b.startTime);
      return 0;
    });

  if (enriched.length === 0) {
    // Fallback: treat as aggregate-only
    const badge = toRankBadge(entries[0]);
    const info = getRankInfo(badge);
    return {
      current: { badge, ...info },
      peak: { badge, ...info },
      trend: 'unknown',
      delta30: 0,
      history: [],
    };
  }

  // Build history with deltas
  let prevBadge = null;
  const history = enriched.map((e) => {
    const info = getRankInfo(e.badge);
    const delta = prevBadge != null ? e.badge - prevBadge : 0;
    prevBadge = e.badge;
    return {
      matchId: e.matchId,
      startTime: e.startTime,
      badge: e.badge,
      tier: info.tier,
      subtier: info.subtier,
      name: info.name,
      imageUrl: info.imageUrl,
      delta,
    };
  });

  const current = history[history.length - 1];
  const first = history[0];
  const peak = history.reduce((best, h) => (h.badge > (best?.badge ?? -Infinity) ? h : best), null);

  // Trend: last 10 vs previous 10 average
  const last10 = history.slice(-10);
  const prev10 = history.slice(-20, -10);
  const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b.badge, 0) / xs.length : 0);
  const last10Avg = avg(last10);
  const prev10Avg = avg(prev10);
  let trend = 'stable';
  if (last10.length >= 3 && prev10.length >= 3) {
    if (last10Avg - prev10Avg > 0.5) trend = 'climbing';
    else if (last10Avg - prev10Avg < -0.5) trend = 'declining';
  }

  const delta30 = current.badge - first.badge;

  return {
    current,
    peak,
    trend,
    delta30,
    history,
  };
}

/**
 * Fetch the Deadlock API rank-predict endpoint; supports both object and array
 * shapes depending on endpoint version. Uses Redis caching (10 min TTL).
 */
async function fetchRankPredictRaw(accountId) {
  const cacheKey = `mmr:${accountId}`;
  const cached = await redisClient.get(cacheKey).catch(() => null);
  if (cached) return cached;

  try {
    const url = `${config.deadlockApi.baseUrl}/v1/players/${Number(accountId)}/mmr-history`;
    const { data } = await axios.get(url, { timeout: 15000 });
    if (data) {
      await redisClient.set(cacheKey, data, 600).catch(() => {});
      return data;
    }
  } catch (err) {
    logger.warn(`[MMR] mmr-history endpoint failed for ${accountId}: ${err.message}`);
  }

  // Fallback to /rank-predict
  try {
    const url = `${config.deadlockApi.baseUrl}/v1/players/${Number(accountId)}/rank-predict`;
    const { data } = await axios.get(url, { timeout: 15000 });
    if (data) {
      await redisClient.set(cacheKey, data, 600).catch(() => {});
      return data;
    }
  } catch (err) {
    logger.warn(`[MMR] rank-predict fallback failed for ${accountId}: ${err.message}`);
  }
  return null;
}

module.exports = {
  buildMmrHistory,
  fetchRankPredictRaw,
  normalizeRankPredictArray,
};
