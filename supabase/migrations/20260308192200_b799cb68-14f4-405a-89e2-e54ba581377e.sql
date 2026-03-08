
-- Create user_profiles table to persist identity data across sessions
CREATE TABLE public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  did TEXT NOT NULL,
  display_name TEXT,
  avatar TEXT,
  bio TEXT,
  credentials JSONB NOT NULL DEFAULT '[]'::jsonb,
  reputation_score INTEGER NOT NULL DEFAULT 0,
  last_anchor_hash TEXT,
  last_anchor_timestamp BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read profiles (public identity data)
CREATE POLICY "Anyone can read profiles"
  ON public.user_profiles FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow anyone to insert their own profile
CREATE POLICY "Anyone can insert their profile"
  ON public.user_profiles FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anyone to update their own profile (matched by wallet_address in app logic)
CREATE POLICY "Anyone can update their profile"
  ON public.user_profiles FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Create index for fast lookups
CREATE INDEX idx_user_profiles_wallet_address ON public.user_profiles (wallet_address);
