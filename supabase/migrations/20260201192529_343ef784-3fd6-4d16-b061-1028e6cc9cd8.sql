-- Add RLS policy for public sell vehicle submissions
-- This allows anonymous users to insert leads from marketplace_sell source

CREATE POLICY "Allow public sell vehicle submissions" 
ON public.leads 
FOR INSERT 
TO anon
WITH CHECK (
  source = 'marketplace_sell' 
  AND user_id = '00000000-0000-0000-0000-000000000000'
);

-- Also add policy for public marketplace enquiries
CREATE POLICY "Allow public marketplace enquiries" 
ON public.leads 
FOR INSERT 
TO anon
WITH CHECK (
  source = 'marketplace' 
  AND user_id IS NOT NULL
);