# Developer Setup

This guide is the maintained setup reference for contributors to Deadlock AfterMatch.

## Prerequisites

- Node.js 20.x
- npm
- PostgreSQL or Supabase
- Steam Web API key for authentication flows
- Redis for production-grade shared state; local development can use the in-memory fallback

## Install and run

From the repository root:

```bash
npm install
cp server/.env.example server/.env
npm run dev
```

The client runs at `http://localhost:5173` and the API at `http://localhost:3001`.

Populate `server/.env` with local credentials. Never commit `.env` files or real secrets. When adding configuration, update `server/.env.example` using placeholder values only.

## Database migrations

`node-pg-migrate` is the authoritative migration runner. Files in `server/migrations/` form the migration history and may include JavaScript and SQL migrations. Do not manually execute individual files from that directory against production.

Apply pending migrations:

```bash
npx node-pg-migrate up \
  --database-url "$DATABASE_URL" \
  --migrations-dir server/migrations
```

Check migration status:

```bash
npx node-pg-migrate status \
  --database-url "$DATABASE_URL" \
  --migrations-dir server/migrations
```

Roll back the latest reversible migration in a development environment:

```bash
npx node-pg-migrate down \
  --database-url "$DATABASE_URL" \
  --migrations-dir server/migrations
```

Create a migration:

```bash
npx node-pg-migrate create my-migration-name \
  --migrations-dir server/migrations
```

The root `supabase-schema.sql` file and `supabase/fix_rls_analyses.sql` are historical Supabase references. They are not the supported production migration path.

## Scheduled synchronization

Production account refreshes are scheduled by Vercel through the `crons` configuration in `vercel.json`.

Set a strong `CRON_SECRET` in the production environment. `/api/cron/sync` accepts the scheduled request only when the `Authorization` header exactly matches `Bearer <CRON_SECRET>`; platform-identification headers are not treated as authentication.

Generate a suitable local value with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Redis

Redis provides shared cache, session, and throttling state. Local development may omit `REDIS_URL` and use the development fallback. For deployments where shared Redis is mandatory, set `REDIS_REQUIRED=1` so the application fails closed rather than silently degrading.

## Verification

Run the full repository test runner:

```bash
npm test
```

Useful targeted checks:

```bash
npm run typecheck
npm run test:unit
npm run test:component
npm run test:integration
npm run test:ci:api
npm run test:ci:browser
npm run test:sast
```

A production-facing change should at minimum build successfully and pass the directly affected test suites. Security-sensitive changes should also pass the SAST and portfolio security workflows.

## Repository hygiene

Generated bundle reports, local environment files, build output, temporary files, and local editor state are intentionally ignored. Do not commit generated artifacts unless they are required at runtime.

Long-lived architecture decisions belong in `docs/adr/`. Temporary implementation notes, completed plans, one-off debugging scripts, and generated reports should not be retained in the repository once their purpose has passed.

## Troubleshooting

- **Backend not reachable:** verify port `3001` is available and the server process started successfully.
- **Steam authentication fails:** verify `STEAM_API_KEY`, session secrets, callback origin, and cookie settings.
- **Database errors:** verify `DATABASE_URL` for migrations and the Supabase server credentials used by the application.
- **Redis errors:** verify `REDIS_URL`; if `REDIS_REQUIRED=1`, an unavailable Redis service is intentionally fatal.
- **Scheduled sync returns 401/503:** verify `CRON_SECRET` is configured and the request uses the correct bearer token.

See `README.md`, `SECURITY.md`, and `docs/adr/` for product, security, and architecture context.
