
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_wallet TEXT NOT NULL,
  referral_code TEXT NOT NULL UNIQUE,
  referred_wallet TEXT,
  referred_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  joined_at TIMESTAMPTZ
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read referrals" ON public.referrals FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert referrals" ON public.referrals FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update referrals" ON public.referrals FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
