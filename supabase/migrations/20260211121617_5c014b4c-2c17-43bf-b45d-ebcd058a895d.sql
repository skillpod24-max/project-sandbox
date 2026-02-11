-- Performance indexes for faster queries across the platform

-- Vehicles: frequently filtered/sorted columns
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON public.vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_is_public ON public.vehicles(is_public);
CREATE INDEX IF NOT EXISTS idx_vehicles_vehicle_type ON public.vehicles(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_vehicles_fuel_type ON public.vehicles(fuel_type);
CREATE INDEX IF NOT EXISTS idx_vehicles_selling_price ON public.vehicles(selling_price);
CREATE INDEX IF NOT EXISTS idx_vehicles_brand ON public.vehicles(brand);
CREATE INDEX IF NOT EXISTS idx_vehicles_created_at ON public.vehicles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicles_user_public_status ON public.vehicles(user_id, is_public, status);

-- Vehicle images: lookup by vehicle
CREATE INDEX IF NOT EXISTS idx_vehicle_images_vehicle_id ON public.vehicle_images(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_images_primary ON public.vehicle_images(vehicle_id, is_primary);

-- Settings: marketplace lookups
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON public.settings(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_marketplace ON public.settings(public_page_enabled, marketplace_enabled);
CREATE INDEX IF NOT EXISTS idx_settings_public_page_id ON public.settings(public_page_id);

-- Leads: dealer and status filtering
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_user_status ON public.leads(user_id, status);

-- Sales: dealer and status
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON public.sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON public.sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_vehicle_id ON public.sales(vehicle_id);

-- EMI schedules
CREATE INDEX IF NOT EXISTS idx_emi_schedules_sale_id ON public.emi_schedules(sale_id);
CREATE INDEX IF NOT EXISTS idx_emi_schedules_user_id ON public.emi_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_emi_schedules_status ON public.emi_schedules(status);
CREATE INDEX IF NOT EXISTS idx_emi_schedules_due_date ON public.emi_schedules(due_date);

-- Payments
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON public.payments(reference_id, reference_type);

-- Customers
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);

-- Expenses
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_vehicle_id ON public.expenses(vehicle_id);

-- Testimonials
CREATE INDEX IF NOT EXISTS idx_testimonials_user_id ON public.dealer_testimonials(user_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_verified ON public.dealer_testimonials(user_id, is_verified);

-- Purchases
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.vehicle_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_vehicle_id ON public.vehicle_purchases(vehicle_id);

-- Documents
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_reference ON public.documents(reference_id, reference_type);

-- Public page events
CREATE INDEX IF NOT EXISTS idx_page_events_dealer ON public.public_page_events(dealer_user_id);
CREATE INDEX IF NOT EXISTS idx_page_events_type ON public.public_page_events(event_type);
CREATE INDEX IF NOT EXISTS idx_page_events_created ON public.public_page_events(created_at DESC);

-- Auction
CREATE INDEX IF NOT EXISTS idx_auction_bids_auction ON public.auction_bids(auction_id);
CREATE INDEX IF NOT EXISTS idx_auction_listings_status ON public.auction_listings(status);