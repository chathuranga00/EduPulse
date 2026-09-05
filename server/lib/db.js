import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../../.env') })

export function getDb() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY

  if (!url || !key || !url.startsWith('http')) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in your .env file.\n' +
      'Get them from: Supabase Dashboard → Settings → API',
    )
  }

  // Create a fresh client every call — avoids stale env var issues during dev
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
