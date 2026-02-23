-- Allow dealers to view sell requests assigned to them
CREATE POLICY "Dealers can view assigned sell requests"
ON public.leads
FOR SELECT
USING (assigned_to = auth.uid()::text AND source = 'marketplace_sell');