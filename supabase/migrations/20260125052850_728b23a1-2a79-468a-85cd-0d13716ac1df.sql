-- Add strike-out price field for public page visibility
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS strikeout_price numeric DEFAULT NULL;