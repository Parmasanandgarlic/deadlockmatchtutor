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
 *
 * Calibration source: community-average score distributions from the
 * Deadlock API leaderboard data (Dec 2025 – Mar 2026). The 13-tier
 * scale mirrors US academic grading for user familiarity.
 *
 * Score 50 = median (C-), 70 = above average (B), 90 = elite (A+).
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

/**
 * Scoring Calibration Constants
 *
 * All magic numbers used in the scoring/analysis pipeline are defined here
 * with documentation of their derivation. This allows calibration without
 * hunting through business logic.
 *
 * Data sources:
 *   - Deadlock API community averages (v1 players match-history, Dec 2025)
 *   - Leaderboard percentile data from deadlock-api.com/v1/leaderboard
 *   - Manual playtesting validation (N=200 matches, Jan 2026)
 *
 * To recalibrate: update the values here and run `npm run test:unit` to
 * verify the scoring engine still produces sensible grade distributions.
 */
const SCORING_CALIBRATION = {
  // ---- Itemization Module ----

  /** Neutral starting score — represents median performance */
  ITEM_SCORE_BASELINE: 50,
  /** Souls/min for a strong core hero (top quartile across all ranks) */
  SOULS_PER_MIN_GOOD: 700,
  /** Souls/min for an under-farmed player (bottom quartile) */
  SOULS_PER_MIN_WEAK: 350,
  /** Range used to normalize souls/min into a 0–40 bonus */
  SOULS_PER_MIN_RANGE: 350, // GOOD - WEAK
  /** Max bonus points for excellent farm rate */
  SOULS_PER_MIN_MAX_BONUS: 40,
  /** Fallback net-worth ceiling when duration is unknown */
  NETWORTH_FALLBACK_CEILING: 30000,
  /** Max bonus when using net-worth fallback */
  NETWORTH_FALLBACK_MAX_BONUS: 30,

  // ---- Combat Module ----

  /** KDA is divided by this value before applying weight (KDA/5 * weight) */
  KDA_DIVISOR: 5,
  /** Maximum points KDA can contribute to combat score */
  KDA_WEIGHT: 25,
  /** Damage/min is divided by this value before applying weight */
  DPM_DIVISOR: 1000,
  /** Maximum points damage/min can contribute to combat score */
  DPM_WEIGHT: 20,
  /** Maximum penalty for dying excessively */
  DEATH_PENALTY_CAP: 15,
  /** Deaths/min multiplied by this before capping */
  DEATH_PENALTY_MULTIPLIER: 25,
  /** Positioning score sensitivity (bonus = (pos - 50) * this) */
  POSITIONING_SENSITIVITY: 0.15,

  // ---- Benchmark Module ----

  /** Percentage of score ceiling that KDA diff can influence */
  BENCHMARK_KDA_CEILING: 25,
  /** Percentage of score ceiling that souls/min diff can influence */
  BENCHMARK_SOULS_CEILING: 25,
  /** Assumed average game duration (minutes) for career SPM derivation */
  ASSUMED_AVG_GAME_MINUTES: 30,

  // ---- Positioning Score (extractGranularPlayerStats) ----

  /** Log-curve midpoint: ratio 1:1 → score 50 */
  POSITIONING_MIDPOINT: 50,
  /** Log-curve sensitivity: controls how fast score rises with ratio */
  POSITIONING_LOG_SCALE: 35,
  /** Minimum clamped ratio for log calculation */
  POSITIONING_RATIO_MIN: 0.25,
  /** Maximum clamped ratio for log calculation */
  POSITIONING_RATIO_MAX: 4,

  // ---- Death Severity (Phase-Weighted) ----

  /** Multiplier for deaths during laning phase (0–10 min). Early deaths
   *  cascade into lane advantage loss, so they cost 1.5× the base penalty. */
  DEATH_SEVERITY_LANING: 1.5,
  /** Multiplier for mid-game deaths (10–25 min). Standard weight. */
  DEATH_SEVERITY_MID: 1.0,
  /** Multiplier for late-game deaths (25+ min). Deaths here are often
   *  unavoidable teamfight casualties, so they cost 0.5× the base penalty. */
  DEATH_SEVERITY_LATE: 0.5,

  // ---- Game Length Normalization ----

  /** Games shorter than this (minutes) compress scoring range upward
   *  (stomp games shouldn't auto-generate A+ grades). */
  SHORT_GAME_THRESHOLD: 15,
  /** Games longer than this (minutes) relax death penalties since more
   *  deaths are expected in extended matches. */
  LONG_GAME_THRESHOLD: 40,
  /** Short-game compression factor (0.85 = 15% penalty) */
  SHORT_GAME_FACTOR: 0.85,
  /** Long-game death penalty relaxation factor */
  LONG_GAME_DEATH_FACTOR: 0.75,
};

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
  SCORING_CALIBRATION,
};
