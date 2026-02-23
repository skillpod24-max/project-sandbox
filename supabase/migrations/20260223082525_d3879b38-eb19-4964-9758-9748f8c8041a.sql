-- Drop old constraint and add new one with 'featured' and 'listed'
ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS vehicles_marketplace_status_check;
ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_marketplace_status_check 
  CHECK (marketplace_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'suspended'::text, 'featured'::text, 'listed'::text]));

-- Also add admin UPDATE policy for leads so admin can update sell request status/assignment
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update all leads' AND tablename = 'leads') THEN
    CREATE POLICY "Admins can update all leads" ON public.leads FOR UPDATE USING (is_marketplace_admin(auth.uid()));
  END IF;
END $$;