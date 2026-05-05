# ADR 0006: Module System, TypeScript, and API Documentation

## Status

Accepted

## Context

The repository has three JavaScript execution contexts:

- The Express API, tests, migrations, and operational scripts run in Node.
- The React client runs through Vite.
- The generated Deadlock API client is emitted as CommonJS.

Mixing implicit module modes makes local tooling and production startup harder to reason about.

## Decision

- Root tooling and the server package are explicitly CommonJS via `type: "commonjs"`.
- The client package remains ESM via its existing `type: "module"` because Vite and React source files use native `import`/`export`.
- TypeScript is introduced as a no-emit checker with `allowJs` so existing JavaScript can be checked gradually before individual files are migrated.
- OpenAPI generation is centralized in `server/docs/openapi.js`. The server serves the same generated contract at `/openapi.json`, `/api/openapi.json`, and `/api-docs`, while `npm run generate:openapi` writes `client/public/openapi.json`.

## Consequences

- Node no longer infers module format from file contents.
- Future backend TypeScript migration can happen file-by-file without changing runtime startup.
- API consumers have a generated JSON contract and Swagger UI backed by the same source.
