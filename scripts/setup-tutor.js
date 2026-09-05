import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
})

const { error } = await client.from('tutor_chats').select('count').limit(1)
if (!error) {
  console.log('✓ tutor tables already exist')
} else {
  console.log('Tables missing. Run this SQL in Supabase SQL Editor:\n')
  console.log(`
CREATE TABLE IF NOT EXISTS public.tutor_chats (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title      TEXT        NOT NULL DEFAULT 'New Chat',
  subject    TEXT        DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tutor_messages (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id    UUID        NOT NULL REFERENCES public.tutor_chats(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role       TEXT        NOT NULL CHECK (role IN ('user','assistant')),
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tutor_chats_user_id_idx    ON public.tutor_chats(user_id);
CREATE INDEX IF NOT EXISTS tutor_messages_chat_id_idx ON public.tutor_messages(chat_id);

ALTER TABLE public.tutor_chats    DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_messages DISABLE ROW LEVEL SECURITY;

ALTER PUBLICATION supabase_realtime ADD TABLE public.tutor_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tutor_chats;
  `)
}
