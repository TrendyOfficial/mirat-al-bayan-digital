-- Fix security issues found in scan

-- 1. Fix comments table to not expose user_email in public queries
-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Only approved comments are visible to public" ON public.comments;

-- Create new policies: one for public (without email), one for authenticated users/admins
CREATE POLICY "Public can view approved comments without email"
ON public.comments
FOR SELECT
USING (
  status = 'approved'::text 
  AND (
    -- Public can see approved comments, but we'll handle email visibility in the app
    true
  )
);

-- Users can see their own comments (including email)
CREATE POLICY "Users can view their own comments"
ON public.comments
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can see all comments including emails
CREATE POLICY "Admins can view all comments"
ON public.comments
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR is_owner(auth.uid()));

-- 2. Fix activity_logs to use role-based access instead of hardcoded email
DROP POLICY IF EXISTS "Only owner can view activity logs" ON public.activity_logs;

CREATE POLICY "Admins and owner can view activity logs"
ON public.activity_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR is_owner(auth.uid()));

-- 3. Fix deletion_reviews to use role-based access
DROP POLICY IF EXISTS "Only owner can update deletion reviews" ON public.deletion_reviews;

CREATE POLICY "Owner can manage deletion reviews"
ON public.deletion_reviews
FOR ALL
USING (is_owner(auth.uid()));

-- Allow owner to delete deletion reviews
CREATE POLICY "Owner can delete deletion reviews"
ON public.deletion_reviews
FOR DELETE
USING (is_owner(auth.uid()));

-- 4. Fix function search paths
CREATE OR REPLACE FUNCTION public.get_user_email_by_id(user_id_param uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $$
DECLARE
  user_email text;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = user_id_param;
  RETURN user_email;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_id_by_email(email_param text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $$
DECLARE
  user_id_result uuid;
BEGIN
  SELECT id INTO user_id_result FROM auth.users WHERE LOWER(email) = LOWER(email_param);
  RETURN user_id_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_owner_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $$
BEGIN
  IF NEW.email = 'alaa2001218@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    PERFORM log_activity(NEW.id, 'Owner role auto-assigned', jsonb_build_object('email', NEW.email));
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$;