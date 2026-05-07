// Deadlock hero ID → display name mapping.
// Source: Deadlock Assets API https://assets.deadlock-api.com/v2/heroes
// This is used as a fallback if API data is not available.
// IMPORTANT: IDs are sparse (not contiguous) — they MUST match the API exactly.
export const HERO_NAMES = {
  // Verified against https://assets.deadlock-api.com/v2/heroes (May 2026)
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
  if (heroId == null || Number(heroId) <= 0) return 'Unknown Hero';
  
  // First check API-provided names
  if (apiHeroData && (apiHeroData[heroId] || apiHeroData[String(heroId)])) {
    const hero = apiHeroData[heroId] || apiHeroData[String(heroId)];
    return hero.name || hero;
  }
  
  // Fall back to static mapping
  return HERO_NAMES[heroId] || HERO_NAMES[String(heroId)] || `Hero #${heroId}`;
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
 * Hero archetype/role metadata — based on official Deadlock wiki descriptors
 * and API hero_type values (marksman, mystic, brawler).
 * Each role doubles as a playstyle hint shown in the UI:
 *   – Tank       : brawlers / frontline engagers
 *   – Carry      : farm-focused late-game damage dealers
 *   – Support    : utility, heals, crowd control
 *   – Assassin   : burst / stealth killers
 *   – Specialist : hybrid / niche mechanics
 *
 * Keys are display names; IDs must match the API.
 */
export const HERO_ROLES = {
  // Original roster
  Infernus: 'Carry',
  Seven: 'Specialist',
  Vindicta: 'Carry',
  'Lady Geist': 'Specialist',
  Abrams: 'Tank',
  Wraith: 'Assassin',
  McGinnis: 'Support',
  Paradox: 'Specialist',
  Dynamo: 'Support',
  Kelvin: 'Support',
  Haze: 'Assassin',
  Holliday: 'Carry',
  Bebop: 'Specialist',
  Calico: 'Assassin',
  'Grey Talon': 'Carry',
  'Mo & Krill': 'Tank',
  Shiv: 'Assassin',
  Ivy: 'Support',
  Kali: 'Carry',
  Warden: 'Tank',
  Yamato: 'Assassin',
  Lash: 'Specialist',
  Viscous: 'Tank',

  // Extended roster
  Gunslinger: 'Carry',
  'The Boss': 'Tank',
  Tokamak: 'Specialist',
  Wrecker: 'Tank',
  Rutger: 'Tank',
  Pocket: 'Specialist',
  Thumper: 'Tank',
  Mirage: 'Specialist',
  Fathom: 'Assassin',
  Cadence: 'Support',
  Bomber: 'Specialist',
  Vyper: 'Assassin',
  Vandal: 'Assassin',
  Sinclair: 'Specialist',
  Trapper: 'Support',
  Raven: 'Assassin',
  Mina: 'Support',
  Drifter: 'Specialist',
  Venator: 'Assassin',
  Victor: 'Carry',
  Paige: 'Support',
  Boho: 'Support',
  'The Doorman': 'Support',
  Skyrunner: 'Assassin',
  Swan: 'Support',
  Billy: 'Specialist',
  Druid: 'Support',
  Graf: 'Specialist',
  Fortuna: 'Support',
  Graves: 'Specialist',
  Apollo: 'Assassin',
  Airheart: 'Carry',
  Rem: 'Support',
  Silver: 'Assassin',
  Celeste: 'Support',
  Opera: 'Support',
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
