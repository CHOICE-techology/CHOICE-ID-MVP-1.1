DROP POLICY IF EXISTS "Authenticated users can insert own verifications" ON public.verification_transactions;
CREATE POLICY "Anyone can insert verifications"
  ON public.verification_transactions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);