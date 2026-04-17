/**
 * Game-phase boundaries (in seconds from match start)
 */
const PHASES = {
  LANING: { start: 0, end: 600 },        // 0–10 min
  MID_GAME: { start: 600, end: 1500 },    // 10–25 min
  LATE_GAME: { start: 1500, end: Infinity },
};

/**
 * Floating-souls thresholds (unspent souls outside base)
 */
const FLOATING_SOULS_THRESHOLD = 3000;

/**
 * Neutral camp tiers
 */
const NEUTRAL_CAMP_TIERS = {
  TIER_1: 1,
  TIER_2: 2,
  TIER_3: 3,
};

/**
 * Expected neutral camp clears per role (per 10 minutes) — baseline benchmarks
 */
const NEUTRAL_BASELINES = {
  carry: { tier1: 8, tier2: 4, tier3: 2 },
  support: { tier1: 3, tier2: 1, tier3: 0 },
  flex: { tier1: 5, tier2: 3, tier3: 1 },
};

/**
 * Core item cost breakpoints (souls)
 */
const ITEM_COST_TIERS = {
  BASIC: 500,
  MID: 1250,
  HIGH: 3000,
  ULTRA: 6300,
};

/**
 * Teamfight detection parameters
 */
const TEAMFIGHT = {
  CLUSTER_RADIUS: 40,              // metres – kills within this radius are one fight
  CLUSTER_TIME_WINDOW: 15,         // seconds – kills within this window
  MIN_PARTICIPANTS: 4,             // at least 4 heroes involved
};

/**
 * Objective entity class names (Source 2 demo entities)
 */
const OBJECTIVES = {
  GUARDIAN: 'npc_guardian',
  WALKER: 'npc_walker',
  SHRINE: 'npc_shrine',
  PATRON: 'npc_patron',
  MID_BOSS: 'npc_mid_boss',
};

/**
 * Mid-boss proximity radius (metres)
 */
const MID_BOSS_PROXIMITY_RADIUS = 50;

/**
 * Impact score weights (must sum to 1.0)
 */
const MODULE_WEIGHTS = {
  economy: 0.30,
  itemization: 0.20,
  combat: 0.30,
  objectives: 0.20,
};

/**
 * Letter-grade thresholds
 */
const GRADE_THRESHOLDS = [
  { min: 90, grade: 'A+' },
  { min: 85, grade: 'A' },
  { min: 80, grade: 'A-' },
  { min: 75, grade: 'B+' },
  { min: 70, grade: 'B' },
  { min: 65, grade: 'B-' },
  { min: 60, grade: 'C+' },
  { min: 55, grade: 'C' },
  { min: 50, grade: 'C-' },
  { min: 45, grade: 'D+' },
  { min: 40, grade: 'D' },
  { min: 35, grade: 'D-' },
  { min: 0, grade: 'F' },
];

module.exports = {
  PHASES,
  FLOATING_SOULS_THRESHOLD,
  NEUTRAL_CAMP_TIERS,
  NEUTRAL_BASELINES,
  ITEM_COST_TIERS,
  TEAMFIGHT,
  OBJECTIVES,
  MID_BOSS_PROXIMITY_RADIUS,
  MODULE_WEIGHTS,
  GRADE_THRESHOLDS,
};
