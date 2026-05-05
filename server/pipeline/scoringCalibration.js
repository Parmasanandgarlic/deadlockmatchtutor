/**
 * Scoring calibration lives here so gameplay thresholds are named, documented,
 * and versioned instead of being scattered as unexplained literals.
 *
 * These are v1 static defaults. They are intentionally isolated so future
 * calibration can swap in match-sample percentiles without changing analyzer
 * code.
 */

const CALIBRATION_VERSION = 'static-v1';
const CALIBRATION_SOURCE = 'role-benchmark defaults; replace with empirical percentiles when a large match corpus is available';

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

const OVERALL_WEIGHTS = {
  base: {
    heroPerformance: 0.30,
    itemization: 0.25,
    combat: 0.25,
    benchmarks: 0.20,
  },
  withDecisionQuality: {
    heroPerformance: 0.22,
    itemization: 0.20,
    combat: 0.22,
    benchmarks: 0.16,
    decisionQuality: 0.20,
  },
};

const ROLE_WEIGHTS = {
  carry: {
    withDQ: { heroPerformance: 0.27, itemization: 0.05, combat: 0.27, benchmarks: 0.21, decisionQuality: 0.20 },
    withoutDQ: { heroPerformance: 0.32, itemization: 0.10, combat: 0.32, benchmarks: 0.26 },
  },
  support: {
    withDQ: { heroPerformance: 0.24, itemization: 0.15, combat: 0.24, benchmarks: 0.17, decisionQuality: 0.20 },
    withoutDQ: { heroPerformance: 0.30, itemization: 0.18, combat: 0.30, benchmarks: 0.22 },
  },
  tank: {
    withDQ: { heroPerformance: 0.22, itemization: 0.18, combat: 0.25, benchmarks: 0.15, decisionQuality: 0.20 },
    withoutDQ: { heroPerformance: 0.28, itemization: 0.22, combat: 0.28, benchmarks: 0.22 },
  },
  brawler: {
    withDQ: OVERALL_WEIGHTS.withDecisionQuality,
    withoutDQ: OVERALL_WEIGHTS.base,
  },
};

const DEFAULT_ROLE = 'brawler';

const HERO_PERFORMANCE = {
  gradeThresholds: [
    { min: 97, grade: 'A+' },
    { min: 93, grade: 'A' },
    { min: 90, grade: 'A-' },
    { min: 87, grade: 'B+' },
    { min: 83, grade: 'B' },
    { min: 80, grade: 'B-' },
    { min: 77, grade: 'C+' },
    { min: 73, grade: 'C' },
    { min: 70, grade: 'C-' },
    { min: 60, grade: 'D' },
    { min: 0, grade: 'F' },
  ],
  spmBands: {
    poorScore: 40,
    averageScore: 70,
    excellentScore: 100,
  },
  componentWeights: {
    economy: 0.40,
    combat: 0.40,
    objectives: 0.20,
  },
  kdaPointScale: 10,
  objectiveDamageTarget: {
    ranked: 5000,
    unranked: 3000,
  },
};

const ITEMIZATION_REPLAY = {
  baselineScore: 60,
  floatingSoulsPenaltyMax: 25,
  firstHighTierItemSeconds: 8 * 60,
  firstHighTierBaselineSeconds: 12 * 60,
  firstUltraTierItemSeconds: 16 * 60,
  firstUltraTierBaselineSeconds: 22 * 60,
  firstHighTierBonus: 10,
  firstUltraTierBonus: 10,
  activeUsageBonusMax: 15,
};

const COMBAT_REPLAY = {
  baselineScore: 50,
  participationBonusMax: 25,
  lowPokeDamageBonusMax: 10,
  fightDamagePaddingSeconds: 5,
  deadTimePenaltySeconds: 5 * 60,
  deadTimePenaltyDurationRatio: 0.12,
  deadTimePenaltyMax: 20,
  spellRotationBonusMax: 10,
  lostFarmSoulsPerMinuteFallback: 80,
};

const ITEMIZATION = {
  baselineScore: 50,
  weakSoulsPerMin: 350,
  strongSoulsPerMin: 700,
  maxSoulsPerMinBonus: 40,
  fallbackNetWorthTarget: 30000,
  fallbackNetWorthMaxBonus: 30,
};

const COMBAT = {
  baselineScore: 50,
  kdaTarget: 5,
  maxKdaBonus: 25,
  damagePerMinTarget: 1000,
  maxDamageBonus: 20,
  deathsPerMinPenaltyScale: 25,
  maxDeathPenalty: 15,
  positioningNeutral: 50,
  positioningAdjustmentScale: 0.15,
  objectiveDamageTarget: 8000,
};

const BENCHMARKS = {
  baselineScore: 50,
  maxKdaDeltaBonus: 25,
  maxSoulsDeltaBonus: 25,
  assumedAverageMatchMinutes: 30,
  defaultCommunitySoulsPerMin: 550,
  expectedWinrate: 50,
};

