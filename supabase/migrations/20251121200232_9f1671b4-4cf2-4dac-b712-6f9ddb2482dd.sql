ALTER POLICY "Admins can manage user roles"
ON public.user_roles
USING (has_role(auth.uid(), 'admin'::app_role) OR is_owner(auth.uid()))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_owner(auth.uid()));