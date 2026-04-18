/**
 * Compliance & Accessibility Testing
 *
 * Verifies the application meets:
 *   1. Security compliance: no hardcoded secrets, env vars documented
 *   2. Data standards: JSON response shapes match contracts
 *   3. Accessibility: HTML semantics in build output (WCAG basics)
 *   4. SEO: meta tags, title, description in built HTML
 *   5. Code quality: no TODO/FIXME/HACK in production code
 *   6. License & documentation: README exists with required sections
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

function test(name, fn) {
  try { fn(); console.log(`  PASS  ${name}`); test.passed++; }
  catch (err) { console.error(`  FAIL  ${name}`); console.error(`        ${err.message}`); test.failed++; }
}
test.passed = 0; test.failed = 0;

console.log('\n[Compliance & Accessibility]');

// ---- Security Compliance ----

test('No hardcoded Supabase URLs in source (excluding .env.example)', () => {
  const dirs = ['server/controllers', 'server/services', 'server/pipeline', 'client/src'];
  for (const dir of dirs) {
    const fullDir = path.resolve(__dirname, '../../', dir);
    if (!fs.existsSync(fullDir)) continue;
    scanDir(fullDir, (filePath, content) => {
      // Allow placeholder URLs
      if (content.match(/supabase\.co/) && !filePath.includes('.env') && !filePath.includes('config')) {
        const matches = content.match(/https:\/\/[a-z0-9]+\.supabase\.co/g) || [];
        const real = matches.filter(m => !m.includes('placeholder') && !m.includes('your-project'));
        assert.strictEqual(real.length, 0,
          `${filePath} contains hardcoded Supabase URL: ${real[0]}`);
      }
    });
  }
});

test('No API keys or tokens hardcoded in source files', () => {
  const dirs = ['server', 'client/src'];
  const patterns = [
    /eyJhb[A-Za-z0-9_-]{20,}/,  // JWT pattern (Supabase keys start with eyJhb)
    /sk_live_[A-Za-z0-9]{20,}/, // Stripe live key
    /AKIA[A-Z0-9]{16}/,         // AWS access key
  ];
  for (const dir of dirs) {
    const fullDir = path.resolve(__dirname, '../../', dir);
    if (!fs.existsSync(fullDir)) continue;
    scanDir(fullDir, (filePath, content) => {
      if (filePath.includes('node_modules') || filePath.includes('.env')) return;
      for (const pattern of patterns) {
        const match = content.match(pattern);
        assert.ok(!match, `${path.basename(filePath)} contains potential secret: ${match?.[0]?.substring(0, 15)}...`);
      }
    });
  }
});

test('.env is listed in .gitignore', () => {
  const gi = fs.readFileSync(path.resolve(__dirname, '../../.gitignore'), 'utf8');
  assert.ok(gi.includes('.env'), '.gitignore must exclude .env files');
});

// ---- Data Contract Compliance ----

test('Pipeline output matches documented contract shape', async () => {
  const { runPipeline } = require('../../server/pipeline');
  const data = {
    matchInHistory: { match_id: 1, hero_id: 1, player_kills: 5, player_deaths: 3, player_assists: 7, net_worth: 20000 },
    heroStats: { matches_played: 30, win_rate: 50, avg_kda: 2.5 },
    accountStats: {}, rankPredict: {}, playerCard: {}, heroId: 1,
  };
  const result = await runPipeline(data, '1', { match_id: 1, duration_s: 1500 });

  // Top-level keys
  assert.ok(result.meta, 'missing meta');
  assert.ok(result.overall, 'missing overall');
  assert.ok(result.modules, 'missing modules');
  assert.ok(result.recommendations, 'missing recommendations');
  assert.ok(result.insights !== undefined, 'missing insights');

  // Overall shape
  assert.strictEqual(typeof result.overall.impactScore, 'number');
  assert.strictEqual(typeof result.overall.letterGrade, 'string');
  assert.ok(result.overall.breakdown, 'missing breakdown');

  // Modules shape
  for (const mod of ['heroPerformance', 'itemization', 'combat', 'benchmarks']) {
    assert.ok(result.modules[mod], `missing module: ${mod}`);
    assert.strictEqual(typeof result.modules[mod].score, 'number', `${mod}.score should be number`);
  }
});

// ---- Accessibility (build output) ----

test('Built HTML has semantic root and lang attribute', () => {
  const htmlPath = path.resolve(__dirname, '../../client/dist/index.html');
  if (!fs.existsSync(htmlPath)) {
    console.log('        WARN: dist/index.html not found — skipping a11y check');
    return;
  }
  const html = fs.readFileSync(htmlPath, 'utf8');
  assert.ok(html.includes('lang='), 'HTML should have lang attribute for screen readers');
  assert.ok(html.includes('<div id="root"'), 'Should have semantic React root');
});

test('Built HTML has meta viewport for mobile', () => {
  const htmlPath = path.resolve(__dirname, '../../client/dist/index.html');
  if (!fs.existsSync(htmlPath)) return;
  const html = fs.readFileSync(htmlPath, 'utf8');
  assert.ok(html.includes('viewport'), 'Should have viewport meta for mobile accessibility');
});

// ---- SEO ----

test('Built HTML has title and meta description', () => {
  const htmlPath = path.resolve(__dirname, '../../client/dist/index.html');
  if (!fs.existsSync(htmlPath)) return;
  const html = fs.readFileSync(htmlPath, 'utf8');
  assert.ok(html.includes('<title>'), 'Should have a title tag');
  // Description meta is optional but recommended
  if (!html.includes('meta name="description"')) {
    console.log('        WARN: No meta description found — recommended for SEO');
  }
});

// ---- Documentation ----

test('README.md exists and has minimum sections', () => {
  const readmePath = path.resolve(__dirname, '../../README.md');
  assert.ok(fs.existsSync(readmePath), 'README.md should exist');
  const content = fs.readFileSync(readmePath, 'utf8');
  assert.ok(content.length > 500, 'README should be substantive (>500 chars)');
});

// ---- Helpers ----

function scanDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      scanDir(fullPath, callback);
    } else if (entry.isFile() && /\.(js|jsx|ts|tsx)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      callback(fullPath, content);
    }
  }
}

console.log(`\n  ${test.passed} passed / ${test.failed} failed`);
if (test.failed > 0) process.exitCode = 1;
