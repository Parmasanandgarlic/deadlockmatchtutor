// Deadlock hero ID → display name mapping.
// Source: Deadlock API /v1/heroes endpoint (static as of 2025).
export const HERO_NAMES = {
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
  25: 'Warden',
  27: 'Yamato',
  31: 'Lash',
  35: 'Viscous',
  38: 'Mirage',
  39: 'Pocket',
  48: 'Sinclair',
  49: 'Vyper',
  50: 'Wrecker',
  51: 'Magician',
  52: 'Fathom',
  53: 'Raven',
  54: 'Victor',
  58: 'Drifter',
  60: 'Billy',
  61: 'Frank',
  62: 'Doorman',
  63: 'Trapper',
  64: 'Bookworm',
  65: 'Hornet',
};

/**
 * Get a hero's display name from its numeric ID.
 */
export function getHeroName(heroId) {
  if (heroId == null) return 'Unknown Hero';
  return HERO_NAMES[heroId] || `Hero #${heroId}`;
}
