-- ── Notifications table ───────────────────────────────────────────────────────
-- Run this in: Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL,   -- 'quiz_result' | 'community_post' | 'study_reminder' | 'system'
  title      TEXT        NOT NULL,
  body       TEXT        NOT NULL,
  link       TEXT        DEFAULT NULL,  -- route to navigate to on click
  read       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast per-user queries
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id, created_at DESC);

-- Disable RLS (we use service role key server-side)
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- ── Auto-notify on quiz result insert ────────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_quiz_result()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications(user_id, type, title, body, link)
  VALUES (
    NEW.user_id,
    'quiz_result',
    'Quiz Completed 🎯',
    'You scored ' || NEW.score_pct || '% on ' || NEW.title,
    '/quizzes'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_quiz_result ON public.quiz_results;
CREATE TRIGGER on_quiz_result
  AFTER INSERT ON public.quiz_results
  FOR EACH ROW EXECUTE FUNCTION notify_quiz_result();

-- ── Auto-notify on new community post ────────────────────────────────────────
-- Notifies all users (limited to 50 most recent) when someone posts
CREATE OR REPLACE FUNCTION notify_community_post()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications(user_id, type, title, body, link)
  SELECT
    u.id,
    'community_post',
    NEW.author_name || ' posted in ' || NEW.course,
    LEFT(NEW.content, 80) || CASE WHEN LENGTH(NEW.content) > 80 THEN '…' ELSE '' END,
    '/community'
  FROM public.users u
  WHERE u.id != NEW.author_id
  LIMIT 50;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_community_post ON public.posts;
CREATE TRIGGER on_community_post
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION notify_community_post();

-- Done! ✓
