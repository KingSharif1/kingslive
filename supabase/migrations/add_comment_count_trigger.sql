-- Add unique constraint on post_id first
ALTER TABLE blog_post_analytics ADD CONSTRAINT unique_post_id UNIQUE (post_id);

-- Function to update comment count in blog_post_analytics
CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT (new comment)
  IF TG_OP = 'INSERT' THEN
    INSERT INTO blog_post_analytics (post_id, comment, view_count, last_updated)
    VALUES (NEW.post_id, 1, 0, NOW())
    ON CONFLICT (post_id)
    DO UPDATE SET 
      comment = blog_post_analytics.comment + 1,
      last_updated = NOW();
    RETURN NEW;
  END IF;
  
  -- Handle DELETE (comment removed)
  IF TG_OP = 'DELETE' THEN
    UPDATE blog_post_analytics 
    SET 
      comment = GREATEST(0, comment - 1),
      last_updated = NOW()
    WHERE post_id = OLD.post_id;
    RETURN OLD;
  END IF;
  
  -- Handle UPDATE (approval status change)
  IF TG_OP = 'UPDATE' THEN
    -- If comment was approved (false -> true)
    IF OLD.approved = false AND NEW.approved = true THEN
      INSERT INTO blog_post_analytics (post_id, comment, view_count, last_updated)
      VALUES (NEW.post_id, 1, 0, NOW())
      ON CONFLICT (post_id)
      DO UPDATE SET 
        comment = blog_post_analytics.comment + 1,
        last_updated = NOW();
    -- If comment was unapproved (true -> false)
    ELSIF OLD.approved = true AND NEW.approved = false THEN
      UPDATE blog_post_analytics 
      SET 
        comment = GREATEST(0, comment - 1),
        last_updated = NOW()
      WHERE post_id = NEW.post_id;
    END IF;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for comment count updates
DROP TRIGGER IF EXISTS comment_count_trigger ON blog_comments;
CREATE TRIGGER comment_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON blog_comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_count();

-- Initialize comment counts for existing posts
INSERT INTO blog_post_analytics (post_id, comment, view_count, last_updated)
SELECT 
  p.id,
  COUNT(c.id) FILTER (WHERE c.approved = true) as comment_count,
  0 as view_count,
  NOW() as last_updated
FROM blog_posts p
LEFT JOIN blog_comments c ON p.id = c.post_id
GROUP BY p.id
ON CONFLICT (post_id) 
DO UPDATE SET 
  comment = EXCLUDED.comment,
  last_updated = NOW();
