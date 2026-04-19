/**
 * @typedef {Object} HeroRole
 * @property {string} role - Primary role (carry, support, tank, brawler)
 * @property {string} sub_role - More specific hero archetype
 * @property {string} lane - Typical leaning lane (solo, safe, off)
 */

/**
 * @typedef {Object} RoleBenchmarks
 * @property {Object} soulsPerMin - SPM thresholds
 * @property {number} soulsPerMin.excellent
 * @property {number} soulsPerMin.average
 * @property {number} soulsPerMin.poor
 * @property {Object} kdaWeight - K/D/A weighting multipliers
 * @property {number} kdaWeight.kills
 * @property {number} kdaWeight.deaths
 * @property {number} kdaWeight.assists
 * @property {number} objectiveWeight - Scaling factor for objective damage
 */

/**
 * @typedef {Object} AnalysisContext
 * @property {number} matchId - The match being analyzed
 * @property {number} accountId - The specific player being graded
 * @property {HeroRole} heroRole - The role of the hero being analyzed
 * @property {RoleBenchmarks} benchmarks - The benchmarks relevant to this role
 * @property {number} matchDuration - Total match length in seconds
 * @property {boolean} isRanked - Whether it's a ranked match (affects weighting)
 */

module.exports = {};
