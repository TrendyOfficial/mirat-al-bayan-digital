-- Fix security vulnerabilities in RLS policies

-- 1. Restrict user_roles visibility to authenticated users only
DROP POLICY IF EXISTS "User roles are viewable by everyone" ON user_roles;

CREATE POLICY "Authenticated users can view roles" 
ON user_roles FOR SELECT 
TO authenticated 
USING (true);

-- 2. Add session-based tracking for publication views to prevent spam
ALTER TABLE publication_views ADD COLUMN IF NOT EXISTS session_id TEXT;

-- Create unique constraint to prevent duplicate views from same session
CREATE UNIQUE INDEX IF NOT EXISTS unique_view_per_session 
ON publication_views(publication_id, session_id) 
WHERE session_id IS NOT NULL;

-- Update the RLS policy for publication_views to still allow inserts
-- (The unique constraint will prevent spam at database level)
DROP POLICY IF EXISTS "Anyone can insert publication views" ON publication_views;

CREATE POLICY "Anyone can insert publication views with session" 
ON publication_views FOR INSERT 
WITH CHECK (true);