# Deadlock AfterMatch

Deadlock AfterMatch is an open-source post-match analytics application for Valve's **Deadlock**. It resolves Steam identities, retrieves match data from the Deadlock community API, runs a multi-stage analysis pipeline, and turns raw statistics into player-facing performance grades, trends, and coaching insights.

**Live application:** https://www.aftermatch.xyz

## What it does

- Resolves Steam vanity URLs, Steam64 IDs, and Steam32 account IDs.
- Retrieves recent Deadlock match history and player metadata.
- Analyzes economy, combat, objectives, itemization, matchup difficulty, build paths, temporal performance, and decision quality.
- Produces player profiles with MMR history, hero performance, trend analysis, and shareable match reports.
- Presents analysis through the OSIC-inspired dossier interface while keeping the underlying API and scoring systems independently testable.
- Publishes OpenAPI and agent-discovery metadata for machine-readable integrations.

## Architecture

```text
React / Vite client
        |
        v
Vercel serverless bridge -> Express API
        |                     |
        |                     +-> Analysis / scoring pipeline
        |                     +-> Steam + Deadlock APIs
        |                     +-> Redis cache / sessions
        |                     +-> Supabase / PostgreSQL
        |
        +-> SSR-aware public routing and generated social previews
```

The repository is an npm workspace with separate `client` and `server` packages. Production API traffic is consolidated through `api/index.js`, while `vercel.json` defines routing, headers, function limits, and the scheduled account-sync job.

## Local development

Prerequisites: Node.js 20, npm, and a PostgreSQL/Supabase project. Redis is optional for local development and recommended for production.

```bash
npm install
cp server/.env.example server/.env
npm run dev
```

The client starts on `http://localhost:5173` and the API on `http://localhost:3001`.

At minimum, configure the Supabase values in `server/.env`. Steam authentication additionally requires `STEAM_API_KEY` and `SESSION_SECRET`. See `server/.env.example` and `DEVELOPER_SETUP.md` for the complete configuration contract.

## Database migrations

`node-pg-migrate` is the authoritative schema migration path. Do not manually replay individual migration files against production.

```bash
npx node-pg-migrate up \
  --database-url "$DATABASE_URL" \
  --migrations-dir server/migrations
```

The migration directory contains the schema history used by the application, including the tracked-account table used for scheduled synchronization. Root-level legacy SQL files are retained only as historical references and are not the supported deployment path.

## Scheduled synchronization

Production uses the Vercel Cron configured in `vercel.json` to call `/api/cron/sync`. The endpoint requires `CRON_SECRET` authentication. Users can also request an on-demand refresh for an individual account from the product.

The scheduled job refreshes the oldest active tracked accounts; it is not part of request-critical match analysis and can fail independently without taking the user-facing API offline.

## Environment variables

Important server-side values include:

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Public Supabase key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only service-role key |
| `DATABASE_URL` | Direct PostgreSQL connection used by migrations |
| `STEAM_API_KEY` | Steam Web API authentication |
| `SESSION_SECRET` | Session signing and default CSRF secret |
| `CSRF_SECRET` | Optional dedicated CSRF signing secret |
| `SHARE_TOKEN_SECRET` | Optional dedicated shared-report signing secret |
| `REDIS_URL` | Shared cache, session, and throttling backend |
| `REDIS_REQUIRED` | Fail closed when Redis is unavailable if set to `1`/`true` |
| `CRON_SECRET` | Authenticates the production scheduled sync endpoint |
| `CORS_ORIGIN` | Allowed cross-origin clients |
| `DEADLOCK_API_BASE_URL` | Deadlock community API base URL |

Never commit real credentials. Example values belong only in `server/.env.example`.

## Testing and CI

The repository includes unit, component, integration, API, database, regression, compliance, browser, performance, security, and failover coverage.

```bash
npm test
npm run test:ci:api
npm run test:ci:browser
npm run test:sast
```

GitHub Actions runs the core CI suite on pushes and pull requests. A separate portfolio security workflow scans the current tree and Git history for credential-shaped material and audits production dependencies.

## Project structure

```text
.github/workflows/   CI and security automation
api/                 Vercel serverless entry points
client/              React/Vite application
server/
  controllers/       HTTP handlers
  middleware/        Security, validation, SSR and error handling
  migrations/        Authoritative database migrations
  pipeline/          Analysis, scoring and insight engines
  routes/            API routes
  services/          Steam, Deadlock, Redis and sync services
  utils/             Shared server utilities
docs/adr/             Architecture decision records
scripts/              Maintained build/asset utilities
supabase/             Historical Supabase-specific references
tests/                Automated verification suites
vercel.json           Production deployment and cron configuration
```

## Security model

The server uses input validation, Helmet/security headers, signed CSRF tokens, configurable CORS, rate limiting, server-mediated Supabase access, signed shared-report tokens, and Redis-backed production state where configured. Scheduled synchronization requires an explicit bearer secret and is not trusted based on client-supplied platform-identification headers.

Please report security issues through the process described in `SECURITY.md` rather than opening a public vulnerability report.

## Contributing

Use a feature branch, keep changes narrowly scoped, update relevant documentation, and run the affected tests before opening a pull request. Architecture decisions with long-term consequences should be documented under `docs/adr/`.

---

Deadlock AfterMatch is a community project and is not affiliated with Valve Corporation.
