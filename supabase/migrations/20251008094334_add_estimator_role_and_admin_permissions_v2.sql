/*
  # Add Estimator Role and Organization Admin Permissions
  
  1. Changes
    - Add 'estimator' role to organization_members
    - Update RLS policies to allow organization admins to manage members
    - Allow organization admins to update organization settings
    
  2. Roles Hierarchy
    - **owner**: Full access to everything
    - **admin**: Can manage users, update settings, manage labor library
    - **estimator**: Can create and edit estimates
    - **viewer**: Read-only access
    
  3. Security
    - Organization admins can add/remove users from their organization
    - Organization admins can update organization settings (currency, etc.)
    - Super admins can manage everything across all organizations
    - Regular users can only update their own membership status
*/

-- Drop the old role check constraint
ALTER TABLE organization_members DROP CONSTRAINT IF EXISTS organization_members_role_check;

-- Add new role check constraint with estimator
ALTER TABLE organization_members ADD CONSTRAINT organization_members_role_check 
  CHECK (role IN ('owner', 'admin', 'estimator', 'viewer'));

-- Drop and recreate UPDATE policy to allow organization admins to update memberships
DROP POLICY IF EXISTS "Users can update their own membership" ON organization_members;

CREATE POLICY "Users, org admins, and super admins can update memberships"
  ON organization_members
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
        AND om.organization_id = organization_members.organization_id
        AND om.role IN ('owner', 'admin')
        AND om.status = 'active'
    )
    OR
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE super_admins.user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
        AND om.organization_id = organization_members.organization_id
        AND om.role IN ('owner', 'admin')
        AND om.status = 'active'
    )
    OR
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE super_admins.user_id = auth.uid()
    )
  );

-- Update organizations policies to allow admins to update settings
DROP POLICY IF EXISTS "Owners and admins can update their organization" ON organizations;

CREATE POLICY "Owners, admins, and super admins can update organizations"
  ON organizations FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
    OR
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE super_admins.user_id = auth.uid()
    )
  )
  WITH CHECK (
    id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
    OR
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE super_admins.user_id = auth.uid()
    )
  );

-- Update organization_members SELECT policy to include viewing org members
DROP POLICY IF EXISTS "Users and super admins can view memberships" ON organization_members;

CREATE POLICY "Users can view org memberships"
  ON organization_members
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
        AND status = 'active'
    )
    OR
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE super_admins.user_id = auth.uid()
    )
  );

-- Allow organization admins to delete members from their organization
DROP POLICY IF EXISTS "Users and super admins can delete memberships" ON organization_members;

CREATE POLICY "Users, org admins, and super admins can delete memberships"
  ON organization_members
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
        AND om.organization_id = organization_members.organization_id
        AND om.role IN ('owner', 'admin')
        AND om.status = 'active'
    )
    OR
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE super_admins.user_id = auth.uid()
    )
  );
