-- Add support for guest checkout flow (pay first, signup later)

-- Add email column to subscriptions for linking guest checkouts
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS lemonsqueezy_customer_email TEXT;

-- Make user_id nullable for guest checkouts (will be linked after signup)
ALTER TABLE public.subscriptions 
ALTER COLUMN user_id DROP NOT NULL;

-- Create table for pending subscription links (when user signs up before webhook fires)
CREATE TABLE IF NOT EXISTS public.pending_subscription_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  plan_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.pending_subscription_links ENABLE ROW LEVEL SECURITY;

-- Index for fast email lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_email ON public.subscriptions(lemonsqueezy_customer_email);
CREATE INDEX IF NOT EXISTS idx_pending_links_email ON public.pending_subscription_links(email);

-- Function to link subscription when user signs up with matching email
CREATE OR REPLACE FUNCTION public.link_subscription_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  pending_sub RECORD;
BEGIN
  -- Find any unlinked subscription with matching email
  SELECT * INTO pending_sub 
  FROM public.subscriptions 
  WHERE lemonsqueezy_customer_email = LOWER(NEW.email)
    AND user_id IS NULL
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF FOUND THEN
    -- Link the subscription to this new user
    UPDATE public.subscriptions 
    SET user_id = NEW.id, updated_at = NOW()
    WHERE id = pending_sub.id;
    
    RAISE LOG 'Linked subscription % to user %', pending_sub.id, NEW.id;
  END IF;
  
  -- Clean up any pending link requests
  DELETE FROM public.pending_subscription_links WHERE email = LOWER(NEW.email);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-link subscriptions on user creation
DROP TRIGGER IF EXISTS trigger_link_subscription_on_signup ON auth.users;
CREATE TRIGGER trigger_link_subscription_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.link_subscription_on_signup();
