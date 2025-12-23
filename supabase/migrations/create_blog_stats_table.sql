-- Create blog_stats table to track post views
CREATE TABLE IF NOT EXISTS public.blog_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Add unique constraint to ensure one stats record per post
  CONSTRAINT unique_post_stats UNIQUE (post_id)
);

-- Add index for faster lookups by post_id
CREATE INDEX IF NOT EXISTS idx_blog_stats_post_id ON public.blog_stats(post_id);

-- Add trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_blog_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_blog_stats_updated_at
BEFORE UPDATE ON public.blog_stats
FOR EACH ROW
EXECUTE FUNCTION update_blog_stats_updated_at();

-- Create a function to increment views
CREATE OR REPLACE FUNCTION increment_post_views(post_id_param UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO public.blog_stats (post_id, views)
  VALUES (post_id_param, 1)
  ON CONFLICT (post_id)
  DO UPDATE SET 
    views = public.blog_stats.views + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a view to join blog posts with their stats
CREATE OR REPLACE VIEW public.blog_posts_with_stats AS
SELECT 
  p.*,
  COALESCE(s.views, 0) as view_count,
  COALESCE(s.likes, 0) as like_count,
  COALESCE(s.shares, 0) as share_count
FROM 
  public.blog_posts p
LEFT JOIN 
  public.blog_stats s ON p.id = s.post_id;

-- Add RLS policies
ALTER TABLE public.blog_stats ENABLE ROW LEVEL SECURITY;

-- Anyone can read blog stats
CREATE POLICY blog_stats_select_policy ON public.blog_stats
  FOR SELECT USING (true);

-- Only authenticated users can update blog stats
CREATE POLICY blog_stats_update_policy ON public.blog_stats
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Only authenticated users can insert blog stats
CREATE POLICY blog_stats_insert_policy ON public.blog_stats
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
