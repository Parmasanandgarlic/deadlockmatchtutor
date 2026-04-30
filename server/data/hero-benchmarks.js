/**
 * Deadlock Hero Benchmarks — Community Tier Data (Apr 2026)
 *
 * Source: Deadlock community analytics (all-rank aggregate).
 * Used for:
 *   - Tier list generation when API data is unavailable
 *   - Benchmark comparisons in the insights engine
 *   - Role-aware scoring calibration
 *   - Dynamic percentile benchmarks (KDA, NW/min)
 *
 * Fields:
 *   winRate  — community win rate (%)
 *   pickRate — pick rate (%)
 *   avgCsm  — average creep score per minute
 *   avgDenies — average denies per game
 *   avgNwm  — average net worth per minute (souls)
 *   avgKda  — average KDA ratio
 */

const HERO_BENCHMARKS = {
  2:  { name: 'Seven',        winRate: 55.6, pickRate: 41.6, avgCsm: 6.5, avgDenies: 3.4, avgNwm: 1245.9, avgKda: 2.7 },
  11: { name: 'Dynamo',       winRate: 55.3, pickRate: 51.9, avgCsm: 4.6, avgDenies: 3.3, avgNwm: 1097.5, avgKda: 3.4 },
  1:  { name: 'Infernus',     winRate: 54.0, pickRate: 51.9, avgCsm: 5.6, avgDenies: 3.6, avgNwm: 1196.3, avgKda: 2.9 },
  12: { name: 'Kelvin',       winRate: 53.7, pickRate: 27.9, avgCsm: 4.2, avgDenies: 3.3, avgNwm: 1088.0, avgKda: 3.5 },
  20: { name: 'Ivy',          winRate: 52.6, pickRate: 33.6, avgCsm: 4.8, avgDenies: 4.5, avgNwm: 1101.9, avgKda: 3.5 },
  58: { name: 'Vyper',        winRate: 52.5, pickRate: 23.1, avgCsm: 5.0, avgDenies: 3.9, avgNwm: 1182.2, avgKda: 2.6 },
  8:  { name: 'McGinnis',     winRate: 51.9, pickRate: 17.3, avgCsm: 5.0, avgDenies: 8.6, avgNwm: 1113.4, avgKda: 2.9 },
  13: { name: 'Haze',         winRate: 51.6, pickRate: 44.2, avgCsm: 5.6, avgDenies: 4.2, avgNwm: 1210.7, avgKda: 2.7 },
  25: { name: 'Warden',       winRate: 51.5, pickRate: 27.2, avgCsm: 5.3, avgDenies: 3.2, avgNwm: 1172.1, avgKda: 2.8 },
  7:  { name: 'Wraith',       winRate: 51.5, pickRate: 35.5, avgCsm: 5.9, avgDenies: 4.8, avgNwm: 1245.8, avgKda: 3.0 },
  66: { name: 'Victor',       winRate: 51.1, pickRate: 19.9, avgCsm: 5.5, avgDenies: 3.3, avgNwm: 1196.5, avgKda: 2.7 },
  6:  { name: 'Abrams',       winRate: 50.8, pickRate: 29.8, avgCsm: 4.5, avgDenies: 3.5, avgNwm: 1094.5, avgKda: 2.7 },
  77: { name: 'Apollo',       winRate: 50.8, pickRate: 32.4, avgCsm: 4.5, avgDenies: 2.2, avgNwm: 1104.0, avgKda: 3.3 },
  69: { name: 'Doorman',      winRate: 50.8, pickRate: 32.6, avgCsm: 4.5, avgDenies: 2.7, avgNwm: 1099.5, avgKda: 3.7 },
  64: { name: 'Drifter',      winRate: 50.7, pickRate: 39.0, avgCsm: 4.3, avgDenies: 2.7, avgNwm: 1123.3, avgKda: 2.7 },
  4:  { name: 'Lady Geist',   winRate: 50.6, pickRate: 31.5, avgCsm: 5.3, avgDenies: 3.1, avgNwm: 1151.8, avgKda: 2.8 },
  67: { name: 'Paige',        winRate: 50.1, pickRate: 34.4, avgCsm: 4.4, avgDenies: 2.4, avgNwm: 1058.6, avgKda: 3.3 },
  76: { name: 'Graves',       winRate: 49.6, pickRate: 32.0, avgCsm: 5.5, avgDenies: 5.6, avgNwm: 1148.2, avgKda: 2.2 },
  31: { name: 'Lash',         winRate: 49.6, pickRate: 48.4, avgCsm: 4.2, avgDenies: 3.2, avgNwm: 1091.4, avgKda: 3.5 },
  18: { name: 'Mo & Krill',   winRate: 49.5, pickRate: 27.2, avgCsm: 4.3, avgDenies: 3.1, avgNwm: 1094.3, avgKda: 3.0 },
  52: { name: 'Mirage',       winRate: 49.5, pickRate: 25.8, avgCsm: 4.7, avgDenies: 3.8, avgNwm: 1145.9, avgKda: 3.3 },
  16: { name: 'Calico',       winRate: 49.4, pickRate: 18.9, avgCsm: 4.0, avgDenies: 3.3, avgNwm: 1135.5, avgKda: 3.3 },
  63: { name: 'Mina',         winRate: 49.4, pickRate: 42.2, avgCsm: 5.2, avgDenies: 3.0, avgNwm: 1151.0, avgKda: 3.2 },
  80: { name: 'Silver',       winRate: 49.3, pickRate: 29.7, avgCsm: 4.3, avgDenies: 2.9, avgNwm: 1087.4, avgKda: 2.9 },
  3:  { name: 'Vindicta',     winRate: 49.1, pickRate: 27.2, avgCsm: 4.2, avgDenies: 3.8, avgNwm: 1092.3, avgKda: 3.3 },
  27: { name: 'Yamato',       winRate: 48.9, pickRate: 26.5, avgCsm: 4.4, avgDenies: 2.3, avgNwm: 1111.8, avgKda: 2.6 },
  50: { name: 'Pocket',       winRate: 48.6, pickRate: 24.0, avgCsm: 5.0, avgDenies: 3.2, avgNwm: 1148.5, avgKda: 2.8 },
  72: { name: 'Billy',        winRate: 48.4, pickRate: 24.4, avgCsm: 4.5, avgDenies: 3.4, avgNwm: 1097.9, avgKda: 2.4 },
  10: { name: 'Paradox',      winRate: 47.5, pickRate: 26.9, avgCsm: 4.8, avgDenies: 4.0, avgNwm: 1108.0, avgKda: 2.9 },
  65: { name: 'Venator',      winRate: 47.4, pickRate: 44.4, avgCsm: 5.4, avgDenies: 3.7, avgNwm: 1181.2, avgKda: 2.6 },
  19: { name: 'Shiv',         winRate: 46.9, pickRate: 38.3, avgCsm: 4.0, avgDenies: 3.4, avgNwm: 1084.3, avgKda: 2.7 },
  81: { name: 'Celeste',      winRate: 46.8, pickRate: 22.8, avgCsm: 4.6, avgDenies: 2.8, avgNwm: 1106.2, avgKda: 2.8 },
  60: { name: 'Sinclair',     winRate: 46.5, pickRate: 15.5, avgCsm: 4.3, avgDenies: 2.7, avgNwm: 1073.8, avgKda: 2.9 },
  14: { name: 'Holliday',     winRate: 46.5, pickRate: 21.7, avgCsm: 4.6, avgDenies: 2.6, avgNwm: 1104.2, avgKda: 3.3 },
  17: { name: 'Grey Talon',   winRate: 46.2, pickRate: 21.4, avgCsm: 4.5, avgDenies: 3.2, avgNwm: 1105.0, avgKda: 3.7 },
  15: { name: 'Bebop',        winRate: 46.0, pickRate: 48.0, avgCsm: 4.3, avgDenies: 4.0, avgNwm: 1072.6, avgKda: 2.6 },
  79: { name: 'Rem',          winRate: 45.8, pickRate: 43.3, avgCsm: 4.2, avgDenies: 2.7, avgNwm: 1111.3, avgKda: 3.2 },
  35: { name: 'Viscous',      winRate: 45.8, pickRate: 17.3, avgCsm: 4.9, avgDenies: 3.5, avgNwm: 1078.8, avgKda: 3.2 },
};

