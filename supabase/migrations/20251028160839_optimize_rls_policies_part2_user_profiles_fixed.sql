/*
  # Optimize RLS Policies - Part 2: User Profiles & Super Admins

  1. Performance Improvements
    - Wrap auth.uid() calls with SELECT to cache the result
    - Prevents re-evaluation for each row

  2. Tables Affected
    - user_profiles
    - super_admins
*/

-- Drop and recreate user_profiles policies
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Super admin can read all profiles" ON user_profiles;
CREATE POLICY "Super admin can read all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Super admin can update all profiles" ON user_profiles;
CREATE POLICY "Super admin can update all profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Super admin can insert profiles" ON user_profiles;
CREATE POLICY "Super admin can insert profiles"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- Drop and recreate super_admins policies
DROP POLICY IF EXISTS "Users can check own super admin status" ON super_admins;
CREATE POLICY "Users can check own super admin status"
  ON super_admins FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));
