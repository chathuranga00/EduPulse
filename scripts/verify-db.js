import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
})

async function run() {
  console.log('Verifying Supabase tables...\n')

  const { data: u, error: e1 } = await client.from('users').select('count').limit(1)
  if (e1) { console.error('✗ users table:', e1.message); process.exit(1) }
  console.log('✓ users table OK')

  const { data: s, error: e2 } = await client.from('user_settings').select('count').limit(1)
  if (e2) { console.error('✗ user_settings table:', e2.message); process.exit(1) }
  console.log('✓ user_settings table OK')

  console.log('\nAll good! Your Supabase database is ready.')
}

run().catch(console.error)
