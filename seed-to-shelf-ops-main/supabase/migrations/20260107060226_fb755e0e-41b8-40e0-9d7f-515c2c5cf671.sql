-- Add city column to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS city TEXT;

-- Add lead_type column to leads table (buying/selling)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lead_type TEXT DEFAULT 'buying';

-- Add last_viewed_at column to track when leads were viewed (for notification badge)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP WITH TIME ZONE;