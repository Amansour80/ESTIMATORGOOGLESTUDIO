/*
  # Fix Recursive RLS Policy on project_members
  
  1. Problem
    - The SELECT policy on project_members checks project_members itself (recursive)
    - This can cause queries to fail or return empty results
  
  2. Solution
    - Replace recursive policy with direct checks
    - Allow users to see their own memberships
    - Allow organization members to see other members in same org
*/

-- Drop the recursive policy
DROP POLICY IF EXISTS "Users can view project members if they are members" ON project_members;

-- Create non-recursive policies
CREATE POLICY "Users can view their own project memberships"
  ON project_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Organization members can view project members"
  ON project_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = project_members.organization_id
      AND om.user_id = auth.uid()
    )
  );