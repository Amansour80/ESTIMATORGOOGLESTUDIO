/*
  # Add super admin update policy for subscriptions

  1. Policy
    - Allow super admins to update any subscription
    - Permits full subscription management by super admins

  2. Security
    - Only users in super_admins table can update
*/

-- Add policy for super admins to update subscriptions
CREATE POLICY "Super admins can update any subscription"
  ON subscriptions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE super_admins.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE super_admins.user_id = auth.uid()
    )
  );
