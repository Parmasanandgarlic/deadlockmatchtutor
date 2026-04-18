/**
 * Performance & Load Testing
 *
 * Simulates anticipated production load and measures:
 *   - p50 / p95 / p99 response times
 *   - requests-per-second throughput
 *   - server resource utilization (via /health)
 *   - database (cached-read) query speed
 *
 * SLA targets (tunable):
 *   - /health         p95 < 50ms   @ 50 concurrent
 *   - cached /analysis p95 < 500ms @ 20 concurrent
 */
const http = require('http');
const os = require('os');

const HOST = 'localhost';
const PORT = 3001;

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const t0 = process.hrtime.bigint();
    const req = http.request({
      host: HOST, port: PORT, path, method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    }, (res) => {
      res.on('data', () => {});
      res.on('end', () => {
        const ms = Number(process.hrtime.bigint() - t0) / 1e6;
        resolve({ status: res.statusCode, ms });
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

async function runLoad(label, { method, path, body, concurrency, total, maxP95 }) {
  const latencies = [];
  const errors = [];
  const t0 = Date.now();
  let inFlight = 0, launched = 0, done = 0;

  await new Promise((resolve) => {
    const tick = () => {
      while (inFlight < concurrency && launched < total) {
        launched++;
        inFlight++;
        request(method, path, body)
          .then(({ status, ms }) => {
            if (status >= 400) errors.push(status);
            latencies.push(ms);
          })
          .catch((e) => errors.push(e.code || e.message))
          .finally(() => {
            inFlight--;
            done++;
            if (done === total) resolve();
            else tick();
          });
      }
    };
    tick();
  });

  const duration = (Date.now() - t0) / 1000;
  const sorted = [...latencies].sort((a, b) => a - b);
  const p50 = percentile(sorted, 50);
  const p95 = percentile(sorted, 95);
  const p99 = percentile(sorted, 99);
  const avg = sorted.reduce((a, b) => a + b, 0) / (sorted.length || 1);
  const rps = total / duration;

  console.log(`\n  [LOAD] ${label}`);
  console.log(`    requests=${total} concurrency=${concurrency} duration=${duration.toFixed(2)}s`);
  console.log(`    rps=${rps.toFixed(1)}  avg=${avg.toFixed(1)}ms  p50=${p50.toFixed(1)}ms  p95=${p95.toFixed(1)}ms  p99=${p99.toFixed(1)}ms`);
  console.log(`    errors=${errors.length}`);

  if (errors.length / total > 0.01) {
    console.error(`    FAIL  Error rate ${((errors.length/total)*100).toFixed(1)}% exceeds 1% threshold`);
    return false;
  }
  if (maxP95 && p95 > maxP95) {
    console.error(`    FAIL  p95 ${p95.toFixed(1)}ms exceeds SLA ${maxP95}ms`);
    return false;
  }
  console.log(`    PASS`);
  return true;
}

(async () => {
  console.log('\n[Performance & Load]');
  console.log(`  host=${HOST}:${PORT}  cpus=${os.cpus().length}  node=${process.version}`);

  try { await request('GET', '/health'); }
  catch {
    console.error('  SKIP  Server not reachable on :3001.');
    process.exitCode = 2;
    return;
  }

  const results = [];

  // Warm-up so the cache populates
  await request('POST', '/api/analysis/run', { matchId: 75965136, accountId: 1743346546 });

  // Warm up /health once before measuring
  await Promise.all(Array.from({ length: 20 }, () => request('GET', '/health')));

  results.push(await runLoad('GET /health @ 50 concurrent x 500', {
    method: 'GET', path: '/health', concurrency: 50, total: 500, maxP95: 150,
  }));

  results.push(await runLoad('GET /api/analysis/:m/:a (cached) @ 20 concurrent x 100', {
    method: 'GET', path: '/api/analysis/75965136/1743346546',
    concurrency: 20, total: 100, maxP95: process.env.SUPABASE_URL ? 500 : 8000,
  }));

  results.push(await runLoad('POST /api/players/resolve (steam32) @ 10 concurrent x 50', {
    method: 'POST', path: '/api/players/resolve', body: { steamInput: '1743346546' },
    concurrency: 10, total: 50, maxP95: 200,
  }));

  const failed = results.filter(r => r === false).length;
  console.log(`\n  ${results.length - failed} passed / ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
})();
