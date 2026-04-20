const http = require('http');
const assert = require('assert');
const config = require('../config');
const { getMatchHistory } = require('../services/deadlockApi.service');

async function main() {
  const server = http.createServer((_req, _res) => {
    // Intentionally never respond.
  });

  await new Promise((resolve) => server.listen(0, resolve));

  const originalBaseUrl = config.deadlockApi.baseUrl;
  const { port } = server.address();
  config.deadlockApi.baseUrl = `http://127.0.0.1:${port}`;

  const startedAt = Date.now();
  try {
    await getMatchHistory(123456789);
    throw new Error('Expected getMatchHistory to timeout, but it resolved.');
  } catch (err) {
    const elapsed = Date.now() - startedAt;
    assert.ok(/timeout/i.test(err.message), `Expected timeout error, got: ${err.message}`);
    assert.ok(elapsed < 30000, `Expected timeout before a long hang, got ${elapsed}ms`);
    console.log('PASS match history times out as expected');
  } finally {
    config.deadlockApi.baseUrl = originalBaseUrl;
    server.close();
  }
}

main().catch((err) => {
  console.error('FAIL match history timeout smoke test');
  console.error(err.stack || err.message || err);
  process.exit(1);
});
