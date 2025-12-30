/*
  # Super Admin System

  1. New Tables
    - `super_admins`
      - `user_id` (uuid, primary key) - References auth.users
      - `created_at` (timestamptz) - Timestamp of when super admin was designated
    
    - `user_profiles`
      - `id` (uuid, primary key) - References auth.users
      - `complementary_account` (boolean) - Flag for accounts created by super admin
      - `created_by` (uuid) - References the user who created this account
      - `full_name` (text) - Optional display name
      - `created_at` (timestamptz) - Account creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on both tables
    - super_admins table: Completely locked down, only accessible via functions
    - user_profiles table: Users can read own profile, super admin can read all
    
  3. Functions
    - `is_super_admin(user_id uuid)` - Helper function to check super admin status
    - `get_current_user_id()` - Helper to get authenticated user's ID

  4. Data
    - Insert hardcoded super admin user ID: a0b7c679-30a0-415c-9047-ab55c4b92d0b
*/

-- Create super_admins table
CREATE TABLE IF NOT EXISTS super_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS (completely locked down)
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

-- No policies - table is inaccessible via normal queries
-- Only accessible through functions with SECURITY DEFINER

-- Insert the super admin (your user ID)
INSERT INTO super_admins (user_id)
VALUES ('a0b7c679-30a0-415c-9047-ab55c4b92d0b')
ON CONFLICT (user_id) DO NOTHING;

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  complementary_account boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Super admin can read all profiles (checked via function)
CREATE POLICY "Super admin can read all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins WHERE user_id = auth.uid()
    )
  );

-- Super admin can insert profiles (for complementary users)
CREATE POLICY "Super admin can insert profiles"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM super_admins WHERE user_id = auth.uid()
    )
  );

-- Super admin can update all profiles
CREATE POLICY "Super admin can update all profiles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM super_admins WHERE user_id = auth.uid()
    )
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Helper function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM super_admins WHERE user_id = check_user_id
  );
END;
$$;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();