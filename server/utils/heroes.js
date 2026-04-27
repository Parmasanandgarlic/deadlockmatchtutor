// Deadlock hero ID → display name mapping.
// Source: Deadlock Assets API https://assets.deadlock-api.com/v2/heroes
// This is used as a fallback if API data is not available.
const HERO_NAMES = {
  // Verified against https://assets.deadlock-api.com/v2/heroes (Apr 2026)
  1: 'Infernus',
  2: 'Seven',
  3: 'Vindicta',
  4: 'Lady Geist',
  6: 'Abrams',
  7: 'Wraith',
  8: 'McGinnis',
  10: 'Paradox',
  11: 'Dynamo',
  12: 'Kelvin',
  13: 'Haze',
  14: 'Holliday',
  15: 'Bebop',
  16: 'Calico',
  17: 'Grey Talon',
  18: 'Mo & Krill',
  19: 'Shiv',
  20: 'Ivy',
  21: 'Kali',
  25: 'Warden',
  27: 'Yamato',
  31: 'Lash',
  35: 'Viscous',
  38: 'Gunslinger',
  39: 'The Boss',
  47: 'Tokamak',
  48: 'Wrecker',
  49: 'Rutger',
  50: 'Pocket',
  51: 'Thumper',
  52: 'Mirage',
  53: 'Fathom',
  54: 'Cadence',
  56: 'Bomber',
  58: 'Vyper',
  59: 'Vandal',
  60: 'Sinclair',
  61: 'Trapper',
  62: 'Raven',
  63: 'Mina',
  64: 'Drifter',
  65: 'Venator',
  66: 'Victor',
  67: 'Paige',
  68: 'Boho',
  69: 'The Doorman',
  70: 'Skyrunner',
  71: 'Swan',
  72: 'Billy',
  73: 'Druid',
  74: 'Graf',
  75: 'Fortuna',
  76: 'Graves',
  77: 'Apollo',
  78: 'Airheart',
  79: 'Rem',
  80: 'Silver',
  81: 'Celeste',
  82: 'Opera',
};

// Cache for API-provided hero names
let apiHeroNames = null;

/**
 * Set the API-provided hero names map.
 * @param {Array} heroes - Array of hero objects from API
 */
function setApiHeroNames(heroes) {
  if (Array.isArray(heroes)) {
    const heroMap = {};
    heroes.forEach(hero => {
      const id = hero?.id ?? hero?.hero_id ?? hero?.heroId;
      if (id != null) {
        heroMap[id] = hero;
        // Also index by string form to avoid numeric/string key drift.
        heroMap[String(id)] = hero;
      }
    });
    apiHeroNames = heroMap;
  }
}

/**
 * Get a hero's display name from its numeric ID.
 * Prioritizes API-provided names, falls back to static mapping.
 * @param {number} heroId
 * @returns {string} Hero name
 */
function getHeroName(heroId) {
  if (heroId == null) return 'Unknown Hero';
  
  // First check API-provided names
  if (apiHeroNames && (apiHeroNames[heroId] || apiHeroNames[String(heroId)])) {
    const hero = apiHeroNames[heroId] || apiHeroNames[String(heroId)];
    return hero.name || hero; // Handle both full object and legacy string mapping
  }
  
  // Fall back to static mapping
  return HERO_NAMES[heroId] || `Hero #${heroId}`;
}

/**
 * Get full hero data from its numeric ID.
 * @param {number} heroId
 * @returns {Object|null} Hero data object or null
 */
function getHeroData(heroId) {
  if (heroId == null || !apiHeroNames) return null;
  return apiHeroNames[heroId] || apiHeroNames[String(heroId)] || null;
}

module.exports = { HERO_NAMES, getHeroName, getHeroData, setApiHeroNames };
