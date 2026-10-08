-- KL-13 blog engagement (comments, replies, likes, views)
--
-- Run this in the Supabase SQL editor for the kingslive project — the one in
-- NEXT_PUBLIC_SUPABASE_URL (documented ref fcdzbnuyzdzqkuizvexk, "kinglive cms").
-- Do NOT run it on HireIQ (wsbbgznobxhjefaqbniv) or Nami (thkoldqaehhabwhsclag).
--
-- Idempotent: safe to run more than once. Public writes go through the Next.js
-- service-role routes. Visitors are a cookie, not accounts. post_id is the
-- Sanity document id (text), not a foreign key to the legacy blog_posts table.
--
-- View dedupe matches lib/blog/engagement.ts shouldCountView: a hit counts only
-- when this visitor has no row, or the previous viewed_at is strictly older
-- than 24 hours.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.blog_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id text NOT NULL,
  parent_id uuid,
  author_name text NOT NULL,
  author_email text,
  content text NOT NULL,
  approved boolean NOT NULL DEFAULT true,
  archived boolean NOT NULL DEFAULT false,
  is_hidden boolean NOT NULL DEFAULT false,
  visitor_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blog_post_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id text NOT NULL,
  view_count integer NOT NULL DEFAULT 0,
  likes integer NOT NULL DEFAULT 0,
  legacy_likes integer,
  unique_visitors integer NOT NULL DEFAULT 0,
  comment integer NOT NULL DEFAULT 0,
  last_updated timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blog_post_likes (
  post_id text NOT NULL,
  visitor_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, visitor_id)
);

CREATE TABLE IF NOT EXISTS public.blog_post_view_hits (
  post_id text NOT NULL,
  visitor_id text NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, visitor_id)
);

-- ---------------------------------------------------------------------------
-- Existing installs: Sanity ids, nullable email, threads, hide flag
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  r record;
BEGIN
  IF to_regclass('public.blog_comments') IS NULL THEN
    RETURN;
  END IF;

  FOR r IN
    SELECT con.conname, rel.relname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_class frel ON frel.oid = con.confrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname IN ('blog_comments', 'blog_post_analytics')
      AND frel.relname = 'blog_posts'
      AND con.contype = 'f'
  LOOP
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', r.relname, r.conname);
  END LOOP;
END $$;

DO $$
DECLARE
  col_type text;
BEGIN
  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'blog_comments' AND column_name = 'post_id';

  IF col_type IS NOT NULL AND col_type <> 'text' THEN
    ALTER TABLE public.blog_comments
      ALTER COLUMN post_id TYPE text USING post_id::text;
  END IF;

  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'blog_post_analytics' AND column_name = 'post_id';

  IF col_type IS NOT NULL AND col_type <> 'text' THEN
    ALTER TABLE public.blog_post_analytics
      ALTER COLUMN post_id TYPE text USING post_id::text;
  END IF;
END $$;

ALTER TABLE public.blog_comments ADD COLUMN IF NOT EXISTS author_name text;
ALTER TABLE public.blog_comments ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE public.blog_comments ADD COLUMN IF NOT EXISTS approved boolean NOT NULL DEFAULT true;
ALTER TABLE public.blog_comments ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;
ALTER TABLE public.blog_comments ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;
ALTER TABLE public.blog_comments ADD COLUMN IF NOT EXISTS visitor_id text;
ALTER TABLE public.blog_comments ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'blog_comments'
      AND column_name = 'author_email'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.blog_comments ALTER COLUMN author_email DROP NOT NULL;
  END IF;
END $$;

DO $$
DECLARE
  id_type text;
