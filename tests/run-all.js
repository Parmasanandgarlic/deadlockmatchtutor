/**
 * Master test runner. Executes each test file in a separate Node process
 * so failures don't cross-contaminate, aggregates the summary.
 *
 * Test Categories (maps to the SaaS testing taxonomy):
 *   1. Code-Level & Foundation: unit, component, SAST
 *   2. Integration & API: pipeline integration, HTTP API, database
 *   3. System & E2E: smoke/sanity, regression
 *   4. Non-Functional: load, stress, DAST, failover
 *   5. Pre-Launch & Market Readiness: regression, compliance
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const suites = [
  // ---- 1. Code-Level & Foundation ----
  { name: 'Unit: helpers',        file: 'unit/helpers.test.js' },
  { name: 'Unit: scoring',        file: 'unit/scoring.test.js' },
  { name: 'Unit: insights',       file: 'unit/insights.test.js' },
  { name: 'Unit: constants',      file: 'unit/constants.test.js' },
  { name: 'Component: validation', file: 'component/validation.test.js' },
  { name: 'Component: errorHandler', file: 'component/errorHandler.test.js' },
  { name: 'SAST: static scan',    file: 'sast/sast-scan.js' },

  // ---- 2. Integration & API ----
  { name: 'Integration: pipeline', file: 'integration/pipeline.test.js' },
  { name: 'API: http',            file: 'api/api.test.js' },
  { name: 'Database: supabase',   file: 'database/database.test.js' },

  // ---- 3. System & E2E ----
  { name: 'E2E: smoke/sanity',    file: 'e2e/smoke.test.js' },
  { name: 'Regression: business logic', file: 'regression/regression.test.js' },

  // ---- 4. Non-Functional ----
  { name: 'Performance: load',    file: 'performance/load.test.js' },
  { name: 'Stress: burst/limits', file: 'performance/stress.test.js' },
  { name: 'DAST: pen test',       file: 'security/dast.test.js' },
  { name: 'Failover: DR',         file: 'failover/failover.test.js' },

  // ---- 5. Pre-Launch & Market Readiness ----
  { name: 'Compliance: security & a11y', file: 'compliance/compliance.test.js' },
];

const results = [];
for (const s of suites) {
  const full = path.join(__dirname, s.file);
  if (!fs.existsSync(full)) { results.push({ ...s, status: 'MISSING' }); continue; }
  const r = spawnSync(process.execPath, [full], { stdio: 'inherit' });
  let status = 'PASS';
  if (r.status === 2) status = 'SKIP';
  else if (r.status !== 0) status = 'FAIL';
  results.push({ ...s, status });
}

console.log('\n╔═══════════════════════════════════════════╗');
console.log('║          COMPREHENSIVE TEST SUMMARY       ║');
console.log('╠═══════════════════════════════════════════╣');

const categories = [
  { label: '1. Code-Level & Foundation', start: 0, end: 7 },
  { label: '2. Integration & API', start: 7, end: 10 },
  { label: '3. System & E2E', start: 10, end: 12 },
  { label: '4. Non-Functional', start: 12, end: 16 },
  { label: '5. Pre-Launch & Readiness', start: 16, end: 17 },
];

for (const cat of categories) {
  console.log(`║                                           ║`);
  console.log(`║  ${cat.label.padEnd(39)} ║`);
  console.log(`║  ${'─'.repeat(39)} ║`);
  for (let i = cat.start; i < cat.end && i < results.length; i++) {
    const r = results[i];
    const icon = r.status === 'PASS' ? '✓' : r.status === 'SKIP' ? '~' : r.status === 'MISSING' ? '?' : '✗';
    console.log(`║    ${icon}  ${r.status.padEnd(7)} ${r.name.padEnd(30)} ║`);
  }
}

console.log('║                                           ║');
console.log('╠═══════════════════════════════════════════╣');

const passed = results.filter(r => r.status === 'PASS').length;
const failed = results.filter(r => r.status === 'FAIL').length;
const skipped = results.filter(r => r.status === 'SKIP').length;
const missing = results.filter(r => r.status === 'MISSING').length;

console.log(`║  PASSED:  ${String(passed).padEnd(4)} FAILED: ${String(failed).padEnd(4)} SKIPPED: ${String(skipped).padEnd(3)} ║`);
console.log('╚═══════════════════════════════════════════╝');

process.exit(failed > 0 ? 1 : 0);
