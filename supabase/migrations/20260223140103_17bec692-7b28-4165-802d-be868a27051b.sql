
-- Add marketplace tagline (separate from catalogue shop_tagline)
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS marketplace_tagline text;

-- Add Google reviews fields
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS google_reviews_rating numeric;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS google_reviews_count integer;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS google_reviews_url text;
