-- Referral system tables

-- Referral codes (one per user, reusable link)
CREATE TABLE public.referral_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referrals tracking (who referred whom)
CREATE TABLE public.referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'qualified')),
  qualified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referral credits balance per user
CREATE TABLE public.referral_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  credits_earned INTEGER DEFAULT 0,
  credits_used INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_credits ENABLE ROW LEVEL SECURITY;

-- Referral codes: users can view their own
CREATE POLICY "Users can view own referral code" ON public.referral_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own referral code" ON public.referral_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Referrals: users can view where they are referrer
CREATE POLICY "Users can view own referrals" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id);

-- Service role can insert/update referrals
CREATE POLICY "Service role can manage referrals" ON public.referrals
  FOR ALL USING (true);

-- Referral credits: users can view their own
CREATE POLICY "Users can view own credits" ON public.referral_credits
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage credits
CREATE POLICY "Service role can manage credits" ON public.referral_credits
  FOR ALL USING (true);

-- Indexes
CREATE INDEX idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX idx_referral_codes_user_id ON public.referral_codes(user_id);
CREATE INDEX idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_referred_user_id ON public.referrals(referred_user_id);
CREATE INDEX idx_referrals_status ON public.referrals(status);
CREATE INDEX idx_referral_credits_user_id ON public.referral_credits(user_id);

-- Triggers for updated_at
CREATE TRIGGER update_referral_credits_updated_at
  BEFORE UPDATE ON public.referral_credits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
