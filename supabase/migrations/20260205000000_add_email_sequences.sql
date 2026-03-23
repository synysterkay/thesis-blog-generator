-- Email lifecycle sequences table
-- Tracks per-user, per-sequence progress for behavioral email campaigns.
-- A single user can be in multiple sequences simultaneously.

CREATE TABLE IF NOT EXISTS email_sequences (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  sequence_type text NOT NULL,          -- 'onboarding' | 'post_generation' | 'conversion' | 'retention'
  current_step integer DEFAULT 0 NOT NULL,
  total_steps integer NOT NULL,
  active boolean DEFAULT true NOT NULL,
  triggered_at timestamptz DEFAULT now() NOT NULL,
  last_sent_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  -- Prevent duplicate active sequences of the same type for the same email
  CONSTRAINT unique_active_sequence UNIQUE (email, sequence_type)
);

-- Index for the lifecycle cron query: fetch all active sequences
CREATE INDEX idx_email_sequences_active
  ON email_sequences (active, sequence_type, current_step)
  WHERE active = true;

-- Index for email lookups
CREATE INDEX idx_email_sequences_email ON email_sequences (email);

-- Index for user_id lookups
CREATE INDEX idx_email_sequences_user_id ON email_sequences (user_id) WHERE user_id IS NOT NULL;

-- Enable RLS
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;

-- Policy: service role has full access (used by API routes)
CREATE POLICY "Service role has full access to email_sequences"
  ON email_sequences
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_email_sequences_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_sequences_updated_at
  BEFORE UPDATE ON email_sequences
  FOR EACH ROW
  EXECUTE FUNCTION update_email_sequences_updated_at();
