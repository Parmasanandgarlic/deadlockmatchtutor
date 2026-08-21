# Changelog

## 2026-08-21

- Consolidated scheduled account synchronization onto the production Vercel Cron and removed the redundant 30-minute GitHub Actions scheduler.
- Hardened `/api/cron/sync` to require an explicitly configured bearer secret and reject spoofable platform-identification headers.
- Removed generated bundle output, one-off scratch verification code, obsolete setup tooling, and completed internal planning/review documents.
- Consolidated contributor setup guidance around the maintained `node-pg-migrate` workflow and refreshed repository documentation.
- Kept the portfolio security audit active on `main` and added CI coverage for cron authentication boundaries.

## 2026-04-24

- Completed a technical SEO, AEO, GEO, performance, and UX/accessibility pass for the React/Vite client.
- Added dedicated `/faq`, `/updates`, and in-app 404 routes with route-specific metadata, canonical URLs, schema, and internal links.
- Updated `sitemap.xml`, `robots.txt`, Vercel rewrites, cache headers, image attributes, focus states, form semantics, and public-page answer blocks.
- Confirmed no core application logic, auth flows, API integrations, or API contracts were intentionally modified.
