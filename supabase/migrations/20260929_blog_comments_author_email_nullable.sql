-- Comments are name + comment only (email field removed from the UI in
-- the Cerebration restyle). The client insert omits author_email, so the
-- column must accept NULL. Applied live 2026-09-29 after confirming every
-- comment submit was failing with a NOT NULL violation on this column.
ALTER TABLE public.blog_comments
  ALTER COLUMN author_email DROP NOT NULL;