/**
 * Get benchmark data for a specific hero.
 * @param {number} heroId
 * @returns {Object|null} Benchmark data or null
 */
function getHeroBenchmark(heroId) {
  if (heroId == null) return null;
  return HERO_BENCHMARKS[heroId] || HERO_BENCHMARKS[String(heroId)] || null;
}

/**
 * Get the community average KDA for a hero (used as fallback in insights).
 * @param {number} heroId
 * @returns {number} Average KDA, or 2.8 (global median) if unknown
 */
function getCommunityAvgKda(heroId) {
  const bm = getHeroBenchmark(heroId);
  return bm ? bm.avgKda : 2.8;
}

/**
 * Get the community average NW/min for a hero (used as fallback in insights).
 * @param {number} heroId
 * @returns {number} Average NW/min, or 1120 (global median) if unknown
 */
function getCommunityAvgNwm(heroId) {
  const bm = getHeroBenchmark(heroId);
  return bm ? bm.avgNwm : 1120;
}

/**
 * Dynamic Percentile Benchmarks
 *
 * Instead of using static global thresholds (e.g. "700 SPM = good for everyone"),
 * this derives hero-specific percentile tiers from the community data.
 *
 * Percentile model: The community average is the p50 (median). We model a
 * normal distribution around it with a coefficient of variation (CV) to
 * derive p25, p75, and p90 tiers.
 *
 *   p25 = avg * (1 - CV)        — bottom quartile
 *   p50 = avg                   — median
 *   p75 = avg * (1 + CV)        — top quartile
 *   p90 = avg * (1 + CV * 1.6)  — elite
 *
 * CV values calibrated from leaderboard data (Dec 2025):
 *   - KDA has higher variance (CV = 0.35): a 3.0 avg hero spans 1.95–4.68
 *   - NW/min has lower variance (CV = 0.20): a 1100 avg hero spans 880–1452
 */
