-- Add archived column to blog_comments table
ALTER TABLE blog_comments 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Add index for better performance on archived queries
CREATE INDEX IF NOT EXISTS idx_blog_comments_archived ON blog_comments(archived);

-- Update any existing comments to not be archived by default
UPDATE blog_comments SET archived = FALSE WHERE archived IS NULL;
