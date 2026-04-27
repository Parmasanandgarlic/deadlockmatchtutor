/**
 * Deadlock Hero Benchmarks — Community Tier Data (Apr 2026)
 *
 * Source: Deadlock community analytics (all-rank aggregate).
 * Used for:
 *   - Tier list generation when API data is unavailable
 *   - Benchmark comparisons in the insights engine
 *   - Role-aware scoring calibration
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
  2:  { name: 'Seven',        winRate: 55.8, pickRate: 41.7, avgCsm: 6.5, avgDenies: 3.4, avgNwm: 1247.5, avgKda: 2.7 },
  11: { name: 'Dynamo',       winRate: 55.5, pickRate: 52.0, avgCsm: 4.6, avgDenies: 3.3, avgNwm: 1100.0, avgKda: 3.4 },
  12: { name: 'Kelvin',       winRate: 53.8, pickRate: 28.3, avgCsm: 4.2, avgDenies: 3.3, avgNwm: 1090.1, avgKda: 3.5 },
  1:  { name: 'Infernus',     winRate: 53.7, pickRate: 51.5, avgCsm: 5.6, avgDenies: 3.6, avgNwm: 1196.9, avgKda: 2.9 },
  20: { name: 'Ivy',          winRate: 52.5, pickRate: 33.5, avgCsm: 4.8, avgDenies: 4.5, avgNwm: 1103.3, avgKda: 3.5 },
  58: { name: 'Vyper',        winRate: 52.3, pickRate: 22.7, avgCsm: 5.0, avgDenies: 3.9, avgNwm: 1182.4, avgKda: 2.6 },
  8:  { name: 'McGinnis',     winRate: 51.9, pickRate: 17.3, avgCsm: 5.0, avgDenies: 8.6, avgNwm: 1114.6, avgKda: 2.9 },
  13: { name: 'Haze',         winRate: 51.9, pickRate: 45.3, avgCsm: 5.6, avgDenies: 4.2, avgNwm: 1213.0, avgKda: 2.7 },
  7:  { name: 'Wraith',       winRate: 51.6, pickRate: 34.8, avgCsm: 5.9, avgDenies: 4.8, avgNwm: 1245.0, avgKda: 3.0 },
  25: { name: 'Warden',       winRate: 51.5, pickRate: 27.2, avgCsm: 5.3, avgDenies: 3.2, avgNwm: 1173.3, avgKda: 2.8 },
  66: { name: 'Victor',       winRate: 51.1, pickRate: 19.9, avgCsm: 5.5, avgDenies: 3.3, avgNwm: 1198.2, avgKda: 2.7 },
  77: { name: 'Apollo',       winRate: 50.8, pickRate: 32.6, avgCsm: 4.5, avgDenies: 2.2, avgNwm: 1105.5, avgKda: 3.3 },
  6:  { name: 'Abrams',       winRate: 50.8, pickRate: 29.7, avgCsm: 4.5, avgDenies: 3.5, avgNwm: 1095.9, avgKda: 2.7 },
  64: { name: 'Drifter',      winRate: 50.8, pickRate: 39.0, avgCsm: 4.3, avgDenies: 2.7, avgNwm: 1124.8, avgKda: 2.7 },
  4:  { name: 'Lady Geist',   winRate: 50.8, pickRate: 31.9, avgCsm: 5.3, avgDenies: 3.1, avgNwm: 1153.0, avgKda: 2.8 },
  69: { name: 'Doorman',      winRate: 50.7, pickRate: 32.3, avgCsm: 4.5, avgDenies: 2.7, avgNwm: 1101.6, avgKda: 3.7 },
  67: { name: 'Paige',        winRate: 50.2, pickRate: 34.5, avgCsm: 4.4, avgDenies: 2.4, avgNwm: 1060.6, avgKda: 3.3 },
  76: { name: 'Graves',       winRate: 49.7, pickRate: 32.6, avgCsm: 5.5, avgDenies: 5.6, avgNwm: 1149.4, avgKda: 2.2 },
  31: { name: 'Lash',         winRate: 49.6, pickRate: 48.4, avgCsm: 4.2, avgDenies: 3.2, avgNwm: 1093.3, avgKda: 3.5 },
  18: { name: 'Mo & Krill',   winRate: 49.6, pickRate: 27.5, avgCsm: 4.3, avgDenies: 3.1, avgNwm: 1096.4, avgKda: 3.0 },
  52: { name: 'Mirage',       winRate: 49.5, pickRate: 26.5, avgCsm: 4.7, avgDenies: 3.8, avgNwm: 1148.0, avgKda: 3.3 },
  16: { name: 'Calico',       winRate: 49.4, pickRate: 19.1, avgCsm: 4.0, avgDenies: 3.3, avgNwm: 1136.8, avgKda: 3.3 },
  80: { name: 'Silver',       winRate: 49.2, pickRate: 29.5, avgCsm: 4.3, avgDenies: 2.9, avgNwm: 1089.1, avgKda: 2.9 },
  3:  { name: 'Vindicta',     winRate: 49.1, pickRate: 26.9, avgCsm: 4.2, avgDenies: 3.8, avgNwm: 1094.3, avgKda: 3.3 },
  27: { name: 'Yamato',       winRate: 49.1, pickRate: 26.9, avgCsm: 4.4, avgDenies: 2.3, avgNwm: 1113.5, avgKda: 2.7 },
  63: { name: 'Mina',         winRate: 49.0, pickRate: 40.6, avgCsm: 5.2, avgDenies: 3.0, avgNwm: 1150.6, avgKda: 3.2 },
  72: { name: 'Billy',        winRate: 48.6, pickRate: 24.7, avgCsm: 4.5, avgDenies: 3.4, avgNwm: 1100.6, avgKda: 2.4 },
  50: { name: 'Pocket',       winRate: 48.6, pickRate: 24.5, avgCsm: 5.0, avgDenies: 3.2, avgNwm: 1148.5, avgKda: 2.8 },
  65: { name: 'Venator',      winRate: 47.6, pickRate: 20.0, avgCsm: 4.0, avgDenies: 2.5, avgNwm: 1050.0, avgKda: 2.5 },
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

module.exports = { HERO_BENCHMARKS, getHeroBenchmark, getCommunityAvgKda, getCommunityAvgNwm };
