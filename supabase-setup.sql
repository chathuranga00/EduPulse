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

-- Done! ✓
