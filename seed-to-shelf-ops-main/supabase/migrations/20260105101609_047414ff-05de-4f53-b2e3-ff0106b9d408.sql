-- Allow public access to settings for enabled public pages
CREATE POLICY "Anyone can view settings for public pages" 
ON public.settings 
FOR SELECT 
USING (public_page_enabled = true);

-- Allow public access to dealer testimonials for public pages
CREATE POLICY "Public can insert testimonials for dealers with public pages"
ON public.dealer_testimonials
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.settings 
    WHERE settings.user_id = dealer_testimonials.user_id 
    AND settings.public_page_enabled = true
  )
);

-- Allow public access to sales count for public dealer pages
CREATE POLICY "Anyone can view sales count for public pages"
ON public.sales
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.settings 
    WHERE settings.user_id = sales.user_id 
    AND settings.public_page_enabled = true
  )
  AND status = 'completed'
);