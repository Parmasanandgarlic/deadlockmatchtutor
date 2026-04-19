# ADR 0005: Single Function Bridge for Vercel Deployment

## Status
Accepted

## Context
Vercel Hobby plans have a limit of 12 Serverless Functions per deployment. A complex API with many separate route files could easily exceed this limit if each route were deployed as a separate function.

## Decision
We use a **Single Function Bridge** pattern. All API requests are routed to a single entry point (`api/index.js`), which imports and runs the unified Express application from the `server/` directory.

## Rationale
- **Stay under limits**: Ensures the entire backend only counts as one function toward the Vercel limit.
- **Simplified Routing**: Leverages Express's robust routing system rather than Vercel's file-based routing, making the app more portable (can run locally without Vercel-specific logic).
- **Consistent Middleware**: Global middleware (like Sentry, Helmet, and Rate Limiting) is consistently applied to all routes.

## Consequences
- **Cold Start Impact**: A single, larger function may have a slightly longer cold start time than multiple tiny functions, though this is negligible for this application's scale.
- **Resource Contention**: All routes share the same memory and CPU allocation for the single function.
