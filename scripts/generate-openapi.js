/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

const SITE_URL = 'https://www.aftermatch.xyz';
const API_URL = 'https://api.aftermatch.xyz';

function main() {
  const spec = swaggerJsdoc({
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Deadlock AfterMatch API',
        version: '1.0.0',
        description:
          'REST API for Deadlock AfterMatch (player resolution, match retrieval, analysis pipeline, trends, and metadata).',
        contact: { name: 'Support', email: 'contact@aftermatch.xyz' },
      },
      servers: [
        { url: API_URL, description: 'Production API Server' },
        { url: 'http://localhost:3001', description: 'Local Development Server' },
      ],
      externalDocs: { description: 'Deadlock AfterMatch', url: SITE_URL },
    },
    apis: [path.join(__dirname, '..', 'server', 'routes', '*.js')],
  });

  const outDir = path.join(__dirname, '..', 'client', 'public');
  const outPath = path.join(outDir, 'openapi.json');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(spec, null, 2) + '\n', 'utf8');
  console.log(`[openapi] wrote ${path.relative(process.cwd(), outPath)}`);
}

main();

