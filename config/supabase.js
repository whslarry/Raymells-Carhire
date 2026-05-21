// Supabase Client Configuration
// Initialize the Supabase client for authentication and database access

// Get Supabase configuration from environment
const SUPABASE_URL = window.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = window.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('[v0] Supabase configuration not found. Some features may not work.');
  console.log('[v0] SUPABASE_URL:', SUPABASE_URL ? 'set' : 'missing');
  console.log('[v0] SUPABASE_KEY:', SUPABASE_KEY ? 'set' : 'missing');
}

// Create Supabase client
let supabaseClient = null;

async function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.43.4/+esm');
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
    console.log('[v0] Supabase client initialized');
    return supabaseClient;
  } catch (error) {
    console.error('[v0] Failed to initialize Supabase client:', error);
    throw error;
  }
}

export default getSupabaseClient;