BEGIN
  SELECT data_type INTO id_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'blog_comments' AND column_name = 'id';

  IF id_type IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'blog_comments' AND column_name = 'parent_id'
  ) THEN
    IF id_type = 'uuid' THEN
      ALTER TABLE public.blog_comments
        ADD COLUMN parent_id uuid REFERENCES public.blog_comments (id) ON DELETE CASCADE;
    ELSE
      EXECUTE format('ALTER TABLE public.blog_comments ADD COLUMN parent_id %s', id_type);
    END IF;
  END IF;

  IF id_type = 'uuid' AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'blog_comments_parent_id_fkey'
  ) THEN
    BEGIN
      ALTER TABLE public.blog_comments
        ADD CONSTRAINT blog_comments_parent_id_fkey
        FOREIGN KEY (parent_id) REFERENCES public.blog_comments (id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'blog_comments parent_id foreign key skipped: %', SQLERRM;
    END;
  END IF;
END $$;

ALTER TABLE public.blog_post_analytics ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.blog_post_analytics ADD COLUMN IF NOT EXISTS likes integer NOT NULL DEFAULT 0;
ALTER TABLE public.blog_post_analytics ADD COLUMN IF NOT EXISTS legacy_likes integer;
ALTER TABLE public.blog_post_analytics ADD COLUMN IF NOT EXISTS last_updated timestamptz NOT NULL DEFAULT now();

-- Freeze the pre-cookie like total once. Later runs must not overwrite it.
UPDATE public.blog_post_analytics
SET legacy_likes = COALESCE(likes, 0)
WHERE legacy_likes IS NULL;

-- One analytics row per Sanity post id (keep the busiest duplicate).
DELETE FROM public.blog_post_analytics a
WHERE a.ctid IN (
  SELECT ctid FROM (
    SELECT ctid,
           row_number() OVER (
             PARTITION BY post_id
             ORDER BY COALESCE(view_count, 0) DESC, COALESCE(likes, 0) DESC, ctid DESC
           ) AS rn
    FROM public.blog_post_analytics
  ) ranked
  WHERE ranked.rn > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS blog_post_analytics_post_id_uidx
  ON public.blog_post_analytics (post_id);

-- Triggers that write back to blog_posts abort a name-only insert. Drop those.
DO $$
DECLARE
  r record;
BEGIN
  IF to_regclass('public.blog_comments') IS NULL THEN
    RETURN;
  END IF;

  FOR r IN
    SELECT t.tgname
    FROM pg_trigger t
    JOIN pg_proc p ON p.oid = t.tgfoid
    WHERE t.tgrelid = 'public.blog_comments'::regclass
      AND NOT t.tgisinternal
      AND (
        t.tgname ILIKE '%comment_count%'
        OR pg_get_functiondef(p.oid) ILIKE '%blog_posts%'
      )
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.blog_comments', r.tgname);
  END LOOP;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'blog_comments_content_len'
  ) AND NOT EXISTS (
    SELECT 1 FROM public.blog_comments
    WHERE content IS NULL OR char_length(content) < 1 OR char_length(content) > 2000
  ) THEN
    ALTER TABLE public.blog_comments
      ADD CONSTRAINT blog_comments_content_len CHECK (char_length(content) BETWEEN 1 AND 2000);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Atomic 24h view window. One row per (post, visitor); the WHERE on conflict
-- refreshes the window only after 24h and returns a row only when it counted.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.record_blog_view(p_post_id text, p_visitor_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  counted boolean;
  views integer := 0;
BEGIN
  IF p_post_id IS NULL OR length(p_post_id) < 1 OR length(p_post_id) > 128
     OR p_visitor_id IS NULL OR length(p_visitor_id) < 1 OR length(p_visitor_id) > 64 THEN
    RETURN jsonb_build_object('counted', false, 'views', 0);
  END IF;

  INSERT INTO public.blog_post_view_hits (post_id, visitor_id, viewed_at)
  VALUES (p_post_id, p_visitor_id, now())
  ON CONFLICT (post_id, visitor_id) DO UPDATE
    SET viewed_at = now()
    WHERE public.blog_post_view_hits.viewed_at < now() - interval '24 hours'
  RETURNING true INTO counted;

  IF counted IS TRUE THEN
    INSERT INTO public.blog_post_analytics (post_id, view_count, likes, legacy_likes, last_updated)
    VALUES (p_post_id, 1, 0, 0, now())
    ON CONFLICT (post_id) DO UPDATE
      SET view_count = COALESCE(public.blog_post_analytics.view_count, 0) + 1,
          last_updated = now();
  END IF;

  SELECT COALESCE(view_count, 0) INTO views
  FROM public.blog_post_analytics
  WHERE post_id = p_post_id;

  RETURN jsonb_build_object('counted', COALESCE(counted, false), 'views', COALESCE(views, 0));
END;
$$;

REVOKE ALL ON FUNCTION public.record_blog_view(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_blog_view(text, text) FROM anon;
REVOKE ALL ON FUNCTION public.record_blog_view(text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.record_blog_view(text, text) TO service_role;

-- ---------------------------------------------------------------------------
-- Indexes (lean list + rate limit + thread lookup)
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS blog_comments_post_created_idx
  ON public.blog_comments (post_id, created_at DESC);

CREATE INDEX IF NOT EXISTS blog_comments_parent_idx
  ON public.blog_comments (parent_id);

CREATE INDEX IF NOT EXISTS blog_comments_visitor_created_idx
  ON public.blog_comments (visitor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS blog_comments_visible_idx
  ON public.blog_comments (post_id, created_at)
  WHERE approved = true AND archived = false AND is_hidden = false;

CREATE INDEX IF NOT EXISTS blog_post_likes_post_idx
  ON public.blog_post_likes (post_id);

-- ---------------------------------------------------------------------------
-- RLS: visitors read visible comments through PostgREST if they must.
-- Inserts, likes, and views are service-role only (the API routes).
-- Authenticated CTROOM admins (admin_users.email) can still moderate.
-- ---------------------------------------------------------------------------

ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_view_hits ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('blog_comments', 'blog_post_analytics', 'blog_post_likes', 'blog_post_view_hits')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

CREATE POLICY blog_comments_public_read
  ON public.blog_comments
  FOR SELECT
  TO anon, authenticated
  USING (
    approved IS TRUE
    AND COALESCE(archived, false) IS FALSE
    AND COALESCE(is_hidden, false) IS FALSE
  );

CREATE POLICY blog_post_analytics_public_read
  ON public.blog_post_analytics
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admin policies reference admin_users. Skip them if that table is absent so
-- this file still applies; the service-role API does not need them.
DO $$
BEGIN
  IF to_regclass('public.admin_users') IS NULL THEN
    RAISE NOTICE 'admin_users missing — skipped CTROOM admin policies';
    RETURN;
  END IF;

  EXECUTE $policy$
    CREATE POLICY blog_comments_admin_all
      ON public.blog_comments
      FOR ALL
      TO authenticated
      USING (auth.jwt() ->> 'email' IN (SELECT email FROM public.admin_users))
      WITH CHECK (auth.jwt() ->> 'email' IN (SELECT email FROM public.admin_users))
  $policy$;

  EXECUTE $policy$
    CREATE POLICY blog_post_analytics_admin_all
      ON public.blog_post_analytics
      FOR ALL
      TO authenticated
      USING (auth.jwt() ->> 'email' IN (SELECT email FROM public.admin_users))
      WITH CHECK (auth.jwt() ->> 'email' IN (SELECT email FROM public.admin_users))
  $policy$;

  EXECUTE $policy$
    CREATE POLICY blog_post_likes_admin_all
      ON public.blog_post_likes
      FOR ALL
      TO authenticated
      USING (auth.jwt() ->> 'email' IN (SELECT email FROM public.admin_users))
      WITH CHECK (auth.jwt() ->> 'email' IN (SELECT email FROM public.admin_users))
  $policy$;

  EXECUTE $policy$
    CREATE POLICY blog_post_view_hits_admin_all
      ON public.blog_post_view_hits
      FOR ALL
      TO authenticated
      USING (auth.jwt() ->> 'email' IN (SELECT email FROM public.admin_users))
      WITH CHECK (auth.jwt() ->> 'email' IN (SELECT email FROM public.admin_users))
  $policy$;
END $$;

REVOKE INSERT, UPDATE, DELETE ON public.blog_comments FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.blog_post_analytics FROM anon;
REVOKE ALL ON public.blog_post_likes FROM anon;
REVOKE ALL ON public.blog_post_view_hits FROM anon;

GRANT SELECT ON public.blog_comments TO anon, authenticated;
GRANT SELECT ON public.blog_post_analytics TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_comments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_post_analytics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_post_likes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_post_view_hits TO authenticated;

GRANT ALL ON public.blog_comments TO service_role;
GRANT ALL ON public.blog_post_analytics TO service_role;
GRANT ALL ON public.blog_post_likes TO service_role;
GRANT ALL ON public.blog_post_view_hits TO service_role;
