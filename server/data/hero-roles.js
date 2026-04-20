/**
 * Deadlock Hero Role Mappings and Benchmarks.
 * Used to provide context-aware coaching and scoring based on intended hero function.
 */

const HERO_ROLES = {
  1: { role: 'brawler', sub_role: 'flex', lane: 'solo' },        // Infernus
  2: { role: 'carry', sub_role: 'aoe_carry', lane: 'solo' },     // Seven
  3: { role: 'carry', sub_role: 'marksman', lane: 'safe' },      // Vindicta
  4: { role: 'brawler', sub_role: 'lifesteal', lane: 'solo' },   // Lady Geist
  6: { role: 'tank', sub_role: 'frontline', lane: 'off' },       // Abrams
  7: { role: 'carry', sub_role: 'utility_carry', lane: 'safe' }, // Wraith
  8: { role: 'support', sub_role: 'combat_support', lane: 'off' },// Bebop
  9: { role: 'carry', sub_role: 'hybrid', lane: 'solo' },        // Grey Thorne
  10: { role: 'brawler', sub_role: 'mobile', lane: 'solo' },     // Pocket
  11: { role: 'support', sub_role: 'utility', lane: 'off' },     // Viscous
  12: { role: 'brawler', sub_role: 'crowd_control', lane: 'solo' },// Warden
  13: { role: 'support', sub_role: 'utility', lane: 'off' },     // Ivy
  14: { role: 'support', sub_role: 'utility', lane: 'off' },     // Kelvin
  15: { role: 'brawler', sub_role: 'mobile', lane: 'safe' },     // Lash
  16: { role: 'carry', sub_role: 'hard_carry', lane: 'safe' },   // Haze
  17: { role: 'carry', sub_role: 'marksman', lane: 'safe' },     // Talon
  18: { role: 'brawler', sub_role: 'mobile', lane: 'solo' },     // Yamato
  19: { role: 'support', sub_role: 'utility', lane: 'off' },     // Dynamo
  20: { role: 'support', sub_role: 'split_push', lane: 'off' },  // McGuinnis
  21: { role: 'tank', sub_role: 'frontline', lane: 'off' },      // Mo & Krill
  25: { role: 'brawler', sub_role: 'finisher', lane: 'safe' },   // Shiv
  27: { role: 'support', sub_role: 'utility', lane: 'safe' },    // Paradox
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
