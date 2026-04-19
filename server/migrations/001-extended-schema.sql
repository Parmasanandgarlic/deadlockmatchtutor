-- ============================================
-- EXTENDED DATABASE SCHEMA FOR AFTERMATCH.XYZ
-- ============================================
-- This schema extends the existing analyses table with:
-- 1. User accounts (Steam-linked)
-- 2. Player profiles cache
-- 3. Favorites/bookmarks system
-- 4. Enhanced match history cache
-- 5. Session management
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE - Steam authentication
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  steam_id BIGINT UNIQUE NOT NULL,
  steam_username VARCHAR(255),
  avatar_url TEXT,
  profile_url TEXT,
  persona_state INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_login_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  is_premium BOOLEAN DEFAULT FALSE,
  premium_expires_at TIMESTAMP WITH TIME ZONE,
  settings JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_steam_id ON users(steam_id);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- ============================================
-- 2. PLAYER PROFILES CACHE
-- ============================================
CREATE TABLE IF NOT EXISTS player_profiles (
  account_id BIGINT PRIMARY KEY,
  steam_id BIGINT,
  profile_data JSONB NOT NULL,
  match_count INTEGER DEFAULT 0,
  last_match_id BIGINT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  heroes_played JSONB DEFAULT '[]'::jsonb,
  rank_tier INTEGER,
  leaderboard_rank INTEGER
);

CREATE INDEX IF NOT EXISTS idx_player_profiles_last_updated ON player_profiles(last_updated DESC);
CREATE INDEX IF NOT EXISTS idx_player_profiles_rank ON player_profiles(rank_tier DESC NULLS LAST);

-- ============================================
-- 3. FAVORITES / BOOKMARKS
-- ============================================
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  favorite_type VARCHAR(50) NOT NULL CHECK (favorite_type IN ('player', 'match')),
  target_id BIGINT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, favorite_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_type ON favorites(favorite_type);
CREATE INDEX IF NOT EXISTS idx_favorites_target ON favorites(target_id);

-- ============================================
-- 4. MATCH HISTORY CACHE (Extended)
-- ============================================
CREATE TABLE IF NOT EXISTS match_cache (
  match_id BIGINT PRIMARY KEY,
  match_data JSONB NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  radiant_win BOOLEAN,
  players JSONB DEFAULT '[]'::jsonb,
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_match_cache_start_time ON match_cache(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_match_cache_expires ON match_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_match_cache_players USING GIN (players jsonb_path_ops);

-- ============================================
-- 5. SESSION MANAGEMENT
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- ============================================
-- 6. API RATE LIMITING TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS api_rate_limits (
  identifier VARCHAR(255) NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (identifier, endpoint, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON api_rate_limits(window_start);

-- ============================================
-- 7. BACKGROUND JOB QUEUE
-- ============================================
CREATE TABLE IF NOT EXISTS job_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  priority INTEGER DEFAULT 0,
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_job_queue_status ON job_queue(status);
CREATE INDEX IF NOT EXISTS idx_job_queue_scheduled ON job_queue(scheduled_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_job_queue_priority ON job_queue(priority DESC, created_at ASC) WHERE status = 'pending';

-- ============================================
-- 8. ANALYTICS / USAGE TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS usage_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_usage_analytics_user ON usage_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_event ON usage_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_created ON usage_analytics(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Users table policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data" ON users
  FOR SELECT
  USING (auth.uid() = id OR auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can modify users" ON users
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Player profiles - public read, service write
ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Player profiles are public readable" ON player_profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can modify player profiles" ON player_profiles
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Favorites - user-specific access
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites" ON favorites
  FOR SELECT
  USING (auth.uid() = user_id OR auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Users can manage own favorites" ON favorites
  FOR ALL
  USING (auth.uid() = user_id OR auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.uid() = user_id OR auth.jwt()->>'role' = 'service_role');

-- Match cache - public read, service write
ALTER TABLE match_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Match cache is public readable" ON match_cache
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can modify match cache" ON match_cache
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Sessions - user-specific
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT
  USING (auth.uid() = user_id OR auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can manage sessions" ON sessions
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Job queue - service only
ALTER TABLE job_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage job queue" ON job_queue
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Usage analytics - service write, aggregated read
ALTER TABLE usage_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can insert analytics" ON usage_analytics
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Users can view own analytics" ON usage_analytics
  FOR SELECT
  USING (auth.uid() = user_id OR auth.jwt()->>'role' = 'service_role');

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired match cache
CREATE OR REPLACE FUNCTION cleanup_expired_match_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM match_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get or create user by Steam ID
CREATE OR REPLACE FUNCTION get_or_create_user(p_steam_id BIGINT, p_username VARCHAR, p_avatar_url TEXT, p_profile_url TEXT)
RETURNS TABLE(id UUID, steam_id BIGINT, created boolean) AS $$
DECLARE
  v_user_id UUID;
  v_created boolean := false;
BEGIN
  -- Try to find existing user
  SELECT id INTO v_user_id FROM users WHERE steam_id = p_steam_id;
  
  IF v_user_id IS NULL THEN
    -- Create new user
    INSERT INTO users (steam_id, steam_username, avatar_url, profile_url, last_login_at)
    VALUES (p_steam_id, p_username, p_avatar_url, p_profile_url, NOW())
    RETURNING id INTO v_user_id;
    v_created := true;
  ELSE
    -- Update last login
    UPDATE users SET last_login_at = NOW() WHERE steam_id = p_steam_id;
  END IF;
  
  RETURN QUERY SELECT v_user_id, p_steam_id, v_created;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INITIAL DATA SEEDING (Optional)
-- ============================================

-- Insert default admin/service role marker if needed
-- Note: Actual role management is handled by Supabase auth

COMMENT ON TABLE users IS 'User accounts linked to Steam profiles';
COMMENT ON TABLE player_profiles IS 'Cached player profile data from Steam/Deadlock API';
COMMENT ON TABLE favorites IS 'User bookmarked players and matches';
COMMENT ON TABLE match_cache IS 'Cached match data to reduce API calls';
COMMENT ON TABLE sessions IS 'User session tokens for authentication';
COMMENT ON TABLE job_queue IS 'Background job processing queue';
COMMENT ON TABLE usage_analytics IS 'User activity and API usage tracking';
