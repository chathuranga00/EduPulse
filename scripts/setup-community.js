import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
})

// Create tables via raw SQL using the pg endpoint
const SQL = `
CREATE TABLE IF NOT EXISTS public.posts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  author_name TEXT        NOT NULL,
  author_initials TEXT    NOT NULL,
  course      TEXT        NOT NULL DEFAULT 'General',
  content     TEXT        NOT NULL,
  likes_count INTEGER     NOT NULL DEFAULT 0,
  comments_count INTEGER  NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.post_likes (
  user_id UUID NOT NULL REFERENCES public.users(id)  ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id)  ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

CREATE TABLE IF NOT EXISTS public.post_comments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID        NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  author_name TEXT        NOT NULL,
  author_initials TEXT    NOT NULL,
  content     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.posts          DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes     DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments  DISABLE ROW LEVEL SECURITY;
`

async function run() {
  console.log('Creating community tables...\n')

  // Try to insert a dummy row — if table exists it succeeds
  const { error: e1 } = await client.from('posts').select('count').limit(1)
  if (!e1) {
    console.log('✓ posts table already exists')
  } else {
    console.log('posts table missing — please run SQL manually')
    console.log('\nSQL to run in Supabase SQL Editor:\n')
    console.log(SQL)
    return
  }
}

run().catch(console.error)
