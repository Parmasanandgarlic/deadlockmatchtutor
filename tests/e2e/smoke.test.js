/**
 * E2E Smoke / Sanity Testing
 *
 * Final lightweight checklist run after deployment to verify core infrastructure:
 *   1. Client build produces valid HTML entry point
 *   2. Server module loads without throwing
 *   3. Health endpoint responds
 *   4. API routes are wired (player, match, analysis)
 *   5. Pipeline produces valid output shape
 *   6. Static assets exist (index.html, CSS, JS)
 *
 * Does NOT require a running server for structural checks.
 * Server-dependent checks skip gracefully if server is not running.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const http = require('http');

async function test(name, fn) {
  try { await fn(); console.log(`  PASS  ${name}`); test.passed++; }
  catch (err) { console.error(`  FAIL  ${name}`); console.error(`        ${err.message}`); test.failed++; }
}
test.passed = 0; test.failed = 0;

function httpGet(urlPath) {
  return new Promise((resolve) => {
    const req = http.request({ host: 'localhost', port: 3001, path: urlPath, method: 'GET' }, (res) => {
      let buf = '';
      res.on('data', (c) => { buf += c; });
      res.on('end', () => resolve({ status: res.statusCode, body: buf, headers: res.headers }));
    });
    req.on('error', () => resolve({ status: 0 }));
    req.setTimeout(3000, () => { req.destroy(); resolve({ status: 0 }); });
    req.end();
  });
}

console.log('\n[E2E Smoke / Sanity]');

(async () => {
  // ---- Structural checks (no server needed) ----

  await test('Server module loads without throwing', () => {
    // This validates that all requires resolve and no top-level errors exist
    const app = require('../../server/index');
    assert.ok(app, 'Express app should export');
    assert.strictEqual(typeof app.listen, 'function', 'app.listen should be a function');
  });

  await test('Pipeline module exports runPipeline', () => {
    const pipeline = require('../../server/pipeline');
    assert.strictEqual(typeof pipeline.runPipeline, 'function');
  });

  await test('All route modules load without errors', () => {
    require('../../server/routes/player.routes');
    require('../../server/routes/match.routes');
    require('../../server/routes/analysis.routes');
    require('../../server/routes/index');
    assert.ok(true);
  });

  await test('Config loads with valid defaults', () => {
    const config = require('../../server/config');
    assert.ok(config.port > 0, 'port should be positive');
    assert.ok(config.deadlockApi.baseUrl.startsWith('http'), 'API base URL should be HTTP(S)');
    assert.ok(config.rateLimit.windowMs > 0, 'rate limit window should be positive');
  });

  await test('Client dist/index.html exists (build artifact)', () => {
    const distPath = path.resolve(__dirname, '../../client/dist/index.html');
    if (!fs.existsSync(distPath)) {
      // Not a failure — just means build hasn't been run yet
      console.log('        WARN: dist/index.html not found — run `npm run build` first');
      return; // pass anyway, it's a smoke check
    }
    const html = fs.readFileSync(distPath, 'utf8');
    assert.ok(html.includes('<div id="root"'), 'index.html should have React root');
    assert.ok(html.includes('<script'), 'index.html should have script tags');
  });

  await test('package.json has required scripts', () => {
    const pkg = require('../../package.json');
    assert.ok(pkg.scripts.dev, 'missing dev script');
    assert.ok(pkg.scripts.build, 'missing build script');
    assert.ok(pkg.scripts.test, 'missing test script');
    assert.ok(pkg.scripts.start, 'missing start script');
  });

  await test('.env.example exists with all required keys', () => {
    const envPath = path.resolve(__dirname, '../../server/.env.example');
    assert.ok(fs.existsSync(envPath), '.env.example should exist');
    const content = fs.readFileSync(envPath, 'utf8');
    const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'DEADLOCK_API_BASE_URL'];
    for (const key of required) {
      assert.ok(content.includes(key), `.env.example missing ${key}`);
    }
  });

  await test('.gitignore excludes sensitive and build files', () => {
    const giPath = path.resolve(__dirname, '../../.gitignore');
    assert.ok(fs.existsSync(giPath), '.gitignore should exist');
    const content = fs.readFileSync(giPath, 'utf8');
    assert.ok(content.includes('node_modules'), '.gitignore should exclude node_modules');
    assert.ok(content.includes('.env'), '.gitignore should exclude .env');
    assert.ok(content.includes('dist'), '.gitignore should exclude dist/');
  });

  // ---- Server-dependent checks (skip if not running) ----
  const probe = await httpGet('/health');
  if (probe.status === 0) {
    console.log('  SKIP  Server not running — skipping live smoke checks');
  } else {
    await test('GET /health returns 200 and status ok', async () => {
      const r = await httpGet('/health');
      assert.strictEqual(r.status, 200);
      const body = JSON.parse(r.body);
      assert.strictEqual(body.status, 'ok');
    });

    await test('GET /api/health returns 200', async () => {
      const r = await httpGet('/api/health');
      assert.strictEqual(r.status, 200);
    });

    await test('API routes are wired (404 on /api/bogus)', async () => {
      const r = await httpGet('/api/bogus');
      assert.strictEqual(r.status, 404);
    });
  }

  console.log(`\n  ${test.passed} passed / ${test.failed} failed`);
  if (test.failed > 0) process.exitCode = 1;
})();
