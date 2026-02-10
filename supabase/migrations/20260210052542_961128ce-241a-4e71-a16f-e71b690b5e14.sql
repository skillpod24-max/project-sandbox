
-- Add registration_year column to vehicles table
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS registration_year integer;

-- Create support_tickets table for Report an Issue
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (public form)
CREATE POLICY "Anyone can submit a support ticket"
ON public.support_tickets
FOR INSERT
WITH CHECK (true);

-- Only marketplace admins can view tickets
CREATE POLICY "Admins can view support tickets"
ON public.support_tickets
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.marketplace_admins
    WHERE marketplace_admins.user_id = auth.uid()
  )
);

-- Admins can update ticket status
CREATE POLICY "Admins can update support tickets"
ON public.support_tickets
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.marketplace_admins
    WHERE marketplace_admins.user_id = auth.uid()
  )
);
