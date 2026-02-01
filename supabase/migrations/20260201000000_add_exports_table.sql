-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Exports table for background export jobs
CREATE TABLE public.exports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  thesis_id UUID REFERENCES public.theses(id) ON DELETE CASCADE NOT NULL,
  thesis_title TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('pdf', 'docx', 'latex', 'markdown')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  file_path TEXT,
  file_size INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;

-- Exports policies
CREATE POLICY "Users can view own exports" ON public.exports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exports" ON public.exports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own exports" ON public.exports
  FOR DELETE USING (auth.uid() = user_id);

-- Allow service role to update exports (for background processing)
CREATE POLICY "Service role can update exports" ON public.exports
  FOR UPDATE USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_exports_updated_at
  BEFORE UPDATE ON public.exports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Index for better performance
CREATE INDEX idx_exports_user_id ON public.exports(user_id);
CREATE INDEX idx_exports_status ON public.exports(status);
CREATE INDEX idx_exports_created_at ON public.exports(created_at DESC);
