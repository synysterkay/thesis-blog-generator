-- Create reference_documents table for storing uploaded document metadata and extracted text
CREATE TABLE IF NOT EXISTS reference_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thesis_id UUID REFERENCES theses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  extracted_text TEXT,
  chunks JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_reference_documents_thesis_id ON reference_documents(thesis_id);
CREATE INDEX IF NOT EXISTS idx_reference_documents_user_id ON reference_documents(user_id);

-- Enable RLS
ALTER TABLE reference_documents ENABLE ROW LEVEL SECURITY;

-- Users can only access their own documents
CREATE POLICY "Users can view own reference documents"
  ON reference_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reference documents"
  ON reference_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reference documents"
  ON reference_documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reference documents"
  ON reference_documents FOR DELETE
  USING (auth.uid() = user_id);

-- Create storage bucket for reference documents (run in Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('reference-docs', 'reference-docs', false);
