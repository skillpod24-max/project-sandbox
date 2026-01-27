-- Add automotive-specific fields to vehicles table
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS tyre_condition text;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS insurance_expiry date;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS puc_expiry date;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS fitness_expiry date;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS permit_expiry date;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS road_tax_expiry date;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS battery_health text;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS service_history text;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS number_of_owners integer DEFAULT 1;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS hypothecation text;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS last_service_date date;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS next_service_due date;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS mileage numeric;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS seating_capacity integer;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS boot_space text;

-- Add dealer public page settings
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS public_page_enabled boolean DEFAULT false;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS shop_logo_url text;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS shop_tagline text;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS gmap_link text;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS whatsapp_number text;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS public_page_id text UNIQUE;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS show_testimonials boolean DEFAULT true;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS show_ratings boolean DEFAULT true;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS show_vehicles_sold boolean DEFAULT true;

-- Create dealer testimonials table
CREATE TABLE IF NOT EXISTS public.dealer_testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  is_verified BOOLEAN DEFAULT false,
  sale_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on testimonials
ALTER TABLE public.dealer_testimonials ENABLE ROW LEVEL SECURITY;

-- RLS policies for testimonials - owner can manage, public can view
CREATE POLICY "Users can manage their own testimonials" ON public.dealer_testimonials 
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view testimonials" ON public.dealer_testimonials 
FOR SELECT USING (true);