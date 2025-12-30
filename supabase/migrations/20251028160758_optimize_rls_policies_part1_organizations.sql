/*
  # Optimize RLS Policies - Part 1: Organizations & Subscriptions

  1. Performance Improvements
    - Wrap auth.uid() calls with SELECT to cache the result
    - Prevents re-evaluation for each row
    - Significantly improves query performance at scale

  2. Tables Affected
    - organizations
    - subscriptions
    - organization_members
*/

-- Drop and recreate organizations policies
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
  );

DROP POLICY IF EXISTS "Owners, admins, and super admins can update organizations" ON organizations;
CREATE POLICY "Owners, admins, and super admins can update organizations"
  ON organizations FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) IN (
      SELECT user_id 
      FROM organization_members 
      WHERE organization_id = organizations.id 
      AND role IN ('owner', 'admin')
    )
    OR EXISTS (
      SELECT 1 FROM super_admins 
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- Drop and recreate subscriptions policies
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
  );

DROP POLICY IF EXISTS "Only owners can update subscription" ON subscriptions;
CREATE POLICY "Only owners can update subscription"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = (SELECT auth.uid()) 
      AND role = 'owner'
    )
  );

DROP POLICY IF EXISTS "Super admins can update any subscription" ON subscriptions;
CREATE POLICY "Super admins can update any subscription"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- Drop and recreate organization_members policies
DROP POLICY IF EXISTS "Users can view own memberships and super admins see all" ON organization_members;
CREATE POLICY "Users can view own memberships and super admins see all"
  ON organization_members FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM super_admins 
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update own membership and super admins update any" ON organization_members;
CREATE POLICY "Users can update own membership and super admins update any"
  ON organization_members FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM super_admins 
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete own membership and super admins delete any" ON organization_members;
CREATE POLICY "Users can delete own membership and super admins delete any"
  ON organization_members FOR DELETE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM super_admins 
      WHERE user_id = (SELECT auth.uid())
    )
  );
