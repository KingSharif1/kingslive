-- Add DELETE policy for admin users on blog_comments table
CREATE POLICY "Allow admin users to delete comments" ON blog_comments
FOR DELETE 
TO public
USING (
  auth.uid() IN (
    SELECT id FROM admin_users
  )
);
