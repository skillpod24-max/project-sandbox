-- Allow marketplace admins to update any dealer settings (for featuring, badges, etc.)
CREATE POLICY "Admins can update all settings"
ON public.settings
FOR UPDATE
USING (is_marketplace_admin(auth.uid()));

-- Allow marketplace admins to insert marketplace_settings
CREATE POLICY "Admins can insert marketplace settings"
ON public.marketplace_settings
FOR INSERT
WITH CHECK (is_marketplace_admin(auth.uid()));
