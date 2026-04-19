# Deadlock AfterMatch

A comprehensive post-match analytics dashboard for **Deadlock**. Fetches match data directly from the Deadlock API, runs an analysis pipeline evaluating Economy, Itemization, Combat, and Objectives, and surfaces the most critical "Game Losing Mistakes" in plain English.

**Live Site**: https://www.aftermatch.xyz

## How to Use

### Finding Your Steam Profile

1. **Open Steam** and go to your profile (click your username in the top right)
2. **Copy your profile URL** from the address bar
   - It will look like: `https://steamcommunity.com/id/yourusername` (custom URL)
   - Or: `https://steamcommunity.com/profiles/76561198000000000` (Steam64 ID)
3. **Paste it** into the search box on https://www.aftermatch.xyz

### Accepted Input Formats

- **Steam Vanity URL**: `https://steamcommunity.com/id/yourusername`
- **Steam64 ID**: `76561198000000000` (17 digits, found in your profile URL)
- **Steam32 ID**: `12345678` (8-10 digits, commonly used in Deadlock)

### Analyzing Your Matches

1. Enter your Steam profile URL or ID on the homepage
2. Browse your recent match history
3. Click on any match to view the full analysis
4. Review your performance grades and actionable insights

### What You'll See

- **Overall Grade**: A+ to F letter grade based on your match impact
- **Module Scores**: Economy, Itemization, Combat, and Benchmarks
- **Insights**: Plain-English recommendations for improvement
- **Match Details**: KDA, net worth, damage, and more

## Architecture

```
┌─────────────┐      ┌──────────────────────────────────────────────┐
│  React SPA  │◄────►│  Node.js / Express Backend (Serverless)       │
│  (Vite)     │ JSON │                                              │
│  Port 5173  │      │  ┌────────────┐  ┌────────────────────────┐ │
└─────────────┘      │  │ REST API   │  │ Analysis Pipeline       │ │
                     │  │ Routes     │──►  Economy Analyzer      │ │
                     │  └────────────┘  │  Itemization Analyzer  │ │
                     │                  │  Combat Analyzer       │ │
                     │  ┌────────────┐  │  Objectives Analyzer   │ │
                     │  │ Services   │  │  Insights Engine       │ │
                     │  │ Steam API  │  │  Scoring Engine        │ │
                     │  │ Deadlock   │  └────────────────────────┘ │
                     │  │ API        │                              │
                     │  └────────────┘       Port 3001              │
                     │  ┌────────────┐                              │
                     │  │ Supabase   │◄────┐                       │
                     │  │ Cache/DB   │     │                       │
                     │  └────────────┘     │                       │
                     └─────────────────────┼───────────────────────┘
                                           │
                     ┌─────────────────────┴─────────────────────┐
                     │  External APIs                               │
                     │  deadlock-api.com (community API)            │
                     │  Steam Web API (vanity resolution)          │
                     └─────────────────────────────────────────────┘
```

## Quick Start

### Local Development

```bash
# Install all dependencies
npm install

# Create environment file
cp server/.env.example server/.env

# Edit server/.env with your Supabase credentials
# Required: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

# Run both client & server in dev mode
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

### Vercel Deployment

The application is deployed at **https://www.aftermatch.xyz**

To deploy your own instance:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel

# Set environment variables in Vercel dashboard:
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - DEADLOCK_API_BASE_URL (default: https://api.deadlock-api.com)
# - RATE_LIMIT_WINDOW_MS (default: 900000)
# - RATE_LIMIT_MAX_REQUESTS (default: 100)
```

## Data Flow

1. **Resolve** — Convert Steam vanity URL, Steam32, or Steam64 ID to standardized format
2. **Match List** — Fetch recent matches from Deadlock community API
3. **Fetch Match Data** — Retrieve match info, player stats, hero stats, rank prediction from API
4. **Analyze** — Run analysis pipeline; generate scores & insights JSON
5. **Cache** — Store results in Supabase for fast retrieval on subsequent requests
6. **Render** — Serve JSON to React frontend for visualization

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router |
| Charts | Recharts |
| Backend | Node.js, Express |
| API Integration | Axios, OpenAPI-generated Deadlock API client |
| Database/Cache | Supabase (PostgreSQL) |
| Deployment | Vercel (serverless functions) |
| Security | Helmet, CORS, express-rate-limit |

