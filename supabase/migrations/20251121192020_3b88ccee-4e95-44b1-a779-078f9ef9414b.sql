-- Fix security definer views by recreating without SECURITY DEFINER
-- Drop and recreate views with SECURITY INVOKER (default)

DROP VIEW IF EXISTS public.comments_safe CASCADE;
DROP VIEW IF EXISTS public.comments_public CASCADE;
DROP VIEW IF EXISTS public.settings_public CASCADE;

-- Create comments_safe view without SECURITY DEFINER
CREATE VIEW public.comments_safe
WITH (security_invoker = true) AS
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

-- Create comments_public view without SECURITY DEFINER
CREATE VIEW public.comments_public
WITH (security_invoker = true) AS
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

-- Create settings_public view without SECURITY DEFINER
CREATE VIEW public.settings_public
WITH (security_invoker = true) AS
SELECT 
  id,
  key,
  value,
  updated_at
FROM public.settings
WHERE key IN ('site_name', 'site_description', 'social_links', 'contact_email');

-- Grant permissions on all views
GRANT SELECT ON public.comments_safe TO authenticated, anon;
GRANT SELECT ON public.comments_public TO authenticated, anon;
GRANT SELECT ON public.settings_public TO authenticated, anon;