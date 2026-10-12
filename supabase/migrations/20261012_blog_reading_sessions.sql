-- Blog reading sessions: real reader analytics for the notebook blog.
--
-- Run this in the Supabase SQL editor for the kingslive project — the one in
-- NEXT_PUBLIC_SUPABASE_URL (documented ref fcdzbnuyzdzqkuizvexk, "kinglive cms").
-- Do NOT run it on HireIQ or Nami.
--
-- Idempotent: safe to run more than once.
--
-- What it stores (one row per reading session):
--   post_id          Sanity document id (text), same as blog_comments/blog_post_likes
--   device_hash      SHA-256 of a random per-device id from localStorage. No PII,
--                    no cookies, no fingerprinting of the browser. Lets us count
--                    returning devices without knowing who anyone is.
--   active_seconds   seconds the tab was visible (paused on tab hide)
--   max_scroll_depth deepest scroll point, 0-100
--   milestones       which of 25/50/75/100 the reader reached
--   referrer         document.referrer at session start (may be empty)
--
-- Writes go ONLY through the Next.js service-role route
-- (app/api/blog/reading-session). RLS is on; the public read policy lets
-- CTROOM's BlogView (anon key) show aggregates. There is no public write
-- policy, so PostgREST inserts from browsers are rejected.

CREATE TABLE IF NOT EXISTS public.blog_reading_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id text NOT NULL,
  device_hash text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  active_seconds integer NOT NULL DEFAULT 0 CHECK (active_seconds >= 0),
  max_scroll_depth smallint NOT NULL DEFAULT 0 CHECK (max_scroll_depth BETWEEN 0 AND 100),
  milestones smallint[] NOT NULL DEFAULT '{}',
  referrer text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reading_sessions_post
  ON public.blog_reading_sessions (post_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_device
  ON public.blog_reading_sessions (device_hash);

ALTER TABLE public.blog_reading_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS blog_reading_sessions_public_read ON public.blog_reading_sessions;
CREATE POLICY blog_reading_sessions_public_read
  ON public.blog_reading_sessions
  FOR SELECT
  USING (true);
