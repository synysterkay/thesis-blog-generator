-- Create exports storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exports', 
  'exports', 
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/x-tex', 'text/markdown']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for exports bucket
CREATE POLICY "Users can upload their own exports"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'exports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own exports"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'exports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own exports"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'exports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Service role can manage all exports (for background processing)
CREATE POLICY "Service role can manage exports"
ON storage.objects FOR ALL
USING (bucket_id = 'exports')
WITH CHECK (bucket_id = 'exports');
