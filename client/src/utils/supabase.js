import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

// Client-side client using the public anonymous key. 
// Uses Row Level Security (RLS) policies.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
