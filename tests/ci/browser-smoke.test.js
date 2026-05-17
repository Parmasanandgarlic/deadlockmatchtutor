const assert = require('assert/strict');
const fs = require('fs');
const http = require('http');
const path = require('path');
const { chromium } = require('@playwright/test');

const rootDir = path.resolve(__dirname, '../..');
const distDir = path.join(rootDir, 'client', 'dist');
const port = Number(process.env.CI_BROWSER_PORT || 4173);
const baseUrl = `http://127.0.0.1:${port}`;

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

function serveDist() {
  assert.ok(fs.existsSync(path.join(distDir, 'index.html')), 'client/dist/index.html is missing; run npm run build first');

  const server = http.createServer((req, res) => {
    const requestUrl = new URL(req.url || '/', baseUrl);
    const relativePath = decodeURIComponent(requestUrl.pathname.replace(/^\/+/, ''));
    const candidate = path.resolve(distDir, relativePath || 'index.html');
    const staysInDist = candidate === distDir || candidate.startsWith(`${distDir}${path.sep}`);
    const filePath = staysInDist && fs.existsSync(candidate) && fs.statSync(candidate).isFile()
      ? candidate
      : path.join(distDir, 'index.html');

    res.setHeader('content-type', contentTypes[path.extname(filePath)] || 'application/octet-stream');
    fs.createReadStream(filePath).pipe(res);
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

async function main() {
  const server = await serveDist();
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });

    const rootText = (await page.locator('#root').innerText({ timeout: 10000 })).trim();
    assert.match(rootText, /Deadlock/i, 'built app should render Deadlock copy');
    assert.match(rootText, /AfterMatch/i, 'built app should render AfterMatch copy');

    const searchBox = page.locator('input[type="text"]').first();
    await expectVisible(searchBox, 'landing search input should be visible');
    await searchBox.fill('12345678');
    await assertScreenshotPixels(page);

    console.log('CI browser smoke passed');
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

async function expectVisible(locator, message) {
  await locator.waitFor({ state: 'visible', timeout: 10000 });
  const visible = await locator.isVisible();
  assert.equal(visible, true, message);
}

async function assertScreenshotPixels(page) {
  const screenshot = await page.screenshot({ fullPage: false });
  const sample = screenshot.subarray(0, Math.min(screenshot.length, 4096));
  const uniqueBytes = new Set(sample).size;
  assert.ok(uniqueBytes > 16, 'browser screenshot should not be blank');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
