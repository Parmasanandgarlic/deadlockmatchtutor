const { createClient } = require('@supabase/supabase-js');
const config = require('../config');

if (!config.supabase.url || !config.supabase.serviceRoleKey) {
  console.warn('⚠️ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not configured.');
}

// Server-side client using the service role key to bypass RLS for data processing and updates.
// NEVER expose the serviceRoleKey to the frontend.
const supabase = createClient(
  config.supabase.url || 'https://placeholder.supabase.co',
  config.supabase.serviceRoleKey || 'placeholder',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  }
);

module.exports = {
  supabase,
};
