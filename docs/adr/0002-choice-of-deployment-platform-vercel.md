# ADR 0002: Choice of Deployment Platform (Vercel)

## Status
Accepted

## Context
The project requires a hosting solution that can handle both a React frontend (SPA) and a Node.js/Express backend, with support for serverless execution to minimize costs during development and early production.

## Decision
We chose **Vercel** as the primary deployment platform.

## Rationale
- **Serverless Scaling**: Vercel's serverless functions allow the backend to scale automatically without managing infrastructure.
- **Hobby Plan Compatibility**: By consolidating all API routes into a single entry point (`api/index.js`), we bypass the Hobby plan's 12-function limit.
- **Edge Capabilities**: Vercel provides excellent support for static asset hosting and global CDN distribution for the React client.
- **CI/CD Integration**: Seamless integration with GitHub for automated deployments on push and PR.

## Consequences
- Requires structuring the Express app to be exported as a single handler.
- Function execution time is limited (max 60s), which impacts the analysis pipeline for very long matches.
- Filesystem is read-only (non-persistent), requiring external caching (Supabase) for analysis state.
