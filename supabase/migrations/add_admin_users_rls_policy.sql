-- Add RLS policy for admin_users table
-- This allows anyone to read admin_users for authentication purposes

CREATE POLICY "Allow public read access for admin verification" 
ON admin_users 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- Optional: Add policy for service_role to manage admin users
CREATE POLICY "Allow service_role full access" 
ON admin_users 
FOR ALL 
TO service_role 
USING (true);
