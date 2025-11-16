-- Create activity logs table for tracking all admin actions
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  user_name TEXT,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create deletion review queue for categories and publications
CREATE TABLE IF NOT EXISTS public.deletion_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type TEXT NOT NULL CHECK (item_type IN ('category', 'publication')),
  item_id UUID NOT NULL,
  item_data JSONB NOT NULL,
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  requested_by_email TEXT NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deletion_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activity_logs (only owner can view)
CREATE POLICY "Only owner can view activity logs"
ON public.activity_logs
FOR SELECT
USING ((SELECT email FROM auth.users WHERE id = auth.uid()) = 'alaa2001218@gmail.com');

-- RLS Policies for deletion_reviews
CREATE POLICY "Authenticated users can view deletion reviews"
ON public.deletion_reviews
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and editors can insert deletion reviews"
ON public.deletion_reviews
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Only owner can update deletion reviews"
ON public.deletion_reviews
FOR UPDATE
USING ((SELECT email FROM auth.users WHERE id = auth.uid()) = 'alaa2001218@gmail.com');

-- Create function to log activity
CREATE OR REPLACE FUNCTION public.log_activity(
  p_user_id UUID,
  p_action TEXT,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email TEXT;
  v_user_name TEXT;
BEGIN
  -- Get user email and name
  SELECT email INTO v_user_email FROM auth.users WHERE id = p_user_id;
  SELECT full_name INTO v_user_name FROM public.profiles WHERE id = p_user_id;
  
  -- Insert log
  INSERT INTO public.activity_logs (user_id, user_email, user_name, action, details)
  VALUES (p_user_id, v_user_email, COALESCE(v_user_name, 'Unknown'), p_action, p_details);
END;
$$;

-- Create trigger to automatically restore owner role on signup
CREATE OR REPLACE FUNCTION public.ensure_owner_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the user is the owner email
  IF NEW.email = 'alaa2001218@gmail.com' THEN
    -- Add admin role (which effectively makes them owner)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Log the action
    PERFORM log_activity(NEW.id, 'Owner role auto-assigned', jsonb_build_object('email', NEW.email));
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_owner_signup ON auth.users;
CREATE TRIGGER on_owner_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_owner_role();

-- Create function to check if user is owner
CREATE OR REPLACE FUNCTION public.is_owner(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = _user_id
      AND email = 'alaa2001218@gmail.com'
  )
$$;

-- Restore owner's admin role if they exist
DO $$
DECLARE
  v_owner_id UUID;
BEGIN
  SELECT id INTO v_owner_id FROM auth.users WHERE email = 'alaa2001218@gmail.com';
  
  IF v_owner_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_owner_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_email ON public.activity_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_deletion_reviews_status ON public.deletion_reviews(status);
CREATE INDEX IF NOT EXISTS idx_deletion_reviews_item_type ON public.deletion_reviews(item_type);