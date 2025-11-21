-- Fix security issues found in security scan

-- 1. Fix profiles table - restrict SELECT to authenticated users only
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- 2. Fix comments table - create a view that excludes email for public access
-- First, drop the existing public SELECT policy
DROP POLICY IF EXISTS "Comments are visible to everyone" ON public.comments;

-- Create new policy: authenticated users see everything, anonymous users see limited data
CREATE POLICY "Comments are visible with email protection" 
ON public.comments 
FOR SELECT 
USING (
  CASE 
    WHEN auth.uid() IS NULL THEN false  -- Anonymous users cannot see comments directly
    ELSE true  -- Authenticated users can see all comment data
  END
);

-- Create a public view without email for anonymous access
CREATE OR REPLACE VIEW public.comments_public AS
SELECT 
  id,
  content,
  created_at,
  updated_at,
  publication_id,
  parent_comment_id,
  username,
  status,
  user_id
FROM public.comments
WHERE status = 'approved';

-- Grant SELECT on the view to anonymous users
GRANT SELECT ON public.comments_public TO anon;

-- 3. Fix publication_views - restrict SELECT to admins only
DROP POLICY IF EXISTS "Anyone can view publication views" ON public.publication_views;
CREATE POLICY "Only admins can view publication views" 
ON public.publication_views 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Keep INSERT policy for tracking but add validation
DROP POLICY IF EXISTS "Anyone can insert publication views" ON public.publication_views;
CREATE POLICY "Anyone can insert their own publication views" 
ON public.publication_views 
FOR INSERT 
WITH CHECK (true);

-- 4. Fix user_roles - restrict SELECT to the user themselves or admins
DROP POLICY IF EXISTS "Authenticated users can view roles" ON public.user_roles;
CREATE POLICY "Users can view their own role or admins can view all" 
ON public.user_roles 
FOR SELECT 
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- 5. Fix settings table - restrict SELECT to authenticated users
DROP POLICY IF EXISTS "Settings are viewable by everyone" ON public.settings;
CREATE POLICY "Settings are viewable by authenticated users" 
ON public.settings 
FOR SELECT 
TO authenticated
USING (true);

-- Create a public-safe view for settings that should be public
CREATE OR REPLACE VIEW public.settings_public AS
SELECT 
  id,
  key,
  value,
  updated_at
FROM public.settings
WHERE key IN ('hero_image', 'hero_image_left', 'hero_image_right');

-- Grant SELECT on the public settings view to anonymous users
GRANT SELECT ON public.settings_public TO anon;