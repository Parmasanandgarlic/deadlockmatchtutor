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

-- Enable Row Level Security (optional, can be disabled for server-side use)
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for service role (bypasses RLS)
-- This is safe since we use service role key on the server
CREATE POLICY "Service role can do everything" ON analyses
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
