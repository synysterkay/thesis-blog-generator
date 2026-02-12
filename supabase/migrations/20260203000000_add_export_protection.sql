-- Add export unlocks table for one-time purchases
CREATE TABLE IF NOT EXISTS public.export_unlocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  thesis_id UUID NOT NULL,
  lemonsqueezy_order_id TEXT,
  amount_paid INTEGER DEFAULT 499, -- cents
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, thesis_id)
);

-- Add expires_at column to theses for 7-day free tier expiry
ALTER TABLE public.theses ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Add copy_protected column to theses (true for free users)
ALTER TABLE public.theses ADD COLUMN IF NOT EXISTS copy_protected BOOLEAN DEFAULT false;

-- Enable RLS on export_unlocks
ALTER TABLE public.export_unlocks ENABLE ROW LEVEL SECURITY;

-- Users can view their own export unlocks
CREATE POLICY "Users can view own export unlocks" ON public.export_unlocks
  FOR SELECT USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_export_unlocks_user_thesis ON public.export_unlocks(user_id, thesis_id);
CREATE INDEX IF NOT EXISTS idx_theses_expires_at ON public.theses(expires_at) WHERE expires_at IS NOT NULL;

-- Function to set thesis expiry for free users (called on thesis creation)
CREATE OR REPLACE FUNCTION public.set_thesis_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user has active subscription
  IF NOT EXISTS (
    SELECT 1 FROM public.subscriptions 
    WHERE user_id = NEW.user_id 
    AND status = 'active'
    AND (plan_type != 'free' OR plan_type IS NULL)
  ) THEN
    -- Free user: set 7-day expiry and copy protection
    NEW.expires_at := NOW() + INTERVAL '7 days';
    NEW.copy_protected := true;
  ELSE
    -- Premium user: no expiry, no copy protection
    NEW.expires_at := NULL;
    NEW.copy_protected := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically set expiry on new theses
DROP TRIGGER IF EXISTS trigger_set_thesis_expiry ON public.theses;
CREATE TRIGGER trigger_set_thesis_expiry
  BEFORE INSERT ON public.theses
  FOR EACH ROW
  EXECUTE FUNCTION public.set_thesis_expiry();

-- Update function: when user upgrades, remove expiry from all their theses
CREATE OR REPLACE FUNCTION public.handle_subscription_upgrade()
RETURNS TRIGGER AS $$
BEGIN
  -- If subscription status changed to active with a paid plan
  IF NEW.status = 'active' AND (NEW.plan_type != 'free' OR NEW.plan_type IS NULL) THEN
    UPDATE public.theses 
    SET expires_at = NULL, copy_protected = false
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for subscription upgrades
DROP TRIGGER IF EXISTS trigger_subscription_upgrade ON public.subscriptions;
CREATE TRIGGER trigger_subscription_upgrade
  AFTER UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_subscription_upgrade();
