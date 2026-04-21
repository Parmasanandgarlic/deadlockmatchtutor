# Deadlock AfterMatch — Agent Report

Last updated: 2026-04-20

## What this system is
Deadlock AfterMatch is a web app that turns Deadlock match data into readable post-match reports. It is composed of:
- A Vite + React SPA (`client/`) deployed as static assets.
- A Node.js + Express API (`server/`) deployed as a serverless function (Vercel bridge: `api/index.js`).
- A Supabase (Postgres) cache for analysis results.

## Primary user flows
1) Resolve a Steam input to account IDs.
2) Fetch match history.
3) Run or retrieve a cached analysis for a match.
4) Render the report UI and optional share link.

## API surface (for agents/tools)
The authoritative machine interface is the OpenAPI document:
- https://www.aftermatch.xyz/openapi.json

Recommended base URL:
- https://api.aftermatch.xyz

## Safety + compliance notes
- Deadlock AfterMatch is a community project and is not affiliated with Valve.
- The app processes Steam identifiers and match/account IDs to fetch and analyze match data.
- Prefer noindex for user-specific pages (account IDs, match IDs) to avoid infinite indexing.

