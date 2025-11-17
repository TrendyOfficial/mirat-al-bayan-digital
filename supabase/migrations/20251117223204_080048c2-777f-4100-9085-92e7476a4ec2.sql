-- Create a function to get user email from profile (security definer so it can access auth schema)
CREATE OR REPLACE FUNCTION public.get_user_email_by_id(user_id_param uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = user_id_param;
  RETURN user_email;
END;
$$;

-- Create a function to find user ID by email
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(email_param text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id_result uuid;
BEGIN
  SELECT id INTO user_id_result FROM auth.users WHERE LOWER(email) = LOWER(email_param);
  RETURN user_id_result;
END;
$$;