## Project Structure

```
deadlock-match-tutor/
├── api/               # Vercel Serverless entry point (bypasses Hobby limits)
│   └── index.js       # Bridge exporting the unified Express app
├── client/            # React SPA (Vite)
│   ├── src/
│   │   ├── api/       # Backend HTTP client
│   │   ├── components/# UI components
│   │   ├── hooks/     # Custom React hooks
│   │   ├── pages/     # Route-level pages
│   │   └── utils/     # Formatters, constants
│   └── ...
├── server/            # Express API + Analysis Pipeline
│   ├── config/        # App configuration
│   ├── controllers/   # Request handlers
│   ├── middleware/    # Error handling, validation, rate limiting
│   ├── pipeline/      # Analysis modules & scoring
│   ├── routes/        # API route definitions
│   ├── services/      # External API integrations (Steam, Deadlock)
│   └── utils/         # Helpers, logger, constants
├── supabase/          # Database definitions and security
│   └── fix_rls_analyses.sql # RLS bypass security script
├── tests/             # Comprehensive test suite
│   ├── unit/          # Unit tests (helpers, scoring)
│   ├── component/     # Component tests (validation, error handler)
│   ├── sast/          # Static Application Security Testing
│   ├── integration/   # Integration tests (pipeline)
│   ├── api/           # API endpoint tests
│   ├── database/      # Database tests (Supabase)
│   ├── performance/   # Performance & Load tests, Stress tests
│   ├── security/      # DAST / Penetration tests
│   ├── failover/      # Disaster Recovery & Failover tests
│   └── run-all.js     # Master test runner
├── setup-supabase.js  # Script to initialize Supabase schema
├── vercel.json        # Vercel deployment configuration
└── package.json       # Workspace root
```

## Environment Variables

| Variable | Required | Description | Default |
|---|---|---|---|
| `PORT` | No | Server port | `3001` |
| `NODE_ENV` | No | Environment (development/production) | `development` |
| `DEADLOCK_API_BASE_URL` | No | Deadlock community API URL | `https://api.deadlock-api.com` |
| `SUPABASE_URL` | Yes | Supabase project URL | - |
| `SUPABASE_ANON_KEY` | Yes | Supabase anon/public key | - |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (bypasses RLS) | - |
| `CORS_ORIGIN` | No | Comma-separated allowed CORS origins | `http://localhost:5173` (dev) / `true` (prod) |
| `RATE_LIMIT_WINDOW_MS` | No | Rate limit window in milliseconds | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | No | Max requests per window per IP | `100` |

## Testing

The project includes a comprehensive test suite covering unit, component, integration, API, database, performance, stress, security, and disaster recovery scenarios.

### Run All Tests

```bash
npm test
```

### Run Individual Test Suites

```bash
npm run test:unit        # Unit tests (helpers, scoring)
npm run test:component   # Component tests (validation, error handler)
npm run test:sast        # Static Application Security Testing
npm run test:integration # Integration tests (pipeline)
npm run test:api         # API endpoint tests
npm run test:db          # Database tests (Supabase)
npm run test:load        # Performance & Load tests
npm run test:stress      # Stress tests
npm run test:dast        # DAST / Penetration tests
npm run test:failover    # Disaster Recovery & Failover tests
```

### Test Coverage

| Suite | Tests | Coverage |
|---|---|---|
| Unit: helpers | 15 | Steam ID normalization, validation |
| Unit: scoring | 7 | Impact score calculation, grading |
| Component: validation | 6 | Middleware validation logic |
| Component: errorHandler | 3 | Error handling middleware |
| SAST: static scan | 10 rules | Hardcoded secrets, SQL injection, etc. |
| Integration: pipeline | 5 | End-to-end pipeline logic |
| API: http | 10 | All API endpoints |
| Database: supabase | 6 | CRUD operations, constraints |
| Performance: load | 3 | Latency, throughput, error rates |
| Stress: burst/limits | 5 | Burst requests, oversized payloads, recovery |
| DAST: pen test | 10 | XSS, SQLi, path traversal, headers |
| Failover: DR | 4 | Supabase/API outage, fallback cache |

**Total: 62 tests across 12 suites**

## Key Features

### Fault Tolerance

