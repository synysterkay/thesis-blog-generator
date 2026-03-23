-- Email lifecycle tracking table for behavioral email sequences.
-- Each row = one user enrolled in one sequence at a specific step.
CREATE TABLE IF NOT EXISTS email_lifecycle (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  name text,
  sequence text NOT NULL CHECK (sequence IN ('onboarding', 'post_generation', 'conversion', 'retention')),
  step integer NOT NULL DEFAULT 1,
  active boolean NOT NULL DEFAULT true,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  last_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, sequence)
);

-- Index for the lifecycle cron query: active sequences ordered by enrollment
CREATE INDEX idx_lifecycle_active
  ON email_lifecycle (active, sequence)
  WHERE active = true;

-- Index for user lookups (e.g. deactivating sequences on conversion)
CREATE INDEX idx_lifecycle_user ON email_lifecycle (user_id);

-- Enable RLS
ALTER TABLE email_lifecycle ENABLE ROW LEVEL SECURITY;

-- Service role full access (API routes use service key)
CREATE POLICY "Service role has full access to email_lifecycle"
  ON email_lifecycle
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Auto-update updated_at
CREATE TRIGGER email_lifecycle_updated_at
  BEFORE UPDATE ON email_lifecycle
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
