-- Remove yearly and lifetime plan types (plans consolidated to free, monthly, unlimited)
-- First migrate any existing yearly/lifetime subscriptions to 'unlimited'
UPDATE public.subscriptions SET plan_type = 'unlimited' WHERE plan_type IN ('yearly', 'lifetime');

-- Update the check constraint to only allow current plan types
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_type_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_plan_type_check 
  CHECK (plan_type IN ('free', 'monthly', 'unlimited'));
