-- Create analyses table for caching match analysis results
CREATE TABLE IF NOT EXISTS analyses (
  match_id BIGINT NOT NULL,
  account_id BIGINT NOT NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (match_id, account_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_analyses_updated_at ON analyses(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_match_account ON analyses(match_id, account_id);

-- Player-first index: enables efficient queries for all analyses by a given player.
-- The composite PK (match_id, account_id) only helps when match_id is the leading column.
CREATE INDEX IF NOT EXISTS idx_analyses_account_id ON analyses(account_id, updated_at DESC);

-- Enable Row Level Security (optional, can be disabled for server-side use)
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for service role (bypasses RLS)
-- This is safe since we use service role key on the server
CREATE POLICY "Service role can do everything" ON analyses
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- Tracked accounts: populated automatically when users search for a player.
-- The daily cron job (/api/cron/sync) reads this table to refresh match data
-- for the most stale accounts.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tracked_accounts (
  account_id BIGINT PRIMARY KEY,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for the cron sync query: active accounts ordered by oldest sync first
CREATE INDEX IF NOT EXISTS idx_tracked_accounts_sync
  ON tracked_accounts(is_active, last_synced_at ASC)
  WHERE is_active = true;

-- RLS + service role policy (same pattern as analyses)
ALTER TABLE tracked_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can do everything" ON tracked_accounts
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
