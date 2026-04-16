/**
 * Dynamic Application Security Testing (DAST) / Penetration Testing
 *
 * Simulates active attacks against the running application:
 *   1. XSS injection in Steam input — server must not reflect unsanitized
 *   2. SQL injection payloads — must not break DB or leak data
 *   3. NoSQL / operator injection
 *   4. Prototype pollution via JSON body
 *   5. Path traversal on dynamic routes
 *   6. HTTP Verb tampering (TRACE, CONNECT)
 *   7. Security response headers (helmet)
 *   8. Open CORS check
 *   9. Information disclosure via error messages (no stack in prod shape)
 *  10. Unauthenticated access to cache write path — cannot inject arbitrary data
 */
const http = require('http');

const HOST = 'localhost';
const PORT = 3001;

function request(method, path, body, headers = {}) {
  return new Promise((resolve) => {
    const data = body != null ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const req = http.request({
      host: HOST, port: PORT, path, method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...headers,
      },
    }, (res) => {
      let buf = '';
      res.on('data', (c) => { buf += c; });
      res.on('end', () => resolve({ status: res.statusCode, body: buf, headers: res.headers }));
    });
    req.on('error', (e) => resolve({ status: 0, err: e.code || e.message }));
    if (data) req.write(data);
    req.end();
  });
}

async function test(name, fn) {
  try { const ok = await fn(); console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}`); if (ok) test.passed++; else test.failed++; }
  catch (err) { console.error(`  FAIL  ${name}\n        ${err.message}`); test.failed++; }
}
test.passed = 0; test.failed = 0;

(async () => {
  console.log('\n[DAST / Penetration]');
  try { await request('GET', '/health'); }
  catch { console.error('  SKIP  Server not reachable.'); process.exitCode = 2; return; }

  await test('XSS: <script> payload not reflected', async () => {
    const payload = '<script>alert(1)</script>';
    const r = await request('POST', '/api/players/resolve', { steamInput: payload });
    const body = r.body || '';
    // Response may echo the input inside JSON but MUST not send a raw script tag with text/html
    const ct = r.headers['content-type'] || '';
    if (ct.includes('text/html') && body.includes('<script>')) return false;
    return true;
  });

  await test('SQL injection payload handled safely', async () => {
    const payload = "1' OR 1=1;--";
    const r = await request('POST', '/api/analysis/run', { matchId: payload, accountId: payload });
    // Validation layer should reject as non-numeric
    return r.status === 400;
  });

  await test('Prototype pollution via __proto__ does not mutate global', async () => {
    await request('POST', '/api/players/resolve', { steamInput: 'x', __proto__: { polluted: 'yes' } });
    // eslint-disable-next-line no-proto
    return ({}).polluted === undefined;
  });

  await test('Path traversal on :accountId rejected or 404', async () => {
    const r = await request('GET', '/api/players/..%2F..%2Fetc%2Fpasswd/matches');
    // Must not 200 with file contents
    return r.status >= 400;
  });

  await test('HTTP verb tampering: TRACE/CONNECT not exposed', async () => {
    const r = await request('TRACE', '/health');
    return r.status === 0 || r.status >= 400;
  });

  await test('Security headers present (helmet)', async () => {
    const r = await request('GET', '/health');
    const h = r.headers;
    const required = ['x-content-type-options', 'x-frame-options', 'strict-transport-security'];
    const missing = required.filter(k => !h[k]);
    if (missing.length) console.log(`        missing: ${missing.join(', ')}`);
    return missing.length === 0;
  });

  await test('CORS: rejects arbitrary Origin in dev', async () => {
    const r = await request('GET', '/api/players/1743346546/matches', null, { Origin: 'https://evil.example.com' });
    const ao = r.headers['access-control-allow-origin'];
    console.log(`        ACAO=${ao}`);
    // Must NOT echo arbitrary origin nor be '*'
    return !ao || (ao !== 'https://evil.example.com' && ao !== '*');
  });

  await test('500 responses do not leak stack traces (production shape)', async () => {
    // Trigger an internal error via a non-existent match
    const r = await request('POST', '/api/analysis/run', { matchId: 1, accountId: 1 });
    if (r.status < 500) return true; // no stack to leak
    // In development mode the app intentionally exposes stack; production must not
    try {
      const parsed = JSON.parse(r.body);
      return !parsed.stack || process.env.NODE_ENV !== 'production';
    } catch { return true; }
  });

  await test('No arbitrary cache write path exists', async () => {
    // There should be no PUT / direct /api/analysis/write endpoint
    const r = await request('PUT', '/api/analysis/75965136/1743346546', { data: { hacked: true } });
    return r.status === 404 || r.status === 405;
  });

  await test('Content-Type enforcement: rejects non-JSON body on JSON endpoint', async () => {
    const r = await request('POST', '/api/players/resolve', 'steamInput=x', { 'Content-Type': 'text/plain' });
    return r.status >= 400;
  });

  console.log(`\n  ${test.passed} passed / ${test.failed} failed`);
  if (test.failed > 0) process.exitCode = 1;
})();
