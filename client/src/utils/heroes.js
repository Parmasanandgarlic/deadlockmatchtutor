// Deadlock hero ID → display name mapping.
// Deprecated: Now dynamically hydrated via AssetContext
export const HERO_NAMES = {};

/**
 * @deprecated Use useAssets() from AssetContext instead to get correct dynamic hero data.
 */
export function getHeroName(heroId) {
  if (heroId == null) return 'Unknown Hero';
  return `Hero #${heroId}`;
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
