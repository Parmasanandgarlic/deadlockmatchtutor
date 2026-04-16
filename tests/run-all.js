/**
 * Master test runner. Executes each test file in a separate Node process
 * so failures don't cross-contaminate, aggregates the summary.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const suites = [
  { name: 'Unit: helpers',       file: 'unit/helpers.test.js' },
  { name: 'Unit: scoring',       file: 'unit/scoring.test.js' },
  { name: 'Component: validation', file: 'component/validation.test.js' },
  { name: 'Component: errorHandler', file: 'component/errorHandler.test.js' },
  { name: 'SAST: static scan',   file: 'sast/sast-scan.js' },
  { name: 'Integration: pipeline', file: 'integration/pipeline.test.js' },
  { name: 'API: http',           file: 'api/api.test.js' },
  { name: 'Database: supabase',  file: 'database/database.test.js' },
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

console.log('\n=============================');
console.log('       TEST SUMMARY');
console.log('=============================');
for (const r of results) {
  const tag = r.status === 'PASS' ? '✓' : r.status === 'SKIP' ? '~' : '✗';
  console.log(`  ${tag}  ${r.status.padEnd(5)} ${r.name}`);
}

const failed = results.filter(r => r.status === 'FAIL').length;
process.exit(failed > 0 ? 1 : 0);
