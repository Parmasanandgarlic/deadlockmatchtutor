/**
 * Deadlock Hero Benchmarks — Community Tier Data (May 2026)
 *
 * Source: Mobalytics community analytics (all-rank aggregate).
 * Used for:
 *   - Tier list generation when API data is unavailable
 *   - Benchmark comparisons in the insights engine
 *   - Role-aware scoring calibration
 *   - Dynamic percentile benchmarks (KDA, NW/min)
 *
 * Fields:
 *   winRate  — community win rate (%)
 *   pickRate — pick rate (%)
 *   avgCsm  — average kills per game
 *   avgDenies — average deaths per game
 *   avgNwm  — average net worth (souls)
 *   avgKda  — average KDA ratio
 */

const HERO_BENCHMARKS = {
  2:  { name: 'Seven',        winRate: 55.7, pickRate: 41.4, avgCsm: 6.5, avgDenies: 3.4, avgNwm: 1247.6, avgKda: 2.7 },
  11: { name: 'Dynamo',       winRate: 55.2, pickRate: 51.3, avgCsm: 4.6, avgDenies: 3.3, avgNwm: 1099.5, avgKda: 3.4 },
  12: { name: 'Kelvin',       winRate: 53.9, pickRate: 28.1, avgCsm: 4.2, avgDenies: 3.3, avgNwm: 1093.0, avgKda: 3.5 },
  1:  { name: 'Infernus',     winRate: 53.5, pickRate: 50.4, avgCsm: 5.6, avgDenies: 3.6, avgNwm: 1193.9, avgKda: 2.9 },
  20: { name: 'Ivy',          winRate: 52.7, pickRate: 33.5, avgCsm: 4.8, avgDenies: 4.5, avgNwm: 1104.0, avgKda: 3.5 },
  58: { name: 'Vyper',        winRate: 52.4, pickRate: 22.4, avgCsm: 5.0, avgDenies: 3.9, avgNwm: 1182.3, avgKda: 2.6 },
  8:  { name: 'McGinnis',     winRate: 52.4, pickRate: 17.6, avgCsm: 5.0, avgDenies: 8.6, avgNwm: 1116.9, avgKda: 3.0 },
  66: { name: 'Victor',       winRate: 51.9, pickRate: 20.8, avgCsm: 5.5, avgDenies: 3.3, avgNwm: 1201.2, avgKda: 2.8 },
  25: { name: 'Warden',       winRate: 51.7, pickRate: 27.7, avgCsm: 5.3, avgDenies: 3.2, avgNwm: 1175.4, avgKda: 2.8 },
  7:  { name: 'Wraith',       winRate: 51.5, pickRate: 35.6, avgCsm: 5.9, avgDenies: 4.8, avgNwm: 1247.9, avgKda: 3.0 },
  13: { name: 'Haze',         winRate: 51.4, pickRate: 43.7, avgCsm: 5.6, avgDenies: 4.2, avgNwm: 1211.2, avgKda: 2.7 },
  4:  { name: 'Lady Geist',   winRate: 50.8, pickRate: 30.7, avgCsm: 5.3, avgDenies: 3.1, avgNwm: 1153.9, avgKda: 2.8 },
  77: { name: 'Apollo',       winRate: 50.7, pickRate: 32.0, avgCsm: 4.5, avgDenies: 2.2, avgNwm: 1106.4, avgKda: 3.3 },
  69: { name: 'The Doorman',  winRate: 50.7, pickRate: 33.0, avgCsm: 4.5, avgDenies: 2.7, avgNwm: 1102.8, avgKda: 3.7 },
  64: { name: 'Drifter',      winRate: 50.7, pickRate: 39.9, avgCsm: 4.3, avgDenies: 2.7, avgNwm: 1127.0, avgKda: 2.7 },
  6:  { name: 'Abrams',       winRate: 50.6, pickRate: 29.6, avgCsm: 4.5, avgDenies: 3.5, avgNwm: 1095.7, avgKda: 2.7 },
  67: { name: 'Paige',        winRate: 50.1, pickRate: 34.9, avgCsm: 4.4, avgDenies: 2.4, avgNwm: 1062.6, avgKda: 3.3 },
  63: { name: 'Mina',         winRate: 49.6, pickRate: 43.5, avgCsm: 5.2, avgDenies: 3.0, avgNwm: 1153.5, avgKda: 3.2 },
  31: { name: 'Lash',         winRate: 49.6, pickRate: 48.5, avgCsm: 4.2, avgDenies: 3.2, avgNwm: 1094.7, avgKda: 3.5 },
  76: { name: 'Graves',       winRate: 49.6, pickRate: 31.1, avgCsm: 5.5, avgDenies: 5.6, avgNwm: 1148.8, avgKda: 2.2 },
  18: { name: 'Mo & Krill',   winRate: 49.6, pickRate: 27.4, avgCsm: 4.3, avgDenies: 3.1, avgNwm: 1099.3, avgKda: 3.0 },
  80: { name: 'Silver',       winRate: 49.5, pickRate: 30.0, avgCsm: 4.3, avgDenies: 2.9, avgNwm: 1089.4, avgKda: 2.9 },
  16: { name: 'Calico',       winRate: 49.4, pickRate: 19.1, avgCsm: 4.0, avgDenies: 3.3, avgNwm: 1141.6, avgKda: 3.3 },
  52: { name: 'Mirage',       winRate: 49.2, pickRate: 24.9, avgCsm: 4.7, avgDenies: 3.8, avgNwm: 1145.7, avgKda: 3.3 },
  27: { name: 'Yamato',       winRate: 49.1, pickRate: 26.3, avgCsm: 4.4, avgDenies: 2.3, avgNwm: 1115.7, avgKda: 2.7 },
  3:  { name: 'Vindicta',     winRate: 49.1, pickRate: 27.4, avgCsm: 4.2, avgDenies: 3.8, avgNwm: 1096.0, avgKda: 3.3 },
  50: { name: 'Pocket',       winRate: 48.7, pickRate: 23.8, avgCsm: 5.1, avgDenies: 3.2, avgNwm: 1153.2, avgKda: 2.8 },
  72: { name: 'Billy',        winRate: 48.2, pickRate: 24.4, avgCsm: 4.5, avgDenies: 3.4, avgNwm: 1099.1, avgKda: 2.4 },
  10: { name: 'Paradox',      winRate: 47.6, pickRate: 27.8, avgCsm: 4.8, avgDenies: 4.0, avgNwm: 1113.0, avgKda: 2.9 },
  65: { name: 'Venator',      winRate: 47.3, pickRate: 43.7, avgCsm: 5.4, avgDenies: 3.7, avgNwm: 1180.3, avgKda: 2.6 },
  81: { name: 'Celeste',      winRate: 47.2, pickRate: 23.3, avgCsm: 4.6, avgDenies: 2.8, avgNwm: 1111.7, avgKda: 2.8 },
  19: { name: 'Shiv',         winRate: 46.9, pickRate: 38.2, avgCsm: 4.0, avgDenies: 3.4, avgNwm: 1085.9, avgKda: 2.7 },
  60: { name: 'Sinclair',     winRate: 46.5, pickRate: 16.0, avgCsm: 4.2, avgDenies: 2.7, avgNwm: 1078.0, avgKda: 2.9 },
  14: { name: 'Holliday',     winRate: 46.5, pickRate: 22.0, avgCsm: 4.6, avgDenies: 2.6, avgNwm: 1108.0, avgKda: 3.4 },
  17: { name: 'Grey Talon',   winRate: 46.3, pickRate: 21.8, avgCsm: 4.5, avgDenies: 3.2, avgNwm: 1107.3, avgKda: 3.7 },
  35: { name: 'Viscous',      winRate: 45.9, pickRate: 17.5, avgCsm: 4.9, avgDenies: 3.5, avgNwm: 1081.3, avgKda: 3.2 },
  15: { name: 'Bebop',        winRate: 45.8, pickRate: 48.1, avgCsm: 4.2, avgDenies: 4.0, avgNwm: 1075.3, avgKda: 2.6 },
  79: { name: 'Rem',          winRate: 45.8, pickRate: 42.6, avgCsm: 4.2, avgDenies: 2.7, avgNwm: 1112.4, avgKda: 3.2 },
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
