// Deadlock hero ID → display name mapping.
// Source: Deadlock Assets API https://assets.deadlock-api.com/v2/heroes
// This is used as a fallback if API data is not available.
export const HERO_NAMES = {
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

// Cache for API-provided hero data
let apiHeroData = null;

/**
 * Set the API-provided hero names map.
 * @param {Array} heroes - Array of hero objects from API
 */
export function setApiHeroData(heroes) {
  if (Array.isArray(heroes)) {
    const heroMap = {};
    heroes.forEach(hero => {
      const id = hero?.id ?? hero?.hero_id ?? hero?.heroId;
      if (id != null) {
        heroMap[id] = hero;
        heroMap[String(id)] = hero;
      }
    });
    apiHeroData = heroMap;
  }
}

/**
 * Get a hero's display name from its numeric ID.
 * Prioritizes API-provided names, falls back to static mapping.
 * @param {number} heroId
 * @returns {string} Hero name
 */
export function getHeroName(heroId) {
  if (heroId == null) return 'Unknown Hero';
  
  // First check API-provided names
  if (apiHeroData && (apiHeroData[heroId] || apiHeroData[String(heroId)])) {
    const hero = apiHeroData[heroId] || apiHeroData[String(heroId)];
    return hero.name || hero;
  }
  
  // Fall back to static mapping
  return HERO_NAMES[heroId] || `Hero #${heroId}`;
}

/**
 * Get a hero's display name from its numeric ID (deprecated fallback).
 * @deprecated Use useAssets() from AssetContext instead to get correct dynamic hero data.
 * @param {number} heroId
 * @returns {string} Hero name
 */
export function getHeroNameSecondary(heroId) {
  if (heroId == null) return 'Unknown Hero';
  return `Hero #${heroId}`;
}

/**
 * Get full hero data from its numeric ID.
 * @param {number} heroId
 * @returns {Object|null} Hero data object or null
 */
export function getHeroData(heroId) {
  if (heroId == null || !apiHeroData) return null;
  return apiHeroData[heroId] || apiHeroData[String(heroId)] || null;
}

/**
 * Hero archetype/role metadata — based on official Deadlock wiki descriptors.
 * Each role doubles as a playstyle hint shown in the UI:
 *   – Tank     : brawlers / frontline engagers
 *   – Carry    : farm-focused late-game damage dealers
 *   – Support  : utility, heals, crowd control
 *   – Assassin : burst / stealth killers
 *   – Specialist: hybrid / niche mechanics
 */
export const HERO_ROLES = {
  Infernus: 'Carry',
  Seven: 'Specialist',
  Vindicta: 'Carry',
  'Lady Geist': 'Specialist',
  Dynamo: 'Support',
  Abrams: 'Tank',
  Wraith: 'Assassin',
  McGinnis: 'Support',
  Kelvin: 'Support',
  Paradox: 'Specialist',
  Haze: 'Assassin',
  Holliday: 'Carry',
  Bebop: 'Specialist',
  Calico: 'Assassin',
  'Grey Talon': 'Carry',
  'Mo & Krill': 'Tank',
  Shiv: 'Assassin',
  Ivy: 'Support',
  Lash: 'Specialist',
  Viscous: 'Tank',
  Mirage: 'Specialist',
  Pocket: 'Specialist',
  Warden: 'Tank',
  Yamato: 'Assassin',
  Sinclair: 'Specialist',
  Vyper: 'Assassin',
  Wrecker: 'Specialist',
  Magician: 'Specialist',
  Fathom: 'Specialist',
  Raven: 'Assassin',
  Victor: 'Carry',
  Drifter: 'Specialist',
  Billy: 'Specialist',
  Frank: 'Tank',
  Doorman: 'Support',
  Trapper: 'Specialist',
  Bookworm: 'Support',
  Hornet: 'Assassin',
};

export const ROLE_STYLES = {
  Tank: { color: 'text-deadlock-amber', bg: 'bg-deadlock-amber/10', border: 'border-deadlock-amber/30' },
  Carry: { color: 'text-deadlock-accent', bg: 'bg-deadlock-accent/10', border: 'border-deadlock-accent/30' },
  Support: { color: 'text-deadlock-green', bg: 'bg-deadlock-green/10', border: 'border-deadlock-green/30' },
  Assassin: { color: 'text-deadlock-red', bg: 'bg-deadlock-red/10', border: 'border-deadlock-red/30' },
  Specialist: { color: 'text-deadlock-blue', bg: 'bg-deadlock-blue/10', border: 'border-deadlock-blue/30' },
};

export function getHeroRole(heroName) {
  if (!heroName) return null;
  return HERO_ROLES[heroName] || null;
}
