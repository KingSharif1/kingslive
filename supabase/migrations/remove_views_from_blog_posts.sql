-- Remove views column from blog_posts table since we're using blog_post_analytics
ALTER TABLE blog_posts DROP COLUMN IF EXISTS views;
