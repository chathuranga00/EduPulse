import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
})

const { error } = await client.from('quiz_results').select('count').limit(1)
if (!error) {
  console.log('✓ quiz_results table already exists')
} else {
  console.log('quiz_results table missing. Run this SQL in Supabase SQL Editor:\n')
  console.log(`
CREATE TABLE IF NOT EXISTS public.quiz_results (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  quiz_key      TEXT        NOT NULL,
  title         TEXT        NOT NULL,
  subject       TEXT        NOT NULL,
  difficulty    TEXT        NOT NULL,
  score_pct     INTEGER     NOT NULL,
  correct       INTEGER     NOT NULL,
  total         INTEGER     NOT NULL,
  taken_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS quiz_results_user_id_idx ON public.quiz_results(user_id);
CREATE INDEX IF NOT EXISTS quiz_results_quiz_key_idx ON public.quiz_results(quiz_key);

ALTER TABLE public.quiz_results DISABLE ROW LEVEL SECURITY;

ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_results;
  `)
}
