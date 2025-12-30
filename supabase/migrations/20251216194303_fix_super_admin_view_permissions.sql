/*
  # Fix Super Admin View Permissions

  Allow super admins to view all organizations and subscriptions in the system.

  ## Changes
  - Update organizations SELECT policy to include super admin check
  - Update subscriptions SELECT policy to include super admin check
*/

-- Fix organizations SELECT policy
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM super_admins 
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- Fix subscriptions SELECT policy
DROP POLICY IF EXISTS "Users can view their organization subscription" ON subscriptions;
CREATE POLICY "Users can view their organization subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM super_admins 
      WHERE user_id = (SELECT auth.uid())
    )
  );
