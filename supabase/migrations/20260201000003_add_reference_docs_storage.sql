-- Create reference-docs storage bucket for uploaded reference documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reference-docs', 
  'reference-docs', 
  false,
  20971520, -- 20MB limit (for premium users)
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for reference-docs bucket
CREATE POLICY "Users can upload their own reference docs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'reference-docs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own reference docs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'reference-docs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own reference docs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'reference-docs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Service role can manage all reference docs (for background processing)
CREATE POLICY "Service role can manage reference docs"
ON storage.objects FOR ALL
USING (bucket_id = 'reference-docs')
WITH CHECK (bucket_id = 'reference-docs');
