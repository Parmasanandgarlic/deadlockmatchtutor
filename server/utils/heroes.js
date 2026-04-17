// Deadlock hero ID → display name mapping.
// Source: Deadlock Assets API https://assets.deadlock-api.com/v2/heroes
// This is used as a fallback if API data is not available.
const HERO_NAMES = {
  1: 'Infernus',
  2: 'Seven',
  3: 'Vindicta',
  4: 'Lady Geist',
  5: 'Dynamo',
  6: 'Abrams',
  7: 'Wraith',
  8: 'McGinnis',
  9: 'Kelvin',
  10: 'Paradox',
  11: 'Haze',
  12: 'Holliday',
  13: 'Bebop',
  14: 'Calico',
  15: 'Grey Talon',
  16: 'Mo & Krill',
  17: 'Shiv',
  18: 'Ivy',
  19: 'Lash',
  20: 'Viscous',
  21: 'Mirage',
  22: 'Pocket',
  23: 'Warden',
  24: 'Yamato',
  25: 'Sinclair',
  26: 'Vyper',
  27: 'Wrecker',
  28: 'Magician',
  29: 'Fathom',
  30: 'Raven',
  31: 'Victor',
  32: 'Drifter',
  33: 'Billy',
  34: 'Frank',
  35: 'Doorman',
  36: 'Trapper',
  37: 'Bookworm',
  38: 'Hornet',
};

// Cache for API-provided hero names
let apiHeroNames = null;

/**
 * Set the API-provided hero names map.
 * @param {Object} heroMap - Map of hero_id to hero_name from API
 */
function setApiHeroNames(heroMap) {
  if (heroMap && typeof heroMap === 'object') {
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
  if (apiHeroNames && apiHeroNames[heroId]) {
    return apiHeroNames[heroId];
  }
  
  // Fall back to static mapping
  return HERO_NAMES[heroId] || `Hero #${heroId}`;
}

module.exports = { HERO_NAMES, getHeroName, setApiHeroNames };
