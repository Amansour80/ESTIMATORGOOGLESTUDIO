/*
  # Fix Super Admins RLS Policies

  1. Problem
    - The super_admins table has RLS enabled but NO policies
    - This prevents authenticated users from checking if they are super admins
    - This breaks the pricing_config UPDATE policy which relies on super_admins check

  2. Solution
    - Add SELECT policy allowing authenticated users to check super_admins table
    - This is safe because it only returns rows where the user matches their own ID

  3. Security
    - Users can only see if THEY are a super admin
    - Cannot see other users' super admin status
*/

-- Allow authenticated users to check if they are super admins
CREATE POLICY "Users can check own super admin status"
  ON super_admins FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
