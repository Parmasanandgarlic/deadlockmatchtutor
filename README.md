# Deadlock Post-Match Analyzer

A comprehensive post-match analytics dashboard for **Deadlock**. Ingests raw `.dem` replay files, runs an ETL pipeline evaluating Economy, Itemization, Combat, and Objectives, and surfaces the most critical "Game Losing Mistakes" in plain English.

## Architecture

```
┌─────────────┐      ┌──────────────────────────────────────────────┐
│  React SPA  │◄────►│  Node.js / Express Backend                   │
│  (Vite)     │ JSON │                                              │
│  Port 5173  │      │  ┌────────────┐  ┌────────────────────────┐ │
└─────────────┘      │  │ REST API   │  │ ETL Pipeline           │ │
                     │  │ Routes     │──►  Economy Analyzer      │ │
                     │  └────────────┘  │  Itemization Analyzer  │ │
                     │                  │  Combat Analyzer       │ │
                     │  ┌────────────┐  │  Objectives Analyzer   │ │
                     │  │ Services   │  │  Insights Engine       │ │
                     │  │ Steam API  │  │  Scoring Engine        │ │
                     │  │ Deadlock   │  └────────────────────────┘ │
                     │  │ Replay DL  │                              │
                     │  └────────────┘       Port 3001              │
                     └──────────────────────────────────────────────┘
                                │
                     ┌──────────▼──────────┐
                     │  External APIs       │
                     │  deadlock-api.com    │
                     │  Valve CDN (.dem)    │
                     └─────────────────────┘
```

## Quick Start

```bash
# Install all dependencies
npm install

# Create environment file
cp server/.env.example server/.env

# Run both client & server in dev mode
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## Data Flow

1. **Resolve** — Convert Steam vanity URL → Steam64 ID
2. **Match List** — Fetch recent matches from `deadlock-api.com`
3. **Metadata** — Fetch match salt for CDN download
4. **Download** — Pull `.dem.bz2` from Valve CDN to server temp dir
5. **Parse** — Decompress & parse Source 2 replay binary
6. **Analyze** — Run ETL pipeline; generate scores & insights JSON
7. **Render** — Serve JSON to React frontend for visualization

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router |
| Charts | Recharts |
| Backend | Node.js, Express |
| Replay Parser | `@laihoe/demoparser2` (Source 2) |
| HTTP Client | Axios |

## Project Structure

```
deadlock-match-tutor/
├── client/            # React SPA (Vite)
│   ├── src/
│   │   ├── api/       # Backend HTTP client
│   │   ├── components/# UI components
│   │   ├── hooks/     # Custom React hooks
│   │   ├── pages/     # Route-level pages
│   │   └── utils/     # Formatters, constants
│   └── ...
├── server/            # Express API + ETL Pipeline
│   ├── config/        # App configuration
│   ├── controllers/   # Request handlers
│   ├── middleware/     # Error handling, validation
│   ├── pipeline/      # Analysis modules & scoring
│   ├── routes/        # API route definitions
│   ├── services/      # External API integrations
│   ├── temp/          # Transient .dem storage
│   └── utils/         # Helpers, logger, constants
└── package.json       # Workspace root
```

## Key Limitations

- **Replay Expiry**: Valve CDN replays expire after ~7 days. Older matches will show a clear error.
- **File Size**: `.dem` files are 40–80 MB. Temp files are deleted immediately after parsing.
- **Parser Updates**: Source 2 patches may break parsers. Monitor upstream library releases.
