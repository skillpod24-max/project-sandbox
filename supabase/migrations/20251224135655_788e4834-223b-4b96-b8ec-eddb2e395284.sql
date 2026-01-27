-- Drop existing tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS public.production_material_usage CASCADE;
DROP TABLE IF EXISTS public.production_orders CASCADE;
DROP TABLE IF EXISTS public.purchase_order_items CASCADE;
DROP TABLE IF EXISTS public.purchase_orders CASCADE;
DROP TABLE IF EXISTS public.inventory CASCADE;
DROP TABLE IF EXISTS public.materials CASCADE;
DROP TABLE IF EXISTS public.material_categories CASCADE;
DROP TABLE IF EXISTS public.vendors CASCADE;
DROP TABLE IF EXISTS public.warehouses CASCADE;

-- Drop existing enums
DROP TYPE IF EXISTS public.order_status CASCADE;
DROP TYPE IF EXISTS public.production_status CASCADE;
DROP TYPE IF EXISTS public.qc_status CASCADE;
DROP TYPE IF EXISTS public.stock_status CASCADE;

-- Create new enums for Vehicle Dealer System
CREATE TYPE public.vehicle_type AS ENUM ('car', 'bike', 'commercial');
CREATE TYPE public.vehicle_condition AS ENUM ('new', 'used');
CREATE TYPE public.fuel_type AS ENUM ('petrol', 'diesel', 'electric', 'hybrid', 'cng', 'lpg');
CREATE TYPE public.transmission_type AS ENUM ('manual', 'automatic', 'cvt', 'dct');
CREATE TYPE public.vehicle_status AS ENUM ('in_stock', 'reserved', 'sold');
CREATE TYPE public.payment_mode AS ENUM ('cash', 'bank_transfer', 'cheque', 'upi', 'card', 'emi');
CREATE TYPE public.payment_type AS ENUM ('customer_payment', 'vendor_payment', 'emi_payment', 'expense');
CREATE TYPE public.document_type AS ENUM ('rc', 'insurance', 'puc', 'invoice', 'sale_agreement', 'delivery_note', 'id_proof', 'driving_license');
CREATE TYPE public.document_status AS ENUM ('pending', 'completed', 'expired');
CREATE TYPE public.sale_status AS ENUM ('inquiry', 'reserved', 'completed', 'cancelled');
CREATE TYPE public.emi_status AS ENUM ('pending', 'paid', 'overdue', 'partially_paid');

-- Vendors/Suppliers table
CREATE TABLE public.vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  gst_number TEXT,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_ifsc TEXT,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  id_proof_type TEXT,
  id_proof_number TEXT,
  driving_license_number TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vehicles table
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code TEXT NOT NULL,
  vehicle_type public.vehicle_type NOT NULL DEFAULT 'car',
  condition public.vehicle_condition NOT NULL DEFAULT 'used',
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  variant TEXT,
  manufacturing_year INTEGER NOT NULL,
  color TEXT,
  fuel_type public.fuel_type NOT NULL DEFAULT 'petrol',
  transmission public.transmission_type NOT NULL DEFAULT 'manual',
  engine_number TEXT,
  chassis_number TEXT,
  registration_number TEXT,
  odometer_reading INTEGER,
  purchase_price NUMERIC NOT NULL DEFAULT 0,
  selling_price NUMERIC NOT NULL DEFAULT 0,
  status public.vehicle_status NOT NULL DEFAULT 'in_stock',
  vendor_id UUID REFERENCES public.vendors(id),
  purchase_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vehicle Images table
CREATE TABLE public.vehicle_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vehicle Purchases (from vendors)
CREATE TABLE public.vehicle_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  purchase_number TEXT NOT NULL,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  purchase_price NUMERIC NOT NULL,
  payment_mode public.payment_mode NOT NULL DEFAULT 'cash',
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  balance_amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sales table
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sale_number TEXT NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  selling_price NUMERIC NOT NULL,
  discount NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  payment_mode public.payment_mode NOT NULL DEFAULT 'cash',
  is_emi BOOLEAN DEFAULT false,
  down_payment NUMERIC DEFAULT 0,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  balance_amount NUMERIC NOT NULL DEFAULT 0,
  status public.sale_status NOT NULL DEFAULT 'inquiry',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- EMI Schedules table
