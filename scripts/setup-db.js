import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
})

// Create tables by inserting/selecting — Supabase REST API doesn't expose DDL directly.
// We use the management API via fetch instead.
const PROJECT_REF = process.env.SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]

const SQL = `
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  email       TEXT        NOT NULL UNIQUE,
  password    TEXT        NOT NULL,
  avatar      TEXT        DEFAULT NULL,
  university  TEXT        DEFAULT '',
  bio         TEXT        DEFAULT '',
  plan        TEXT        DEFAULT 'free',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id          UUID    PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  email_notifs     BOOLEAN DEFAULT TRUE,
  study_reminders  BOOLEAN DEFAULT TRUE,
  community_notifs BOOLEAN DEFAULT FALSE,
  two_fa           BOOLEAN DEFAULT FALSE,
  profile_visible  BOOLEAN DEFAULT TRUE,
  dark_mode        BOOLEAN DEFAULT FALSE,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS user_settings_updated_at ON public.user_settings;
CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.users         DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings DISABLE ROW LEVEL SECURITY;
`

async function run() {
  console.log('Connecting to Supabase project:', PROJECT_REF)
  console.log('Running migrations...\n')

  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: SQL }),
    }
  )

  const text = await res.text()
  if (!res.ok) {
    console.error('Migration failed:', res.status, text)
    process.exit(1)
  }

  console.log('Migration response:', text)
  console.log('\nVerifying tables...')

  // Verify users table exists
  const { data, error } = await client.from('users').select('count').limit(1)
  if (error) {
    console.error('Table verification failed:', error.message)
    process.exit(1)
  }

  console.log('✓ users table OK')

  // Verify user_settings table
  const { error: err2 } = await client.from('user_settings').select('count').limit(1)
  if (err2) {
    console.error('user_settings table error:', err2.message)
    process.exit(1)
  }

  console.log('✓ user_settings table OK')
  console.log('\nDatabase setup complete!')
}

run().catch(console.error)
