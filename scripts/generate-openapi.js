/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { createOpenApiSpec } = require('../server/docs/openapi');

function main() {
  const spec = createOpenApiSpec({ isDev: false, port: 3001 });

  const outDir = path.join(__dirname, '..', 'client', 'public');
  const outPath = path.join(outDir, 'openapi.json');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(spec, null, 2) + '\n', 'utf8');
  console.log(`[openapi] wrote ${path.relative(process.cwd(), outPath)}`);
}

main();