const DECISION_QUALITY = {
  weights: {
    engagement: 0.22,
    farm: 0.18,
    deathSeverity: 0.18,
    objective: 0.14,
    build: 0.14,
    adaptation: 0.14,
  },
  engagement: {
    fallbackBase: 40,
    kdaScale: 10,
  },
  farm: {
    weakSoulsPerMin: 300,
    strongSoulsPerMin: 700,
    scoreRange: 60,
    scoreFloor: 40,
  },
  deathSeverity: {
    expectedDeathsPerMin: 0.28,
    minimumObservedDeathsPerMin: 0.05,
    ratioFloor: 0.25,
    ratioCeiling: 4,
    scoreBase: 40,
    logScale: 25,
    difficultyMultiplier: {
      extreme: 1.3,
      hard: 1.15,
      balanced: 1.0,
      easy: 0.85,
    },
  },
  objective: {
    neutralScore: 50,
    lowDamage: 3000,
    highDamage: 11000,
    scoreRange: 60,
    scoreFloor: 40,
  },
  adaptationAdjustment: {
    extreme: 12,
    hard: 6,
    easy: -4,
    balanced: 0,
  },
  grades: [
    { min: 90, grade: 'S', label: 'Exceptional decisions' },
    { min: 80, grade: 'A', label: 'Strong decisions' },
    { min: 70, grade: 'B', label: 'Solid decisions' },
    { min: 60, grade: 'C', label: 'Mixed decisions' },
    { min: 45, grade: 'D', label: 'Below-average decisions' },
    { min: 0, grade: 'F', label: 'Poor decisions' },
  ],
  findingBands: {
    strength: 80,
    weakness: 40,
  },
};

const RANK_BENCHMARKS = {
  defaultTier: 5,
  baseline: {
    soulsPerMin: 550,
    kda: 3.0,
    damagePerMin: 900,
    objectiveDamage: 8000,
    winrate: 50,
  },
  tierMultiplier: {
    1: 0.55, 2: 0.65, 3: 0.75, 4: 0.88, 5: 1.0,
    6: 1.12, 7: 1.22, 8: 1.32, 9: 1.42, 10: 1.52, 11: 1.62, 12: 1.72,
  },
  percentileCurve: {
    benchmarkScore: 50,
    logScale: 35,
    ratioFloor: 0.25,
    ratioCeiling: 4,
  },
  summaryBands: {
    above: 65,
    inline: 45,
  },
};

const TEMPORAL = {
  defaultWindow: 20,
  minimumDurationMinutes: 8,
  neutralScore: 50,
  kdaSlopeScale: 60,
  maxTrendAdjustment: 25,
  winRateBaseline: 50,
  winRateScale: 0.4,
  trendThreshold: 0.03,
};

const PLAYER_PROFILE = {
  metadataTtlMs: 24 * 60 * 60 * 1000,
  topHeroCount: 5,
  recentMatchWindow: 20,
};

const TRENDS = {
  defaultLimit: 10,
  maxLimit: 30,
  minimumValidMatches: 3,
  stablePercentChangePerMatch: 1,
};

const MATCHUP_DIFFICULTY = {
  neutralScore: 50,
  rankDeltaScale: 1.0,
  rankDeltaClamp: 20,
  counterScore: {
    hard: 10,
    moderate: 5,
    soft: 2,
    trigger: 0.4,
    moderateTrigger: 0.5,
  },
  compositionAdjustment: {
    manyCarriesAt: 3,
    manyCarries: 6,
    noTanks: -3,
    manySupportsAt: 2,
    manySupports: 4,
  },
  netWorthSwing: {
    threshold: 5000,
    adjustment: 8,
  },
  bands: {
    extreme: 75,
    hard: 60,
    easy: 35,
  },
};

const BUILD_PATH = {
  neutralScore: 50,
  emptyBuildScore: 50,
  minimumItemsForSpikeCheck: 6,
  underutilizedSlotDelta: 0.12,
  overusedSlotDelta: 0.15,
  tierCosts: {
    1: 500,
    2: 1250,
    3: 3000,
    4: 6200,
  },
  tierThreeTimingMinutes: {
    strong: 18,
    good: 22,
    late: 28,
  },
  timingScores: {
    strong: 90,
    good: 75,
    late: 60,
    poor: 40,
    missingAfterWindow: 35,
  },
  missingSpikeWindowSeconds: 18 * 60,
  balancePerfectScore: 100,
  balanceDeviationScale: 250,
  meaningfulSlotCount: 4,
  scoreWeights: {
    timing: 0.40,
    balance: 0.40,
    completeness: 0.20,
  },
  summaryBands: {
    efficient: 80,
    workable: 60,
  },
};

module.exports = {
  CALIBRATION_VERSION,
  CALIBRATION_SOURCE,
  GRADE_THRESHOLDS,
  OVERALL_WEIGHTS,
  ROLE_WEIGHTS,
  DEFAULT_ROLE,
  HERO_PERFORMANCE,
  ITEMIZATION_REPLAY,
  ITEMIZATION,
  COMBAT,
  COMBAT_REPLAY,
  BENCHMARKS,
  DECISION_QUALITY,
  RANK_BENCHMARKS,
  TEMPORAL,
  MATCHUP_DIFFICULTY,
  BUILD_PATH,
  PLAYER_PROFILE,
  TRENDS,
};