CREATE TABLE public.emi_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  emi_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  emi_amount NUMERIC NOT NULL,
  amount_paid NUMERIC DEFAULT 0,
  status public.emi_status NOT NULL DEFAULT 'pending',
  paid_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payments table (all money movements)
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  payment_number TEXT NOT NULL,
  payment_type public.payment_type NOT NULL,
  payment_mode public.payment_mode NOT NULL DEFAULT 'cash',
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference_id UUID, -- can reference sale, purchase, or emi
  reference_type TEXT, -- 'sale', 'purchase', 'emi'
  customer_id UUID REFERENCES public.customers(id),
  vendor_id UUID REFERENCES public.vendors(id),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  document_type public.document_type NOT NULL,
  reference_id UUID NOT NULL, -- vehicle_id, customer_id, or sale_id
  reference_type TEXT NOT NULL, -- 'vehicle', 'customer', 'sale'
  document_url TEXT NOT NULL,
  document_name TEXT NOT NULL,
  expiry_date DATE,
  status public.document_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  expense_number TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_mode public.payment_mode NOT NULL DEFAULT 'cash',
  vehicle_id UUID REFERENCES public.vehicles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Settings table
CREATE TABLE public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  dealer_name TEXT,
  dealer_address TEXT,
  dealer_phone TEXT,
  dealer_email TEXT,
  dealer_gst TEXT,
  invoice_prefix TEXT DEFAULT 'INV',
  sale_prefix TEXT DEFAULT 'SL',
  purchase_prefix TEXT DEFAULT 'PUR',
  tax_rate NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emi_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vendors
CREATE POLICY "Users can view their own vendors" ON public.vendors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own vendors" ON public.vendors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own vendors" ON public.vendors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own vendors" ON public.vendors FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for customers
CREATE POLICY "Users can view their own customers" ON public.customers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own customers" ON public.customers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own customers" ON public.customers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own customers" ON public.customers FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for vehicles
CREATE POLICY "Users can view their own vehicles" ON public.vehicles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own vehicles" ON public.vehicles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own vehicles" ON public.vehicles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own vehicles" ON public.vehicles FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for vehicle_images
CREATE POLICY "Users can view their own vehicle images" ON public.vehicle_images FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own vehicle images" ON public.vehicle_images FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own vehicle images" ON public.vehicle_images FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own vehicle images" ON public.vehicle_images FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for vehicle_purchases
CREATE POLICY "Users can view their own purchases" ON public.vehicle_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own purchases" ON public.vehicle_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own purchases" ON public.vehicle_purchases FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own purchases" ON public.vehicle_purchases FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for sales
CREATE POLICY "Users can view their own sales" ON public.sales FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own sales" ON public.sales FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sales" ON public.sales FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sales" ON public.sales FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for emi_schedules
CREATE POLICY "Users can view their own emi schedules" ON public.emi_schedules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own emi schedules" ON public.emi_schedules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own emi schedules" ON public.emi_schedules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own emi schedules" ON public.emi_schedules FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for payments
CREATE POLICY "Users can view their own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own payments" ON public.payments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own payments" ON public.payments FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for documents
CREATE POLICY "Users can view their own documents" ON public.documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own documents" ON public.documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own documents" ON public.documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own documents" ON public.documents FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for expenses
CREATE POLICY "Users can view their own expenses" ON public.expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own expenses" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own expenses" ON public.expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own expenses" ON public.expenses FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for settings
CREATE POLICY "Users can view their own settings" ON public.settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own settings" ON public.settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON public.settings FOR UPDATE USING (auth.uid() = user_id);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('vehicle-images', 'vehicle-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Storage policies for vehicle-images bucket
CREATE POLICY "Vehicle images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'vehicle-images');
CREATE POLICY "Users can upload vehicle images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'vehicle-images' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update their vehicle images" ON storage.objects FOR UPDATE USING (bucket_id = 'vehicle-images' AND auth.role() = 'authenticated');
CREATE POLICY "Users can delete their vehicle images" ON storage.objects FOR DELETE USING (bucket_id = 'vehicle-images' AND auth.role() = 'authenticated');

-- Storage policies for documents bucket
CREATE POLICY "Users can view documents" ON storage.objects FOR SELECT USING (bucket_id = 'documents' AND auth.role() = 'authenticated');
CREATE POLICY "Users can upload documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update documents" ON storage.objects FOR UPDATE USING (bucket_id = 'documents' AND auth.role() = 'authenticated');
CREATE POLICY "Users can delete documents" ON storage.objects FOR DELETE USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- Add updated_at triggers
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_vehicle_purchases_updated_at BEFORE UPDATE ON public.vehicle_purchases FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_emi_schedules_updated_at BEFORE UPDATE ON public.emi_schedules FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();