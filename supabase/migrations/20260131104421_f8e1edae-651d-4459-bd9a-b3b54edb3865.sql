-- Create proper RLS policies for vendors table
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own vendors" 
ON public.vendors 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vendors" 
ON public.vendors 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vendors" 
ON public.vendors 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vendors" 
ON public.vendors 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create proper RLS policies for vehicles table
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own vehicles" 
ON public.vehicles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public vehicles" 
ON public.vehicles 
FOR SELECT 
USING (is_public = true);

CREATE POLICY "Users can insert their own vehicles" 
ON public.vehicles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vehicles" 
ON public.vehicles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vehicles" 
ON public.vehicles 
FOR DELETE 
USING (auth.uid() = user_id);

-- Also allow anyone to view vehicle images for public vehicles
ALTER TABLE public.vehicle_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own vehicle images" ON public.vehicle_images;

CREATE POLICY "Users can view their own vehicle images" 
ON public.vehicle_images 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view images for public vehicles" 
ON public.vehicle_images 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.vehicles 
    WHERE vehicles.id = vehicle_images.vehicle_id 
    AND vehicles.is_public = true
  )
);