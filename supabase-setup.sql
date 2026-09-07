-- Run this in your Supabase Dashboard → SQL Editor

-- ── Users table ──────────────────────────────────────────────────────────────
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

-- ── User settings table ───────────────────────────────────────────────────────
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

-- ── Auto-update updated_at on users ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────────────
-- We manage auth ourselves via JWT, so we disable RLS and use the service role key server-side
ALTER TABLE public.users         DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings DISABLE ROW LEVEL SECURITY;

-- ── AI Tutor: Chat sessions ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tutor_chats (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL DEFAULT 'New Chat',
  subject     TEXT        DEFAULT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tutor_chats_updated_at
  BEFORE UPDATE ON public.tutor_chats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.tutor_chats DISABLE ROW LEVEL SECURITY;

-- ── AI Tutor: Messages ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tutor_messages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id     UUID        NOT NULL REFERENCES public.tutor_chats(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role        TEXT        NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.tutor_messages DISABLE ROW LEVEL SECURITY;

-- ── Community: Posts ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.posts (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  author_name      TEXT        NOT NULL,
  author_initials  TEXT        NOT NULL DEFAULT '',
  course           TEXT        NOT NULL DEFAULT 'General',
  content          TEXT        NOT NULL,
  likes_count      INTEGER     NOT NULL DEFAULT 0,
  comments_count   INTEGER     NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.posts DISABLE ROW LEVEL SECURITY;

-- ── Community: Post Likes ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.post_likes (
  user_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  post_id  UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, post_id)
);

ALTER TABLE public.post_likes DISABLE ROW LEVEL SECURITY;

-- ── Community: Post Comments ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.post_comments (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id          UUID        NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id          UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  author_name      TEXT        NOT NULL,
  author_initials  TEXT        NOT NULL DEFAULT '',
  content          TEXT        NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.post_comments DISABLE ROW LEVEL SECURITY;

-- ── RPC: increment comment count ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_comments(row_id UUID)
RETURNS void AS $$
  UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = row_id;
$$ LANGUAGE sql;

-- ── Quiz Results ──────────────────────────────────────────────────────────────
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
ALTER TABLE public.quiz_results DISABLE ROW LEVEL SECURITY;

-- ── PDF Analyses ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pdf_analyses (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  file_name     TEXT        NOT NULL,
  file_size     INTEGER     DEFAULT 0,
  summary       TEXT        DEFAULT '',
  key_concepts  JSONB       DEFAULT '[]',
  flashcards    JSONB       DEFAULT '[]',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.pdf_analyses DISABLE ROW LEVEL SECURITY;

-- Done! ✓
