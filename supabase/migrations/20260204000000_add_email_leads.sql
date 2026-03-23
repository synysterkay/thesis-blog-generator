-- Email leads table for drip marketing campaign
CREATE TABLE IF NOT EXISTS email_leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  name text,
  user_id uuid REFERENCES auth.users(id),
  subscribed boolean DEFAULT true NOT NULL,
  converted boolean DEFAULT false NOT NULL,
  sequence_day integer DEFAULT 0 NOT NULL,
  sequence_active boolean DEFAULT true NOT NULL,
  last_email_sent_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Index for the drip cron query
CREATE INDEX idx_email_leads_drip_query 
  ON email_leads (subscribed, sequence_active, converted, sequence_day)
  WHERE subscribed = true AND sequence_active = true AND converted = false;

-- Index for email lookups
CREATE INDEX idx_email_leads_email ON email_leads (email);

-- Index for user_id lookups
CREATE INDEX idx_email_leads_user_id ON email_leads (user_id) WHERE user_id IS NOT NULL;

-- Enable RLS
ALTER TABLE email_leads ENABLE ROW LEVEL SECURITY;

-- Policy: service role has full access (used by API routes)
CREATE POLICY "Service role has full access to email_leads"
  ON email_leads
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_email_leads_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_leads_updated_at
  BEFORE UPDATE ON email_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_email_leads_updated_at();
