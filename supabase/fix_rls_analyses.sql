-- Enable Row Level Security on the analyses table
-- This fixes the Supabase security advisor warnings

-- Step 1: Enable RLS on the analyses table
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Service role can do everything" ON public.analyses;

-- Step 3: Create policy for service role (bypass RLS for server operations)
-- This allows the server to insert, update, and read analyses using the service role key
CREATE POLICY "Service role full access" ON public.analyses
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Step 4: Ensure anonymous clients cannot enumerate cached analyses.
-- Shared reports are now served through the Express API with signed share tokens.
DROP POLICY IF EXISTS "Public read access" ON public.analyses;

-- Step 5: Create policy for authenticated users (optional, for future use)
-- If you want to restrict access to authenticated users in the future,
-- uncomment and modify this policy:
-- CREATE POLICY "Authenticated read access" ON public.analyses
--   FOR SELECT
--   TO authenticated
--   USING (true);

-- Step 6: Verify policies are created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'analyses';

-- Expected output:
-- schemaname | tablename | policyname              | permissive | roles        | cmd | qual | with_check
-- -----------+-----------+-------------------------+------------+--------------+-----+------+------------
-- public     | analyses  | Service role full access | t          | {service_role} | *   | true | true
-- No anon SELECT policy should be present.
