
CREATE TABLE public.verification_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  reputation_hash TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'verified',
  tx_hash TEXT NOT NULL,
  explorer_url TEXT,
  chain TEXT NOT NULL DEFAULT 'CHOICE Cloud',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.verification_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read verification transactions"
  ON public.verification_transactions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert own verifications"
  ON public.verification_transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);