const KDA_CV = 0.35;
const NWM_CV = 0.20;

/**
 * Get hero-specific percentile tiers for KDA and NW/min.
 * @param {number} heroId
 * @returns {Object} { kda: { p25, p50, p75, p90 }, nwm: { p25, p50, p75, p90 } }
 */
function getHeroPercentiles(heroId) {
  const bm = getHeroBenchmark(heroId);
  const avgKda = bm ? bm.avgKda : 2.8;
  const avgNwm = bm ? bm.avgNwm : 1120;

  return {
    kda: {
      p25: Math.round(avgKda * (1 - KDA_CV) * 100) / 100,
      p50: avgKda,
      p75: Math.round(avgKda * (1 + KDA_CV) * 100) / 100,
      p90: Math.round(avgKda * (1 + KDA_CV * 1.6) * 100) / 100,
    },
    nwm: {
      p25: Math.round(avgNwm * (1 - NWM_CV)),
      p50: Math.round(avgNwm),
      p75: Math.round(avgNwm * (1 + NWM_CV)),
      p90: Math.round(avgNwm * (1 + NWM_CV * 1.6)),
    },
  };
}

/**
 * Compute what percentile a player's value falls into for a given hero.
 * Returns a score 0–100 representing the estimated percentile.
 *
 * @param {number} heroId    - The hero being played
 * @param {'kda'|'nwm'} stat - Which stat to compare
 * @param {number} value     - The player's actual value
 * @returns {number}         - Estimated percentile (0–100)
 */
function getPlayerPercentile(heroId, stat, value) {
  const percentiles = getHeroPercentiles(heroId);
  const tiers = percentiles[stat];
  if (!tiers) return 50;

  if (value <= tiers.p25) return Math.round(25 * (value / tiers.p25));
  if (value <= tiers.p50) return Math.round(25 + 25 * ((value - tiers.p25) / (tiers.p50 - tiers.p25)));
  if (value <= tiers.p75) return Math.round(50 + 25 * ((value - tiers.p50) / (tiers.p75 - tiers.p50)));
  if (value <= tiers.p90) return Math.round(75 + 15 * ((value - tiers.p75) / (tiers.p90 - tiers.p75)));
  return Math.min(100, Math.round(90 + 10 * ((value - tiers.p90) / (tiers.p90 * 0.2))));
}

module.exports = {
  HERO_BENCHMARKS,
  getHeroBenchmark,
  getCommunityAvgKda,
  getCommunityAvgNwm,
  getHeroPercentiles,
  getPlayerPercentile,
};
