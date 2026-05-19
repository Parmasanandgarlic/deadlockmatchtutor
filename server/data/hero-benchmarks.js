/**
 * Deadlock Hero Benchmarks — Community Tier Data (May 2026)
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
 * Last updated: 2026-05-18
 */

const HERO_BENCHMARKS = {
  66 : { name: 'Victor        ', winRate: 55.8, pickRate: 42.6, avgCsm: 5.5, avgDenies: 3.2, avgNwm: 1213.1, avgKda: 2.8 },
  8  : { name: 'McGinnis      ', winRate: 55.7, pickRate: 21.9, avgCsm: 4.9, avgDenies: 8.2, avgNwm: 1136.9, avgKda: 3.2 },
  2  : { name: 'Seven         ', winRate: 55.6, pickRate: 43.3, avgCsm: 6.6, avgDenies: 3.4, avgNwm: 1262.9, avgKda: 2.8 },
  12 : { name: 'Kelvin        ', winRate: 53.9, pickRate: 24.3, avgCsm: 4.2, avgDenies: 3.3, avgNwm: 1140.0, avgKda: 3.6 },
  69 : { name: 'The Doorman   ', winRate: 53.4, pickRate: 28.9, avgCsm: 4.6, avgDenies: 2.7, avgNwm: 1134.9, avgKda: 3.8 },
  11 : { name: 'Dynamo        ', winRate: 53.2, pickRate: 33.5, avgCsm: 4.6, avgDenies: 3.4, avgNwm: 1129.1, avgKda: 3.5 },
  20 : { name: 'Ivy           ', winRate: 52.3, pickRate: 27.3, avgCsm: 4.7, avgDenies: 4.7, avgNwm: 1123.9, avgKda: 3.5 },
  13 : { name: 'Haze          ', winRate: 52.0, pickRate: 48.4, avgCsm: 5.3, avgDenies: 4.1, avgNwm: 1215.3, avgKda: 2.7 },
  27 : { name: 'Yamato        ', winRate: 51.7, pickRate: 32.2, avgCsm: 4.2, avgDenies: 2.3, avgNwm: 1151.0, avgKda: 2.8 },
  76 : { name: 'Graves        ', winRate: 51.7, pickRate: 25.6, avgCsm: 5.4, avgDenies: 5.6, avgNwm: 1161.3, avgKda: 2.3 },
  25 : { name: 'Warden        ', winRate: 51.6, pickRate: 39.2, avgCsm: 5.4, avgDenies: 3.2, avgNwm: 1194.6, avgKda: 2.9 },
  18 : { name: 'Mo & Krill    ', winRate: 51.2, pickRate: 27.6, avgCsm: 4.3, avgDenies: 3.0, avgNwm: 1149.4, avgKda: 3.2 },
  31 : { name: 'Lash          ', winRate: 50.8, pickRate: 48.9, avgCsm: 4.1, avgDenies: 3.2, avgNwm: 1122.8, avgKda: 3.4 },
  58 : { name: 'Vyper         ', winRate: 50.7, pickRate: 17.8, avgCsm: 5.0, avgDenies: 4.0, avgNwm: 1190.2, avgKda: 2.5 },
  16 : { name: 'Calico        ', winRate: 50.7, pickRate: 20.7, avgCsm: 3.8, avgDenies: 3.1, avgNwm: 1182.9, avgKda: 3.4 },
  64 : { name: 'Drifter       ', winRate: 50.6, pickRate: 40.6, avgCsm: 4.2, avgDenies: 2.6, avgNwm: 1158.4, avgKda: 2.7 },
  63 : { name: 'Mina          ', winRate: 50.4, pickRate: 50.1, avgCsm: 5.2, avgDenies: 2.9, avgNwm: 1164.9, avgKda: 3.2 },
  4  : { name: 'Lady Geist    ', winRate: 50.3, pickRate: 30.3, avgCsm: 5.3, avgDenies: 3.1, avgNwm: 1171.2, avgKda: 2.8 },
  77 : { name: 'Apollo        ', winRate: 50.2, pickRate: 31.9, avgCsm: 4.4, avgDenies: 2.2, avgNwm: 1130.4, avgKda: 3.1 },
  6  : { name: 'Abrams        ', winRate: 50.1, pickRate: 26.7, avgCsm: 4.4, avgDenies: 3.6, avgNwm: 1107.2, avgKda: 2.7 },
  67 : { name: 'Paige         ', winRate: 49.5, pickRate: 23.8, avgCsm: 4.4, avgDenies: 2.5, avgNwm: 1105.7, avgKda: 3.4 },
  3  : { name: 'Vindicta      ', winRate: 49.1, pickRate: 23.8, avgCsm: 4.2, avgDenies: 3.8, avgNwm: 1120.2, avgKda: 3.2 },
  50 : { name: 'Pocket        ', winRate: 49.1, pickRate: 30.4, avgCsm: 5.2, avgDenies: 3.1, avgNwm: 1186.7, avgKda: 2.9 },
  7  : { name: 'Wraith        ', winRate: 48.9, pickRate: 35.7, avgCsm: 6.0, avgDenies: 4.9, avgNwm: 1258.9, avgKda: 2.9 },
  10 : { name: 'Paradox       ', winRate: 48.9, pickRate: 30.6, avgCsm: 4.6, avgDenies: 3.8, avgNwm: 1153.7, avgKda: 2.9 },
  80 : { name: 'Silver        ', winRate: 48.9, pickRate: 35.1, avgCsm: 4.1, avgDenies: 2.8, avgNwm: 1103.4, avgKda: 2.9 },
  81 : { name: 'Celeste       ', winRate: 48.8, pickRate: 31.5, avgCsm: 4.6, avgDenies: 2.9, avgNwm: 1139.5, avgKda: 2.9 },
  52 : { name: 'Mirage        ', winRate: 48.6, pickRate: 24.8, avgCsm: 4.7, avgDenies: 3.9, avgNwm: 1155.9, avgKda: 3.3 },
  14 : { name: 'Holliday      ', winRate: 48.5, pickRate: 19.6, avgCsm: 4.4, avgDenies: 2.5, avgNwm: 1140.7, avgKda: 3.4 },
  17 : { name: 'Grey Talon    ', winRate: 48.2, pickRate: 27.7, avgCsm: 4.4, avgDenies: 3.2, avgNwm: 1121.0, avgKda: 3.7 },
  72 : { name: 'Billy         ', winRate: 48.2, pickRate: 26.3, avgCsm: 4.4, avgDenies: 3.4, avgNwm: 1116.6, avgKda: 2.4 },
  35 : { name: 'Viscous       ', winRate: 47.1, pickRate: 19.5, avgCsm: 4.8, avgDenies: 3.6, avgNwm: 1105.7, avgKda: 3.3 },
  19 : { name: 'Shiv          ', winRate: 47.0, pickRate: 43.3, avgCsm: 4.0, avgDenies: 3.4, avgNwm: 1101.9, avgKda: 2.8 },
  1  : { name: 'Infernus      ', winRate: 46.5, pickRate: 34.5, avgCsm: 5.5, avgDenies: 3.8, avgNwm: 1172.5, avgKda: 2.5 },
  60 : { name: 'Sinclair      ', winRate: 46.1, pickRate: 20.0, avgCsm: 4.1, avgDenies: 2.7, avgNwm: 1104.7, avgKda: 2.8 },
  15 : { name: 'Bebop         ', winRate: 46.0, pickRate: 49.4, avgCsm: 4.1, avgDenies: 4.1, avgNwm: 1094.8, avgKda: 2.6 },
  79 : { name: 'Rem           ', winRate: 45.1, pickRate: 24.7, avgCsm: 4.1, avgDenies: 2.7, avgNwm: 1138.5, avgKda: 3.3 },
  65 : { name: 'Venator       ', winRate: 42.5, pickRate: 37.5, avgCsm: 5.4, avgDenies: 3.7, avgNwm: 1161.4, avgKda: 2.4 },
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
