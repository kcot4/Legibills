CREATE POLICY "Admins can update bill topics" ON public.bills
FOR UPDATE TO authenticated
USING (auth.uid() IN (SELECT id FROM public.user_profiles WHERE role = 'admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM public.user_profiles WHERE role = 'admin'));
