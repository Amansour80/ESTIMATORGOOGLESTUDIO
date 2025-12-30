/*
  # Fix Pricing Config Update Policy

  1. Changes
    - Drop existing UPDATE policy on pricing_config
    - Create new UPDATE policy with both USING and WITH CHECK clauses
    - This ensures super admins can both read AND write pricing updates

  2. Security
    - Maintains super admin-only access for updates
    - Fixes the issue where updates were not being saved
*/

-- Drop the existing UPDATE policy
DROP POLICY IF EXISTS "Super admins can update pricing" ON pricing_config;

-- Create new UPDATE policy with both USING and WITH CHECK
CREATE POLICY "Super admins can update pricing"
  ON pricing_config FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE user_id = auth.uid()
    )
  );
