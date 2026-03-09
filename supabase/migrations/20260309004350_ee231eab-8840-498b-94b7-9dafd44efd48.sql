-- Fix search_path for the increment_choice_balance function
CREATE OR REPLACE FUNCTION increment_choice_balance(p_wallet_address text, p_amount integer)
RETURNS void AS $$
BEGIN
  UPDATE user_profiles
  SET 
    choice_balance = choice_balance + p_amount,
    updated_at = NOW()
  WHERE wallet_address = p_wallet_address;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
