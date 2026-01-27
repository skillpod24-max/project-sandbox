-- Create vehicle-documents storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vehicle-documents', 'vehicle-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for vehicle-documents bucket
CREATE POLICY "Users can view their own vehicle documents" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'vehicle-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload vehicle documents" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'vehicle-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own vehicle documents" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'vehicle-documents' AND auth.uid()::text = (storage.foldername(name))[1]);