/**
 * Deadlock Hero Role Mappings and Benchmarks.
 * Used to provide context-aware coaching and scoring based on intended hero function.
 */

const HERO_ROLES = {
  // Verified against https://assets.deadlock-api.com/v2/heroes (Apr 2026)
  // hero_type from API: marksman, mystic, brawler — mapped to carry/support/tank/brawler
  1:  { role: 'brawler', sub_role: 'flex', lane: 'solo' },        // Infernus (marksman)
  2:  { role: 'carry', sub_role: 'aoe_carry', lane: 'solo' },     // Seven (mystic)
  3:  { role: 'carry', sub_role: 'marksman', lane: 'safe' },      // Vindicta (marksman)
  4:  { role: 'brawler', sub_role: 'lifesteal', lane: 'solo' },   // Lady Geist (mystic)
  6:  { role: 'tank', sub_role: 'frontline', lane: 'off' },       // Abrams (brawler)
  7:  { role: 'carry', sub_role: 'utility_carry', lane: 'safe' }, // Wraith (marksman)
  8:  { role: 'support', sub_role: 'split_push', lane: 'off' },   // McGinnis (mystic)
  10: { role: 'brawler', sub_role: 'mobile', lane: 'solo' },      // Paradox (mystic)
  11: { role: 'support', sub_role: 'utility', lane: 'off' },      // Dynamo (mystic)
  12: { role: 'support', sub_role: 'utility', lane: 'off' },      // Kelvin (mystic)
  13: { role: 'carry', sub_role: 'hard_carry', lane: 'safe' },    // Haze (marksman)
  14: { role: 'carry', sub_role: 'marksman', lane: 'safe' },      // Holliday (marksman)
  15: { role: 'support', sub_role: 'combat_support', lane: 'off' },// Bebop (mystic)
  16: { role: 'support', sub_role: 'utility', lane: 'off' },      // Calico (mystic)
  17: { role: 'carry', sub_role: 'marksman', lane: 'safe' },      // Grey Talon (marksman)
  18: { role: 'tank', sub_role: 'frontline', lane: 'off' },       // Mo & Krill (brawler)
  19: { role: 'brawler', sub_role: 'finisher', lane: 'safe' },    // Shiv (brawler)
  20: { role: 'support', sub_role: 'utility', lane: 'off' },      // Ivy (mystic)
  21: { role: 'carry', sub_role: 'hybrid', lane: 'solo' },        // Kali (marksman)
  25: { role: 'brawler', sub_role: 'crowd_control', lane: 'solo' },// Warden (brawler)
  27: { role: 'brawler', sub_role: 'mobile', lane: 'solo' },      // Yamato (brawler)
  31: { role: 'brawler', sub_role: 'mobile', lane: 'safe' },      // Lash (brawler)
  35: { role: 'support', sub_role: 'utility', lane: 'off' },      // Viscous (mystic)
  38: { role: 'carry', sub_role: 'marksman', lane: 'safe' },      // Gunslinger (marksman)
  39: { role: 'brawler', sub_role: 'flex', lane: 'solo' },        // The Boss (brawler)
  47: { role: 'brawler', sub_role: 'flex', lane: 'solo' },        // Tokamak (mystic)
  48: { role: 'tank', sub_role: 'frontline', lane: 'off' },       // Wrecker (brawler)
  49: { role: 'tank', sub_role: 'frontline', lane: 'off' },       // Rutger (brawler)
  50: { role: 'brawler', sub_role: 'mobile', lane: 'solo' },      // Pocket (mystic)
  51: { role: 'brawler', sub_role: 'flex', lane: 'solo' },        // Thumper (brawler)
  52: { role: 'carry', sub_role: 'hybrid', lane: 'solo' },        // Mirage (mystic)
  53: { role: 'brawler', sub_role: 'mobile', lane: 'solo' },      // Fathom (brawler)
  54: { role: 'support', sub_role: 'utility', lane: 'off' },      // Cadence (mystic)
  56: { role: 'brawler', sub_role: 'flex', lane: 'solo' },        // Bomber (mystic)
  58: { role: 'carry', sub_role: 'marksman', lane: 'safe' },      // Vyper (marksman)
  59: { role: 'brawler', sub_role: 'flex', lane: 'solo' },        // Vandal (brawler)
  60: { role: 'carry', sub_role: 'hybrid', lane: 'solo' },        // Sinclair (mystic)
  61: { role: 'support', sub_role: 'utility', lane: 'off' },      // Trapper (mystic)
  62: { role: 'carry', sub_role: 'marksman', lane: 'safe' },      // Raven (marksman)
  63: { role: 'support', sub_role: 'utility', lane: 'off' },      // Mina (mystic)
  64: { role: 'brawler', sub_role: 'mobile', lane: 'solo' },      // Drifter (brawler)
  65: { role: 'brawler', sub_role: 'flex', lane: 'solo' },        // Venator (brawler)
  66: { role: 'brawler', sub_role: 'flex', lane: 'solo' },        // Victor (brawler)
  67: { role: 'support', sub_role: 'utility', lane: 'off' },      // Paige (mystic)
  68: { role: 'support', sub_role: 'utility', lane: 'off' },      // Boho (mystic)
  69: { role: 'support', sub_role: 'utility', lane: 'off' },      // The Doorman (mystic)
  70: { role: 'brawler', sub_role: 'mobile', lane: 'solo' },      // Skyrunner (brawler)
  71: { role: 'support', sub_role: 'utility', lane: 'off' },      // Swan (mystic)
  72: { role: 'brawler', sub_role: 'flex', lane: 'solo' },        // Billy (brawler)
  73: { role: 'support', sub_role: 'utility', lane: 'off' },      // Druid (mystic)
  74: { role: 'brawler', sub_role: 'flex', lane: 'solo' },        // Graf (brawler)
  75: { role: 'support', sub_role: 'utility', lane: 'off' },      // Fortuna (mystic)
  76: { role: 'carry', sub_role: 'hybrid', lane: 'solo' },        // Graves (mystic)
  77: { role: 'brawler', sub_role: 'mobile', lane: 'solo' },      // Apollo (brawler)
  78: { role: 'carry', sub_role: 'marksman', lane: 'safe' },      // Airheart (marksman)
  79: { role: 'support', sub_role: 'utility', lane: 'off' },      // Rem (mystic)
  80: { role: 'brawler', sub_role: 'flex', lane: 'solo' },        // Silver (brawler)
  81: { role: 'support', sub_role: 'utility', lane: 'off' },      // Celeste (mystic)
  82: { role: 'support', sub_role: 'utility', lane: 'off' },      // Opera (mystic)
};

const ROLE_BENCHMARKS = {
  carry: {
    soulsPerMin: { excellent: 700, average: 500, poor: 350 },
    kdaWeight: { kills: 0.5, deaths: -0.8, assists: 0.2 },
    objectiveWeight: 0.3
  },
  support: {
    soulsPerMin: { excellent: 400, average: 250, poor: 150 },
    kdaWeight: { kills: 0.2, deaths: -0.4, assists: 0.8 },
    objectiveWeight: 0.5
  },
  tank: {
    soulsPerMin: { excellent: 500, average: 350, poor: 200 },
    kdaWeight: { kills: 0.3, deaths: -0.3, assists: 0.5 },
    objectiveWeight: 0.6
  },
  brawler: {
    soulsPerMin: { excellent: 600, average: 400, poor: 250 },
    kdaWeight: { kills: 0.4, deaths: -0.5, assists: 0.4 },
    objectiveWeight: 0.4
  }
};

module.exports = { HERO_ROLES, ROLE_BENCHMARKS };
