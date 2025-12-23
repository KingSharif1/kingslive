-- Add citations column to blog_posts table
ALTER TABLE blog_posts ADD COLUMN citations JSONB DEFAULT '[]'::jsonb;
