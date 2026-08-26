-- Portfolio projects for the public homepage (editable from CTROOM)
CREATE TABLE IF NOT EXISTS public.portfolio_projects (
  id text PRIMARY KEY,
  title text NOT NULL,
  year text NOT NULL,
  status text NOT NULL CHECK (status IN ('Deployed', 'In Progress')),
  description text NOT NULL DEFAULT '',
  image text NOT NULL DEFAULT '/hireiq-cover.png',
  tech text[] NOT NULL DEFAULT '{}',
  live_url text,
  repo_url text,
  blog_slug text,
  featured boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.portfolio_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published portfolio" ON public.portfolio_projects;
CREATE POLICY "Public read published portfolio" ON public.portfolio_projects
  FOR SELECT USING (published = true);

DROP POLICY IF EXISTS "Admin write portfolio" ON public.portfolio_projects;
CREATE POLICY "Admin write portfolio" ON public.portfolio_projects
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admin_users))
  WITH CHECK (auth.jwt() ->> 'email' IN (SELECT email FROM admin_users));
