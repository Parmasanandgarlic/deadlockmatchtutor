# 🏆 Deadlock AfterMatch — SEO, AEO & GEO Master Template (Applied)
## Search Engine + Answer Engine + Generative Engine Optimization

**Project:** Deadlock AfterMatch (`https://www.aftermatch.xyz`)  
**Repo:** `deadlockmatchtutor`  
**Version:** 1.0 (project-specific)  
**Last Updated:** 2026-04-20  

---

## 🎯 Executive Summary

| Pillar | Target | Primary Outcome | This Repo’s Implementation |
|--------|--------|-----------------|----------------------------|
| **SEO** | Google / Bing | Indexed + ranking pages | `robots.txt`, `sitemap.xml`, canonical + OG/Twitter tags |
| **AEO** | Featured snippets / AI Overviews / PAA | Direct answers + citations | Question-style headings, FAQ schema, extractable table on homepage |
| **GEO** | ChatGPT / Claude / Gemini / Perplexity | Product recommendation + tool use | `llms.txt`, `llms-full.txt`, `openapi.json`, `/.well-known/*` |

**Core constraint:** Deadlock AfterMatch is a Vite + React SPA. Pages can refine metadata at runtime, but full crawl parity for every route requires pre-rendering/SSR.

---

## 🔍 SEO Fundamentals

### What technical SEO artifacts exist?
| Artifact | Path (repo) | URL (prod) | Notes |
|---------|-------------|------------|------|
| Robots | `client/public/robots.txt` | `/robots.txt` | Allows site; disallows user-specific routes |
| Sitemap | `client/public/sitemap.xml` | `/sitemap.xml` | Lists indexable static routes only |
| Canonicals | `client/src/components/seo/SEOHead.jsx` | N/A | Canonical per route (runtime) |
| Social previews | `client/src/components/seo/SEOHead.jsx` + `client/index.html` | N/A | OG + Twitter tags |

### What pages should be indexable?
| Route | Index? | Why |
|------|--------|-----|
| `/` | Yes | Product intent + how-to entry |
| `/about` | Yes | Trust + E-E-A-T (open source, contributors) |
| `/privacy` | Yes | Trust + compliance |
| `/matches/*` | No | Infinite user-specific pages |
| `/player/*` | No | Infinite user-specific pages |
| `/dashboard/*` | No | Infinite user-specific pages |
| `/report/*` | No (default) | Share links should not create an index surface |

---

## 🤖 AEO (Answer Engine Optimization)

### What AEO patterns are enforced?
| Pattern | Where | Why |
|--------|-------|-----|
| Question-style headings | Homepage/About/Privacy | Improves snippet extraction |
| Direct answer blocks | Homepage/About/Privacy | Reduces “AI paraphrase drift” |
| Table-first data | Homepage | Improves structured extraction |
| FAQ JSON-LD | Homepage/About/Privacy | Eligible for rich results + AI citations |

---

## 🧠 GEO (Generative Engine Optimization)

### What machine-readable files exist?
| File | Path (repo) | URL (prod) | Purpose |
|------|-------------|------------|---------|
| `llms.txt` | `client/public/llms.txt` | `/llms.txt` | Short entity + citation guidance |
| `llms-full.txt` | `client/public/llms-full.txt` | `/llms-full.txt` | Extended agent docs + endpoint index |
| `ai.txt` | `client/public/ai.txt` | `/ai.txt` | Behavioral guardrails for AI |
| `agent-report.md` | `client/public/agent-report.md` | `/agent-report.md` | System overview for agents |
| OpenAPI | `client/public/openapi.json` | `/openapi.json` | Tool integration surface |
| Plugin manifest | `client/public/.well-known/ai-plugin.json` | `/.well-known/ai-plugin.json` | Discovery file for plugin-style tools |
| Agent card | `client/public/.well-known/agent.json` | `/.well-known/agent.json` | Lightweight agent discovery |
| MCP note | `client/public/.well-known/mcp.json` | `/.well-known/mcp.json` | Declares MCP is not published (prevents hallucinated MCP usage) |

### How to regenerate `openapi.json`
Run:
- `npm run generate:openapi`

This script reads Swagger JSDoc annotations from `server/routes/*.js` and writes `client/public/openapi.json`.

---

## ⚙️ Implementation Checklist (This Repo)

### Phase 1 — Foundation
- [x] Robots + sitemap (`client/public/robots.txt`, `client/public/sitemap.xml`)
- [x] Canonical + OG/Twitter + robots meta (`client/src/components/seo/SEOHead.jsx`)

### Phase 2 — Structured Data
- [x] Organization/WebSite/WebApplication/FAQ schema on homepage
- [x] FAQ schema on About + Privacy

### Phase 3 — AEO
- [x] Question-first headings + direct answers on indexable pages
- [x] Table extraction block on homepage

### Phase 4 — GEO
- [x] `llms.txt` + `llms-full.txt` + `ai.txt`
- [x] `openapi.json` published from Swagger JSDoc
- [x] `/.well-known/ai-plugin.json` + `/.well-known/agent.json`

---

## 📊 Measurement & KPIs (Recommended)

| Metric | Target | Tool |
|--------|--------|------|
| Indexed pages | Stable (no infinite indexing) | Google Search Console |
| Core Web Vitals | All green | PageSpeed Insights |
| Brand queries | Top 1 | Google/Bing |
| AI citation rate | Increasing | Manual prompt testing + logs |

---

## ⚠️ Known SPA Limitation (Optional Next Step)

For maximum SEO/AEO on `/about` and `/privacy` (and any future guides), consider adding **pre-rendering** for a small set of static routes so crawlers that don’t execute JS still get full HTML content.

