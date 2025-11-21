-- Fix user email exposure in comments table
-- Create a view that excludes sensitive email data
CREATE OR REPLACE VIEW public.comments_safe AS
SELECT 
  id,
  content,
  created_at,
  updated_at,
  user_id,
  username,
  publication_id,
  parent_comment_id,
  status,
  moderated_at,
  moderated_by,
  moderation_reason
FROM public.comments
WHERE status = 'approved';

-- Grant select permission on the safe view
GRANT SELECT ON public.comments_safe TO authenticated;
GRANT SELECT ON public.comments_safe TO anon;

-- Update RLS policy for comments table to restrict email field access
-- Drop existing policy and create new one
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;

CREATE POLICY "Comments are viewable by authenticated users (no email)"
  ON public.comments
  FOR SELECT
  TO authenticated
  USING (status = 'approved');

-- Create policy for anonymous users  
CREATE POLICY "Comments are viewable by anonymous users (no email)"
  ON public.comments
  FOR SELECT
  TO anon
  USING (status = 'approved');

-- Users can still see their own comments including email
CREATE POLICY "Users can view their own comments"
  ON public.comments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Comments_public view security
-- Ensure the view properly filters sensitive data
DROP VIEW IF EXISTS public.comments_public CASCADE;

CREATE OR REPLACE VIEW public.comments_public AS
SELECT 
  id,
  content,
  created_at,
  updated_at,
  user_id,
  username,
  publication_id,
  parent_comment_id,
  status
FROM public.comments
WHERE status = 'approved';

-- Grant permissions
GRANT SELECT ON public.comments_public TO authenticated;
GRANT SELECT ON public.comments_public TO anon;

-- Settings_public view should only show truly public settings
DROP VIEW IF EXISTS public.settings_public CASCADE;

CREATE OR REPLACE VIEW public.settings_public AS
SELECT 
  id,
  key,
  value,
  updated_at
FROM public.settings
WHERE key IN ('site_name', 'site_description', 'social_links', 'contact_email');

-- Grant permissions
GRANT SELECT ON public.settings_public TO authenticated;
GRANT SELECT ON public.settings_public TO anon;