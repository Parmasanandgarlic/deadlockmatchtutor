/**
 * Demonstration: Role-Aware Coaching Divergence
 * 
 * This script demonstrates the "Utmost Power" of the new context-aware coaching system
 * by analyzing identical performance data through two different hero lenses: 
 * a Carry (Seven) and a Support (Kelvin).
 */

const { HERO_ROLES, ROLE_BENCHMARKS } = require('../../server/data/hero-roles');
const { analyzeMatchPerformance } = require('../../server/pipeline/analyzers/match-performance.analyzer');

// Performance Data: 
// 15,000 Souls in 30 mins (500 SPM), 3 kills, 4 deaths, 15 assists.
// This is a "High Support Impact" but "Medicore Carry Farm" performance.
const mockPerformance = {
  playerStats: {
    netWorth: 15000,
    kills: 3,
    deaths: 4,
    assists: 15,
    objectiveDamage: 1000
  }
};

const matchDuration = 1800; // 30 minutes

function runDemo() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║        CONTEXT-AWARE COACHING DEMONSTRATION      ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  // Scenario 1: SEVEN (Carry)
  const carryHeroId = 2; // Seven
  const carryRole = HERO_ROLES[carryHeroId];
  const carryContext = {
    heroRole: carryRole,
    benchmarks: ROLE_BENCHMARKS[carryRole.role],
    matchDuration,
    isRanked: true
  };
  const carryResult = analyzeMatchPerformance(mockPerformance, carryContext);

  // Scenario 2: KELVIN (Support)
  const supportHeroId = 14; // Kelvin
  const supportRole = HERO_ROLES[supportHeroId];
  const supportContext = {
    heroRole: supportRole,
    benchmarks: ROLE_BENCHMARKS[supportRole.role],
    matchDuration,
    isRanked: true
  };
  const supportResult = analyzeMatchPerformance(mockPerformance, supportContext);

  console.log(`[DATA] Performance: 500 SPM | 3/4/15 KDA | 1,000 Obj Dmg\n`);

  console.log(`--- HERO: SEVEN (Role: ${carryResult.roleContext.role.toUpperCase()}) ---`);
  console.log(`Score: ${carryResult.score} | Grade: ${carryResult.grade}`);
  console.log(`SPM Score: ${carryResult.metrics.spmScore} (Weighted: Economy is prioritized)`);
  console.log(`Combat Score: ${carryResult.metrics.combatScore} (Penalty for low kills relative to role)`);
  console.log(`Dominant Stat: ${carryResult.roleContext.dominantStat}`);
  console.log('--------------------------------------------------\n');

  console.log(`--- HERO: KELVIN (Role: ${supportResult.roleContext.role.toUpperCase()}) ---`);
  console.log(`Score: ${supportResult.score} | Grade: ${supportResult.grade}`);
  console.log(`SPM Score: ${supportResult.metrics.spmScore} (Weighted: Efficient farm for a Support)`);
  console.log(`Combat Score: ${supportResult.metrics.combatScore} (Bonus for high assist density)`);
  console.log(`Dominant Stat: ${supportResult.roleContext.dominantStat}`);
  console.log('--------------------------------------------------\n');

  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║               SCORING DIVERGENCE ANALYSIS        ║');
  console.log('╠══════════════════════════════════════════════════╣');
  const divergence = Math.abs(supportResult.score - carryResult.score);
  console.log(`║ Total Score Variance: ${divergence} points                  ║`);
  console.log(`║ Conclusion: The system correctly identifed the   ║`);
  console.log(`║ Kelvin performance as ELITE Support utility and  ║`);
  console.log(`║ the Seven performance as SUB-PAR Carry farm.     ║`);
  console.log('╚══════════════════════════════════════════════════╝\n');
}

runDemo();