- **Private Profiles**: Gracefully handles 403 Forbidden responses from the Deadlock API for private player profiles
- **Fallback Cache**: In-memory cache automatically activates when Supabase is unavailable
- **Rate Limiting**: Built-in rate limiting prevents abuse and API exhaustion
- **Error Handling**: Comprehensive error handling with production-safe error responses

### Input Support

- **Steam Vanity URLs**: e.g., `https://steamcommunity.com/id/username`
- **Steam32 IDs**: 8-10 digit account IDs (commonly used in Deadlock)
- **Steam64 IDs**: 17-digit Steam IDs

### Security

- **Helmet**: Security headers (CSP, HSTS, X-Frame-Options, etc.)
- **CORS**: Configurable origin validation
- **Rate Limiting**: Per-IP request throttling
- **Input Validation**: Strict validation on all inputs
- **SQL Injection Protection**: Parameterized queries via Supabase client

### Performance

- **Supabase Caching**: Analysis results cached for fast retrieval
- **Efficient API Calls**: Batch API calls where possible
- **Graceful Degradation**: Fallback mechanisms ensure availability

## Deployment Notes

### Vercel Configuration

- **Max Duration**: 60 seconds per function
- **Memory**: 1024 MB
- **API Routes**: All `/api/*` routes are consolidated into a single Serverless Function (`api/index.js`) to prevent exceeding the Vercel Hobby plan 12-function limit.
- **Static Assets**: React build served from root
- **SPA Routing**: All non-API routes fall back to `/index.html`

### Database Setup (Supabase)

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Create an `analyses` table with the following schema:

```sql
CREATE TABLE analyses (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  match_id BIGINT NOT NULL,
  account_id BIGINT NOT NULL,
  analysis_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id, account_id)
);

CREATE INDEX idx_analyses_match_account ON analyses(match_id, account_id);
```

3. Retrieve your `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` from the Supabase dashboard
4. Add them to your environment variables (locally or in Vercel)

## Key Limitations

- **API Availability**: Depends on the Deadlock community API availability
- **Rate Limits**: API may have rate limits; configure `RATE_LIMIT_MAX_REQUESTS` accordingly
- **Private Profiles**: Private player profiles will return partial data (account stats, rank prediction, player card will be empty)
- **Match History**: Only matches available through the Deadlock API can be analyzed

## Troubleshooting

### COMMON ISSUES

- **Deadlock API (500 Error)**: The community API may occasionally be offline or under heavy load. If analysis fails with a 500 error, check the [Deadlock API Status](https://deadlock-api.com) and try again later.
- **Match Not Found**: Matches typically take 2-5 minutes to appear in the community API after a game ends. If your recent match is missing, wait a few minutes and refresh.
- **Supabase Connectivity**: Ensure your `SUPABASE_SERVICE_ROLE_KEY` is correct. If the server logs "Bypassing RLS", the service role key is required for original analysis caching.
- **Rate Limits**: If you see "Too many requests", your IP has exceeded the 100 requests/15 min limit. This is configurable via `RATE_LIMIT_MAX_REQUESTS`.

### DEBUGGING

To enable detailed debug logs, set the following environment variable:
```bash
# In your .env file
DEBUG=true
```
Server logs are handled by `winston` and `morgan`. In development mode, you will see colorized HTTP logs in your terminal. For production (Vercel), logs are accessible via the Vercel Dashboard under **Logs**.

## Contributing

We welcome contributions! To ensure a smooth process, please follow these guidelines:

### DEVELOPMENT WORKFLOW

1. **Fork & Clone**: Create a personal fork of the repository.
2. **Feature Branch**: Create a branch for your feature (`git checkout -b feat/my-new-feature`).
3. **Draft PR**: If your work is in progress, open a Draft PR to get early feedback.
4. **Tests**: Ensure all tests pass before requesting a review.

### PR CHECKLIST

- [ ] All tests pass (`npm test`)
- [ ] Code follows existing style (linting)
- [ ] Documentation updated (if applicable)
- [ ] PR description clearly explains the "why" behind the change
- [ ] No sensitive credentials/keys committed

### ARCHITECTURE DECISIONS (ADRs)

Key architectural decisions (such as the choice of Supabase and Vercel) are documented in the [docs/adr/](docs/adr/) directory. Please refer to these before proposing major structural changes.

---

*Deadlock AfterMatch is a community project and is not affiliated with Valve Corporation.*
