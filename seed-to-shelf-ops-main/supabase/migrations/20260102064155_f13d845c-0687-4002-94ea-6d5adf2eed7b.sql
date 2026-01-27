-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lead_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  vehicle_interest TEXT,
  budget_min NUMERIC,
  budget_max NUMERIC,
  source TEXT NOT NULL DEFAULT 'walk_in',
  status TEXT NOT NULL DEFAULT 'new',
  priority TEXT NOT NULL DEFAULT 'medium',
  assigned_to TEXT,
  follow_up_date DATE,
  last_contact_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create service_packages table
CREATE TABLE public.service_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  services_included TEXT[] NOT NULL DEFAULT '{}',
  price NUMERIC NOT NULL DEFAULT 0,
  duration_hours INTEGER NOT NULL DEFAULT 1,
  vehicle_types TEXT[] NOT NULL DEFAULT '{car}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create service_records table
CREATE TABLE public.service_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  service_number TEXT NOT NULL,
  vehicle_number TEXT NOT NULL,
  vehicle_name TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  service_type TEXT NOT NULL DEFAULT 'general',
  package_id UUID REFERENCES public.service_packages(id) ON DELETE SET NULL,
  services_done TEXT[] NOT NULL DEFAULT '{}',
  labor_cost NUMERIC NOT NULL DEFAULT 0,
  parts_cost NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add public page fields to vehicles table
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS public_page_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS show_engine_number BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_chassis_number BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS public_description TEXT,
ADD COLUMN IF NOT EXISTS public_highlights TEXT[],
ADD COLUMN IF NOT EXISTS public_features TEXT[];

-- Enable RLS on all tables
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_records ENABLE ROW LEVEL SECURITY;

-- Leads RLS policies
CREATE POLICY "Users can view their own leads" ON public.leads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own leads" ON public.leads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own leads" ON public.leads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own leads" ON public.leads FOR DELETE USING (auth.uid() = user_id);

-- Service packages RLS policies
CREATE POLICY "Users can view their own service packages" ON public.service_packages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own service packages" ON public.service_packages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own service packages" ON public.service_packages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own service packages" ON public.service_packages FOR DELETE USING (auth.uid() = user_id);

-- Service records RLS policies
CREATE POLICY "Users can view their own service records" ON public.service_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own service records" ON public.service_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own service records" ON public.service_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own service records" ON public.service_records FOR DELETE USING (auth.uid() = user_id);

-- Public access policy for vehicles - allow anonymous users to view public vehicles
CREATE POLICY "Anyone can view public vehicles" ON public.vehicles FOR SELECT USING (is_public = true);

-- Public access for vehicle images of public vehicles
CREATE POLICY "Anyone can view images of public vehicles" ON public.vehicle_images FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.vehicles WHERE id = vehicle_id AND is_public = true));

-- Create function to allow public lead submissions
CREATE OR REPLACE FUNCTION public.submit_public_lead(
  p_dealer_user_id UUID,
  p_customer_name TEXT,
  p_phone TEXT,
  p_email TEXT,
  p_vehicle_interest TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_lead_id UUID;
  lead_num TEXT;
BEGIN
  lead_num := 'LD' || upper(to_hex(extract(epoch from now())::int));
  
  INSERT INTO public.leads (
    user_id, lead_number, customer_name, phone, email, 
    vehicle_interest, source, status, priority, notes
  ) VALUES (
    p_dealer_user_id, lead_num, p_customer_name, p_phone, p_email,
    p_vehicle_interest, 'website', 'new', 'medium', p_notes
  ) RETURNING id INTO new_lead_id;
  
  RETURN new_lead_id;
END;
$$;

-- Add updated_at triggers
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_service_packages_updated_at BEFORE UPDATE ON public.service_packages FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_service_records_updated_at BEFORE UPDATE ON public.service_records FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();