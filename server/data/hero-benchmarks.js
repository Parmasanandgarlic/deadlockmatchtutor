/**
 * Deadlock Hero Benchmarks — Community Tier Data (May 2026, Week 4)
 *
 * Source: Mobalytics community analytics (all-rank aggregate, 7-day window).
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
 *
 * Last updated: 2026-05-25
 * Data is refreshed weekly from community analytics.
 */

const HERO_BENCHMARKS = {
  2  : { name: 'Seven',          winRate: 55.6, pickRate: 43.9, avgCsm: 6.6, avgDenies: 3.4, avgNwm: 1263.5, avgKda: 2.8 },
  66 : { name: 'Victor',         winRate: 55.6, pickRate: 42.0, avgCsm: 5.5, avgDenies: 3.2, avgNwm: 1213.4, avgKda: 2.8 },
  8  : { name: 'McGinnis',       winRate: 55.6, pickRate: 22.6, avgCsm: 4.9, avgDenies: 8.1, avgNwm: 1136.8, avgKda: 3.3 },
  12 : { name: 'Kelvin',         winRate: 53.6, pickRate: 23.8, avgCsm: 4.2, avgDenies: 3.2, avgNwm: 1139.0, avgKda: 3.6 },
  76 : { name: 'Graves',         winRate: 53.5, pickRate: 29.4, avgCsm: 5.4, avgDenies: 5.4, avgNwm: 1170.6, avgKda: 2.4 },
  69 : { name: 'Doorman',        winRate: 53.2, pickRate: 27.1, avgCsm: 4.6, avgDenies: 2.7, avgNwm: 1135.7, avgKda: 3.8 },
  11 : { name: 'Dynamo',         winRate: 53.0, pickRate: 33.2, avgCsm: 4.5, avgDenies: 3.3, avgNwm: 1129.8, avgKda: 3.5 },
  20 : { name: 'Ivy',            winRate: 52.4, pickRate: 27.3, avgCsm: 4.7, avgDenies: 4.6, avgNwm: 1126.2, avgKda: 3.5 },
  13 : { name: 'Haze',           winRate: 51.8, pickRate: 49.0, avgCsm: 5.3, avgDenies: 4.0, avgNwm: 1214.2, avgKda: 2.8 },
  27 : { name: 'Yamato',         winRate: 51.7, pickRate: 35.5, avgCsm: 4.2, avgDenies: 2.2, avgNwm: 1150.9, avgKda: 2.8 },
  25 : { name: 'Warden',         winRate: 51.3, pickRate: 37.3, avgCsm: 5.4, avgDenies: 3.2, avgNwm: 1191.7, avgKda: 2.9 },
  18 : { name: 'Mo And Krill',   winRate: 51.1, pickRate: 28.1, avgCsm: 4.3, avgDenies: 2.9, avgNwm: 1154.2, avgKda: 3.2 },
  31 : { name: 'Lash',           winRate: 50.7, pickRate: 48.8, avgCsm: 4.1, avgDenies: 3.1, avgNwm: 1123.7, avgKda: 3.4 },
  16 : { name: 'Calico',         winRate: 50.6, pickRate: 20.6, avgCsm: 3.7, avgDenies: 3.0, avgNwm: 1185.9, avgKda: 3.4 },
  64 : { name: 'Drifter',        winRate: 50.6, pickRate: 40.1, avgCsm: 4.2, avgDenies: 2.6, avgNwm: 1159.2, avgKda: 2.8 },
  58 : { name: 'Vyper',          winRate: 50.4, pickRate: 18.0, avgCsm: 5.0, avgDenies: 4.0, avgNwm: 1189.9, avgKda: 2.5 },
  6  : { name: 'Abrams',         winRate: 50.3, pickRate: 28.5, avgCsm: 4.4, avgDenies: 3.5, avgNwm: 1109.3, avgKda: 2.7 },
  4  : { name: 'Lady Geist',     winRate: 50.3, pickRate: 29.5, avgCsm: 5.3, avgDenies: 3.0, avgNwm: 1173.4, avgKda: 2.8 },
  63 : { name: 'Mina',           winRate: 50.0, pickRate: 47.2, avgCsm: 5.2, avgDenies: 2.9, avgNwm: 1161.9, avgKda: 3.2 },
  77 : { name: 'Apollo',         winRate: 49.9, pickRate: 29.6, avgCsm: 4.4, avgDenies: 2.1, avgNwm: 1127.3, avgKda: 3.1 },
  67 : { name: 'Paige',          winRate: 49.6, pickRate: 23.7, avgCsm: 4.5, avgDenies: 2.4, avgNwm: 1110.0, avgKda: 3.4 },
  50 : { name: 'Pocket',         winRate: 49.1, pickRate: 30.3, avgCsm: 5.2, avgDenies: 3.1, avgNwm: 1189.5, avgKda: 3.0 },
  3  : { name: 'Vindicta',       winRate: 49.0, pickRate: 23.2, avgCsm: 4.1, avgDenies: 3.8, avgNwm: 1121.6, avgKda: 3.2 },
  72 : { name: 'Billy',          winRate: 49.0, pickRate: 27.6, avgCsm: 4.4, avgDenies: 3.3, avgNwm: 1121.3, avgKda: 2.5 },
  7  : { name: 'Wraith',         winRate: 48.8, pickRate: 35.7, avgCsm: 6.0, avgDenies: 4.8, avgNwm: 1259.5, avgKda: 2.9 },
  80 : { name: 'Silver',         winRate: 48.7, pickRate: 34.4, avgCsm: 4.1, avgDenies: 2.8, avgNwm: 1104.2, avgKda: 2.9 },
  17 : { name: 'Grey Talon',     winRate: 48.7, pickRate: 28.3, avgCsm: 4.4, avgDenies: 3.1, avgNwm: 1124.6, avgKda: 3.8 },
  10 : { name: 'Paradox',        winRate: 48.5, pickRate: 31.0, avgCsm: 4.6, avgDenies: 3.8, avgNwm: 1154.5, avgKda: 2.9 },
  52 : { name: 'Mirage',         winRate: 48.3, pickRate: 25.1, avgCsm: 4.7, avgDenies: 3.8, avgNwm: 1159.0, avgKda: 3.3 },
  81 : { name: 'Celeste',        winRate: 48.2, pickRate: 31.3, avgCsm: 4.6, avgDenies: 2.9, avgNwm: 1139.0, avgKda: 2.9 },
  14 : { name: 'Holliday',       winRate: 48.0, pickRate: 19.8, avgCsm: 4.4, avgDenies: 2.5, avgNwm: 1143.8, avgKda: 3.4 },
  19 : { name: 'Shiv',           winRate: 47.1, pickRate: 43.3, avgCsm: 4.0, avgDenies: 3.4, avgNwm: 1101.5, avgKda: 2.9 },
  35 : { name: 'Viscous',        winRate: 46.9, pickRate: 19.8, avgCsm: 4.8, avgDenies: 3.5, avgNwm: 1106.9, avgKda: 3.3 },
  1  : { name: 'Infernus',       winRate: 46.9, pickRate: 34.0, avgCsm: 5.4, avgDenies: 3.8, avgNwm: 1176.2, avgKda: 2.5 },
  15 : { name: 'Bebop',          winRate: 46.0, pickRate: 47.8, avgCsm: 4.1, avgDenies: 4.0, avgNwm: 1096.7, avgKda: 2.6 },
  79 : { name: 'Rem',            winRate: 46.0, pickRate: 27.2, avgCsm: 4.1, avgDenies: 2.7, avgNwm: 1142.4, avgKda: 3.5 },
  60 : { name: 'Sinclair',       winRate: 45.9, pickRate: 19.4, avgCsm: 4.1, avgDenies: 2.7, avgNwm: 1106.0, avgKda: 2.8 },
  65 : { name: 'Venator',        winRate: 42.8, pickRate: 36.6, avgCsm: 5.4, avgDenies: 3.7, avgNwm: 1165.1, avgKda: 2.5 },
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
