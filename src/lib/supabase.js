import { createClient } from '@supabase/supabase-js'

// Supabase publishable (anon) key — safe to use in the browser
// Real-time subscriptions use this client
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    'Supabase env vars missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env'
  )
}

export const supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '')
