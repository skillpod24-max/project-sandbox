-- Allow marketplace admins to read ALL public_page_events for analytics
CREATE POLICY "Admins can read all analytics"
ON public.public_page_events
FOR SELECT
USING (public.is_marketplace_admin(auth.uid()));

-- Allow marketplace admins to read ALL leads (for sell requests)
CREATE POLICY "Admins can view all leads"
ON public.leads
FOR SELECT
USING (public.is_marketplace_admin(auth.uid()));

-- Allow marketplace admins to read ALL settings (for city filter)
CREATE POLICY "Admins can view all settings"
ON public.settings
FOR SELECT
USING (public.is_marketplace_admin(auth.uid()));

-- Allow marketplace admins to read ALL vehicles
CREATE POLICY "Admins can view all vehicles"
ON public.vehicles
FOR SELECT
USING (public.is_marketplace_admin(auth.uid()));

-- Allow marketplace admins to update vehicles (for featured toggle)
CREATE POLICY "Admins can update all vehicles"
ON public.vehicles
FOR UPDATE
USING (public.is_marketplace_admin(auth.uid()));