/**
 * API Tests: exercises the Express backend over HTTP using Node's built-in http.
 * Assumes the server is running on http://localhost:3001 (started by `npm run dev:server`).
 */
const http = require('http');
const assert = require('assert');

const HOST = 'localhost';
const PORT = 3001;

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request({
      host: HOST, port: PORT, path, method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    }, (res) => {
      let raw = '';
      res.on('data', (c) => raw += c);
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(raw); } catch {}
        resolve({ status: res.statusCode, body: parsed, raw });
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function test(name, fn) {
  try { await fn(); console.log(`  PASS  ${name}`); test.passed++; }
  catch (err) { console.error(`  FAIL  ${name}`); console.error(`        ${err.message}`); test.failed++; }
}
test.passed = 0; test.failed = 0;

(async () => {
  console.log('\n[API] HTTP endpoint tests');

  // 0. Connectivity
  try {
    await request('GET', '/health');
  } catch (err) {
    console.error('  SKIP  Server not reachable on :3001 — skipping API suite. Start it with `npm run dev`.');
    process.exitCode = 2;
    return;
  }

  await test('GET /health returns 200 with status ok', async () => {
    const r = await request('GET', '/health');
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.body.status, 'ok');
  });

  await test('GET /api/bogus returns 404 JSON', async () => {
    const r = await request('GET', '/api/bogus');
    assert.strictEqual(r.status, 404);
    assert.ok(r.body.error);
  });

  await test('POST /api/players/resolve without body returns 500/400', async () => {
    const r = await request('POST', '/api/players/resolve', {});
    assert.ok(r.status >= 400 && r.status < 600);
  });

  await test('POST /api/players/resolve resolves steam32', async () => {
    const r = await request('POST', '/api/players/resolve', { steamInput: '1743346546' });
    assert.strictEqual(r.status, 200);
    assert.ok(r.body.steam32);
    assert.ok(r.body.steam64);
  });

  await test('GET /api/players/:accountId/matches returns array', async () => {
    const r = await request('GET', '/api/players/1743346546/matches');
    assert.strictEqual(r.status, 200);
    assert.ok(Array.isArray(r.body));
  });

  await test('POST /api/analysis/run requires matchId and accountId', async () => {
    const r = await request('POST', '/api/analysis/run', {});
    assert.strictEqual(r.status, 400);
  });

  await test('POST /api/analysis/run rejects non-numeric ids', async () => {
    const r = await request('POST', '/api/analysis/run', { matchId: 'abc', accountId: 'def' });
    assert.strictEqual(r.status, 400);
  });

  await test('POST /api/analysis/run runs full pipeline', async () => {
    const r = await request('POST', '/api/analysis/run', { matchId: 75965136, accountId: 1743346546 });
    assert.strictEqual(r.status, 200);
    assert.ok(r.body.overall);
    assert.ok(r.body.modules);
  });

  await test('GET /api/analysis/:matchId/:accountId returns cached payload', async () => {
    const r = await request('GET', '/api/analysis/75965136/1743346546');
    assert.ok(r.status === 200 || r.status === 404);
    if (r.status === 200) assert.ok(r.body.overall);
  });

  await test('Rate limiter headers present', async () => {
    const raw = await new Promise((resolve) => {
      const req = http.request({ host: HOST, port: PORT, path: '/api/players/1743346546/matches', method: 'GET' }, (res) => {
        res.on('data', () => {});
        res.on('end', () => resolve(res.headers));
      });
      req.end();
    });
    assert.ok(raw['ratelimit-limit'] || raw['x-ratelimit-limit'], 'Rate limit headers should be present');
  });

  console.log(`\n  ${test.passed} passed / ${test.failed} failed`);
  if (test.failed > 0) process.exitCode = 1;
})();
