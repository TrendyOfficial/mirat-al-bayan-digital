-- Fix security definer view issues by using SECURITY INVOKER

-- Drop and recreate comments_public view with SECURITY INVOKER
DROP VIEW IF EXISTS public.comments_public;
CREATE VIEW public.comments_public 
WITH (security_invoker = true) AS
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
GRANT SELECT ON public.comments_public TO authenticated;

-- Drop and recreate settings_public view with SECURITY INVOKER
DROP VIEW IF EXISTS public.settings_public;
CREATE VIEW public.settings_public 
WITH (security_invoker = true) AS
SELECT 
  id,
  key,
  value,
  updated_at
FROM public.settings
WHERE key IN ('hero_image', 'hero_image_left', 'hero_image_right');

-- Grant SELECT on the public settings view to anonymous and authenticated users
GRANT SELECT ON public.settings_public TO anon;
GRANT SELECT ON public.settings_public TO authenticated;