import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

if (!process.env.SUPABASE_URL) dotenv.config()

let _client = null

export function getDb() {
  if (!_client) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_KEY

    if (!url || !key) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in your .env file.\n' +
        'Get them from: Supabase Dashboard → Settings → API',
      )
    }

    _client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return _client
}
