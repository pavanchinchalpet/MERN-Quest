const { createClient } = require('@supabase/supabase-js');
const env = require('./env');

if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

// Create a single supabase client for interacting with your database
// strictly utilizing the Data API and purely as our postgres provider.
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,     // Since we are NOT using Supabase Auth
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

module.exports = supabase;
