-- Fix comments table to properly restrict email visibility
-- Drop all existing SELECT policies
DROP POLICY IF EXISTS "Public can view approved comments without email" ON public.comments;
DROP POLICY IF EXISTS "Users can view their own comments" ON public.comments;
DROP POLICY IF EXISTS "Admins can view all comments" ON public.comments;

-- Create a single comprehensive SELECT policy
-- This policy allows:
-- 1. Anyone to view approved comments (but app must not select user_email for public)
-- 2. Users to view their own comments
-- 3. Admins to view all comments
CREATE POLICY "Comments visibility policy"
ON public.comments
FOR SELECT
USING (
  -- Approved comments are visible to everyone
  (status = 'approved'::text)
  OR 
  -- Users can see their own comments
  (auth.uid() = user_id)
  OR
  -- Admins can see all comments
  (has_role(auth.uid(), 'admin'::app_role) OR is_owner(auth.uid()))
);

-- Fix deletion_reviews to restrict email visibility
-- Drop existing policy
DROP POLICY IF EXISTS "Authenticated users can view deletion reviews" ON public.deletion_reviews;

-- Create policy that only allows owner and requestor to view
CREATE POLICY "Only owner and requestor can view deletion reviews"
ON public.deletion_reviews
FOR SELECT
USING (
  is_owner(auth.uid()) OR requested_by = auth.uid()
);