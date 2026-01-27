-- First, sync marketplace_admins with user_roles (for existing admins)
INSERT INTO public.marketplace_admins (user_id, permission)
SELECT user_id, 'marketplace_admin'::admin_permission
FROM public.user_roles
WHERE role = 'admin'
ON CONFLICT (user_id) DO NOTHING;

-- Create bidding system tables
-- Auction listings table
CREATE TABLE IF NOT EXISTS public.auction_listings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
    created_by UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    starting_price NUMERIC NOT NULL DEFAULT 0,
    reserve_price NUMERIC,
    current_bid NUMERIC DEFAULT 0,
    current_bidder_id UUID,
    bid_count INTEGER DEFAULT 0,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'auction_live', 'auction_ended', 'post_bid_seller_pending', 'post_bid_dealer_pending', 'post_bid_negotiation', 'payment_pending', 'sold', 'failed', 'cancelled')),
    winner_id UUID,
    final_price NUMERIC,
    seller_confirmed BOOLEAN DEFAULT FALSE,
    dealer_confirmed BOOLEAN DEFAULT FALSE,
    negotiation_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.auction_listings ENABLE ROW LEVEL SECURITY;

-- Bids table for tracking all bids
CREATE TABLE IF NOT EXISTS public.auction_bids (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    auction_id UUID NOT NULL REFERENCES public.auction_listings(id) ON DELETE CASCADE,
    bidder_id UUID NOT NULL,
    bid_amount NUMERIC NOT NULL,
    is_winning BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.auction_bids ENABLE ROW LEVEL SECURITY;

-- Auction state log for audit trail
CREATE TABLE IF NOT EXISTS public.auction_state_log (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    auction_id UUID NOT NULL REFERENCES public.auction_listings(id) ON DELETE CASCADE,
    from_status TEXT,
    to_status TEXT NOT NULL,
    performed_by UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.auction_state_log ENABLE ROW LEVEL SECURITY;

-- Vehicle inspection reports table
CREATE TABLE IF NOT EXISTS public.vehicle_inspections (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    inspector_id UUID,
    inspection_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    exterior_score INTEGER CHECK (exterior_score >= 0 AND exterior_score <= 100),
    interior_score INTEGER CHECK (interior_score >= 0 AND interior_score <= 100),
    mechanical_score INTEGER CHECK (mechanical_score >= 0 AND mechanical_score <= 100),
    electrical_score INTEGER CHECK (electrical_score >= 0 AND electrical_score <= 100),
    tyres_score INTEGER CHECK (tyres_score >= 0 AND tyres_score <= 100),
    checklist JSONB DEFAULT '{}',
    notes TEXT,
    photos TEXT[],
    is_certified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vehicle_inspections ENABLE ROW LEVEL SECURITY;

-- Marketplace settings for admin controls
CREATE TABLE IF NOT EXISTS public.marketplace_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default settings
INSERT INTO public.marketplace_settings (setting_key, setting_value) 
VALUES 
    ('vehicles_per_page', '6'),
    ('banner_image_url', ''),
    ('featured_vehicle_limit', '6')
ON CONFLICT (setting_key) DO NOTHING;

-- Enable RLS
ALTER TABLE public.marketplace_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Auction listings - viewable by all authenticated, manageable by admins
CREATE POLICY "Anyone can view active auctions" ON public.auction_listings
FOR SELECT USING (true);

CREATE POLICY "Admins can manage auctions" ON public.auction_listings
FOR ALL USING (public.is_marketplace_admin(auth.uid()));

CREATE POLICY "Users can bid on auctions" ON public.auction_listings
FOR UPDATE USING (status = 'auction_live');

-- Auction bids - viewable by all, insertable by authenticated
CREATE POLICY "Anyone can view bids" ON public.auction_bids
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can bid" ON public.auction_bids
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Auction state log - viewable by admins
CREATE POLICY "Admins can view state logs" ON public.auction_state_log
FOR SELECT USING (public.is_marketplace_admin(auth.uid()));

CREATE POLICY "Admins can insert state logs" ON public.auction_state_log
FOR INSERT WITH CHECK (public.is_marketplace_admin(auth.uid()));

-- Vehicle inspections - viewable by all, manageable by owner/admin
CREATE POLICY "Anyone can view inspections" ON public.vehicle_inspections
FOR SELECT USING (true);

CREATE POLICY "Admins can manage inspections" ON public.vehicle_inspections
FOR ALL USING (public.is_marketplace_admin(auth.uid()));

-- Marketplace settings - viewable by all, manageable by admins
CREATE POLICY "Anyone can view marketplace settings" ON public.marketplace_settings
FOR SELECT USING (true);

CREATE POLICY "Admins can update marketplace settings" ON public.marketplace_settings
FOR UPDATE USING (public.is_marketplace_admin(auth.uid()));

-- Enable realtime for auction tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.auction_listings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.auction_bids;