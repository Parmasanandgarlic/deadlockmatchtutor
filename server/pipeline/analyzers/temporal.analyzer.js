const { safeDivide, clamp } = require('../../utils/helpers');

/**
 * Temporal Tracking Analyzer.
 *
 * Computes performance trends across the player's recent match history
 * (not just the current match). Produces:
 *   - recentForm:       KDA / SPM / winRate across the last N matches
 *   - trendSlope:       linear regression slope of KDA over time
 *   - streak:           current W/L streak length (+positive, -negative)
 *   - heatmap:          per-match mini stats for sparkline rendering
 *   - comparisonVsAvg:  how THIS match compares to the recent rolling baseline
 */

const DEFAULT_WINDOW = 20;

function extractMatchStats(m) {
  if (!m) return null;
  const duration = Number(m.match_duration_s ?? m.duration_s ?? 0);
  const durationMin = duration > 0 ? duration / 60 : 0;
  const kills = Number(m.player_kills ?? m.kills ?? 0);
  const deaths = Number(m.player_deaths ?? m.deaths ?? 0);
  const assists = Number(m.player_assists ?? m.assists ?? 0);
  const netWorth = Number(m.net_worth ?? m.netWorth ?? 0);
  const kda = deaths > 0 ? (kills + assists) / deaths : kills + assists;
  const spm = durationMin > 0 ? netWorth / durationMin : 0;
  let won = null;
  if (typeof m.player_team_won === 'boolean') won = m.player_team_won;
  else if (typeof m.won === 'boolean') won = m.won;
  else if (m.match_result != null && m.player_team != null) {
    won = Number(m.match_result) === Number(m.player_team);
  }
  return {
    matchId: m.match_id ?? m.matchId ?? null,
    heroId: m.hero_id ?? m.heroId ?? null,
    startTime: m.start_time ?? m.match_start_time ?? null,
    durationMin: Math.round(durationMin),
    kills, deaths, assists, kda: Number(kda.toFixed(2)),
    soulsPerMin: Math.round(spm),
    won,
  };
}

function linearRegressionSlope(values) {
  const n = values.length;
  if (n < 2) return 0;
  const xs = values.map((_, i) => i);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = values.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let denom = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (values[i] - meanY);
    denom += (xs[i] - meanX) ** 2;
  }
  return denom === 0 ? 0 : num / denom;
}

function computeStreak(sorted) {
  // sorted is oldest → newest; streak = longest run of same result at the end.
  let streak = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    const won = sorted[i].won;
    if (won == null) break;
    if (streak === 0) streak = won ? 1 : -1;
    else if (won && streak > 0) streak += 1;
    else if (!won && streak < 0) streak -= 1;
    else break;
  }
  return streak;
}

/**
 * @param {Object} params
 * @param {Array}  params.matchHistory   Player's match history (oldest or newest first; we sort)
 * @param {Object} params.matchInHistory The current match's row (used for "vs average")
 * @param {number} [params.window]       How many matches to include (default 20)
 */
function analyzeTemporal({ matchHistory = [], matchInHistory = null, window = DEFAULT_WINDOW } = {}) {
  const parsed = (matchHistory || [])
    .map(extractMatchStats)
    .filter(Boolean)
    .filter((m) => m.durationMin >= 8); // ignore very short / abandoned games

  // Sort oldest → newest by startTime if available
  parsed.sort((a, b) => (a.startTime || 0) - (b.startTime || 0));

  const windowed = parsed.slice(-window);
  if (windowed.length === 0) {
    return {
      score: 50,
      sampleSize: 0,
      recentForm: null,
      trendSlope: 0,
      streak: 0,
      heatmap: [],
      comparisonVsAvg: null,
      summary: 'Not enough recent match data to compute a temporal trend yet.',
    };
  }

  const n = windowed.length;
  const sum = (key) => windowed.reduce((acc, m) => acc + (Number(m[key]) || 0), 0);
  const wins = windowed.filter((m) => m.won === true).length;
  const losses = windowed.filter((m) => m.won === false).length;
  const decided = wins + losses;
  const avgKda = Number((sum('kda') / n).toFixed(2));
  const avgSpm = Math.round(sum('soulsPerMin') / n);
  const avgKills = Number((sum('kills') / n).toFixed(1));
  const avgDeaths = Number((sum('deaths') / n).toFixed(1));
  const avgAssists = Number((sum('assists') / n).toFixed(1));
  const winRate = decided > 0 ? Math.round((wins / decided) * 1000) / 10 : null;

  const kdaSlope = Number(linearRegressionSlope(windowed.map((m) => m.kda)).toFixed(3));
  const spmSlope = Math.round(linearRegressionSlope(windowed.map((m) => m.soulsPerMin)));
  const streak = computeStreak(windowed);

  // Compare current match vs rolling average
  const current = extractMatchStats(matchInHistory);
  let comparisonVsAvg = null;
  if (current) {
    comparisonVsAvg = {
      kdaDelta: Number((current.kda - avgKda).toFixed(2)),
      spmDelta: current.soulsPerMin - avgSpm,
      killsDelta: Number((current.kills - avgKills).toFixed(1)),
      deathsDelta: Number((current.deaths - avgDeaths).toFixed(1)),
    };
  }

  // Score: reward positive trend + high recent win rate
  let score = 50;
  if (kdaSlope > 0) score += clamp(kdaSlope * 60, 0, 25);
  if (kdaSlope < 0) score += clamp(kdaSlope * 60, -25, 0);
  if (winRate != null) score += (winRate - 50) * 0.4; // -20 … +20
  score = Math.round(clamp(score, 0, 100));

  let trendLabel = 'stable';
  if (kdaSlope > 0.03) trendLabel = 'improving';
  else if (kdaSlope < -0.03) trendLabel = 'declining';

  return {
    score,
    sampleSize: n,
    window,
    recentForm: {
      avgKda,
      avgSoulsPerMin: avgSpm,
      avgKills,
      avgDeaths,
      avgAssists,
      winRate,
      wins,
      losses,
    },
    trendSlope: kdaSlope,
    spmSlope,
    trendLabel,
    streak,
    heatmap: windowed.map((m) => ({
      matchId: m.matchId,
      heroId: m.heroId,
      startTime: m.startTime,
      kda: m.kda,
      soulsPerMin: m.soulsPerMin,
      won: m.won,
    })),
    comparisonVsAvg,
    summary:
      trendLabel === 'improving'
        ? `Your KDA has been trending UP across your last ${n} matches.`
        : trendLabel === 'declining'
        ? `Your KDA has been trending DOWN across your last ${n} matches.`
        : `Your form is steady across your last ${n} matches.`,
  };
}

module.exports = { analyzeTemporal };
