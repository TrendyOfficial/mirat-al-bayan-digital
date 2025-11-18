-- Add encrypted column for sensitive log data
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS encrypted_data TEXT;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS user_role TEXT;

-- Update log_activity function to include role
CREATE OR REPLACE FUNCTION public.log_activity(p_user_id uuid, p_action text, p_details jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email TEXT;
  v_user_name TEXT;
  v_user_role TEXT;
BEGIN
  -- Get user email and name
  SELECT email INTO v_user_email FROM auth.users WHERE id = p_user_id;
  SELECT full_name INTO v_user_name FROM public.profiles WHERE id = p_user_id;
  
  -- Get user role (check user_roles table)
  SELECT role::text INTO v_user_role 
  FROM public.user_roles 
  WHERE user_id = p_user_id 
  LIMIT 1;
  
  -- If no role found, check if owner
  IF v_user_role IS NULL AND v_user_email = 'alaa2001218@gmail.com' THEN
    v_user_role := 'owner';
  ELSIF v_user_role IS NULL THEN
    v_user_role := 'user';
  END IF;
  
  -- Insert log
  INSERT INTO public.activity_logs (user_id, user_email, user_name, action, details, user_role)
  VALUES (p_user_id, v_user_email, COALESCE(v_user_name, 'Unknown'), p_action, p_details, v_user_role);
END;
$$;