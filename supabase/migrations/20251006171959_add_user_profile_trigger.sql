/*
  # Add automatic user profile creation

  1. Changes
    - Create trigger function to automatically create user_profiles when auth.users is created
    - Create trigger on auth.users table
    - Backfill profiles for existing users
  
  2. Purpose
    - Ensures every user automatically gets a profile entry
    - Prevents "database error" when users sign up or are created
    - Maintains data integrity between auth.users and user_profiles
*/

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, complementary_account, created_by)
  VALUES (
    NEW.id,
    false,
    NULL
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Backfill profiles for existing users
INSERT INTO public.user_profiles (id, complementary_account, created_by)
SELECT 
  id,
  false,
  NULL
FROM auth.users
ON CONFLICT (id) DO NOTHING;