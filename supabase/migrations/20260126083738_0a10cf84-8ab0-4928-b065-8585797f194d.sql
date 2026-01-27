-- Add marketplace settings columns to settings table
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS marketplace_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS marketplace_description text,
ADD COLUMN IF NOT EXISTS marketplace_featured boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS marketplace_badge text,
ADD COLUMN IF NOT EXISTS marketplace_working_hours text;