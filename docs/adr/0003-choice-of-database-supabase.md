# ADR 0003: Choice of Database (Supabase)

## Status
Accepted

## Context
Analysis results are expensive to compute (multi-API calls + scoring logic). We need a persistent storage layer to cache these results so they can be retrieved instantly and shared via unique URLs.

## Decision
We chose **Supabase** (PostgreSQL) as our primary database and caching layer.

## Rationale
- **Managed PostgreSQL**: Provides a robust, standard SQL relational database without management overhead.
- **JSONB Support**: Our analysis payloads are complex, nested JSON objects. PostgreSQL's JSONB format allows for efficient storage and indexing of these payloads.
- **Row Level Security (RLS)**: Built-in security layers to control data access.
- **Service Role Bypass**: Allows the backend server to bypass RLS for administrative tasks (like persistent caching) while keeping data secure from direct client access.

## Consequences
- Requires a Supabase project and credential management (Environment Variables).
- Adds an external dependency that must be handled gracefully in case of outages (mitigated by the in-memory fallback cache).
