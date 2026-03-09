-- Create a function to atomically increment choice_balance
CREATE OR REPLACE FUNCTION increment_choice_balance(p_wallet_address text, p_amount integer)
RETURNS void AS $$
BEGIN
  -- Try to update an existing row
  UPDATE user_profiles
  SET 
    choice_balance = choice_balance + p_amount,
    updated_at = NOW()
  WHERE wallet_address = p_wallet_address;
  
  -- If the row didn't exist, we rely on the application to create it
  -- (The edge function already has a fallback that handles this)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
