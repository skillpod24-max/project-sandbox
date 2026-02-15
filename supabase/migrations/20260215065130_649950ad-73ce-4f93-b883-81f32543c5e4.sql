-- Add storage policies for emidocuments bucket
CREATE POLICY "Users can upload EMI documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'emidocuments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view EMI documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'emidocuments');

CREATE POLICY "Users can delete EMI documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'emidocuments' AND auth.uid()::text = (storage.foldername(name))[1]);