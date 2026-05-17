const assert = require('assert/strict');
const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '../..');
const port = Number(process.env.CI_API_PORT || 3211);
const baseUrl = `http://127.0.0.1:${port}`;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return;
      lastError = new Error(`Health returned ${response.status}`);
    } catch (err) {
      lastError = err;
    }
    await delay(500);
  }

  throw lastError || new Error('Server did not become ready');
}

async function readJson(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch (err) {
    err.message = `Failed to parse JSON response: ${text}`;
    throw err;
  }
}

async function main() {
  const server = spawn(process.execPath, [path.join(rootDir, 'server/index.js')], {
    cwd: rootDir,
    env: {
      ...process.env,
      NODE_ENV: 'development',
      PORT: String(port),
      SESSION_SECRET: 'ci-session-secret',
      CSRF_SECRET: 'ci-csrf-secret',
      SHARE_TOKEN_SECRET: 'ci-share-token-secret',
      CORS_ORIGIN: `http://127.0.0.1:${port}`,
      REDIS_URL: '',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const output = [];
  server.stdout.on('data', (chunk) => output.push(chunk.toString()));
  server.stderr.on('data', (chunk) => output.push(chunk.toString()));

  try {
    await waitForServer();

    const health = await fetch(`${baseUrl}/api/health`);
    assert.equal(health.status, 200, '/api/health should be reachable');
    assert.equal((await readJson(health)).status, 'ok');

    const csrf = await fetch(`${baseUrl}/api/csrf`);
    assert.equal(csrf.status, 200, '/api/csrf should issue a token');
    const cookie = csrf.headers.get('set-cookie')?.split(';')[0];
    const { csrfToken } = await readJson(csrf);
    assert.ok(cookie, 'CSRF response should set a cookie');
    assert.ok(csrfToken, 'CSRF response should include a token');

    const csrfHeaders = {
      'content-type': 'application/json',
      cookie,
      'x-csrf-token': csrfToken,
    };

    const shareInvalid = await fetch(`${baseUrl}/api/analysis/share`, {
      method: 'POST',
      headers: csrfHeaders,
      body: JSON.stringify({ matchId: 'nope', accountId: 'also-nope' }),
    });
    assert.equal(shareInvalid.status, 400, 'share endpoint should validate IDs before signing');

    const share = await fetch(`${baseUrl}/api/analysis/share`, {
      method: 'POST',
      headers: csrfHeaders,
      body: JSON.stringify({ matchId: 123, accountId: 456 }),
    });
    assert.equal(share.status, 200, 'share endpoint should sign valid report IDs');
    const sharePayload = await readJson(share);
    assert.ok(sharePayload.token, 'share endpoint should return a token');
    assert.match(sharePayload.path, /^\/report\/123\/456\?token=/);

    const blocked = await fetch(`${baseUrl}/api/analysis/123/456`);
    assert.equal(blocked.status, 401, 'shared report reads should require signed tokens');
    assert.equal((await readJson(blocked)).code, 'SHARE_TOKEN_REQUIRED');

    const sharedRead = await fetch(`${baseUrl}/api/analysis/123/456?token=${encodeURIComponent(sharePayload.token)}`);
    assert.equal(sharedRead.status, 404, 'valid share token should reach the cache lookup');

    const runInvalid = await fetch(`${baseUrl}/api/analysis/run`, {
      method: 'POST',
      headers: csrfHeaders,
      body: JSON.stringify({ matchId: 'bad', accountId: 456 }),
    });
    assert.equal(runInvalid.status, 400, 'analysis run should validate IDs without calling upstream APIs');

    console.log('CI API smoke passed');
  } finally {
    server.kill();
    await delay(300);
    if (server.exitCode === null) {
      server.kill('SIGKILL');
    }
    if (process.env.DEBUG_CI_SMOKE) {
      process.stdout.write(output.join(''));
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
