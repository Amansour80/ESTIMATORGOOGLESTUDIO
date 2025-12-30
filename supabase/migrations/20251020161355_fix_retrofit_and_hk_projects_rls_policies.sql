/*
  # Fix Retrofit and HK Projects RLS Policies for Organization Access

  1. Issue
    - Current policies use nested EXISTS subquery that isn't working correctly
    - Users can only see their own projects, not organization members' projects

  2. Solution
    - Drop and recreate the SELECT policies with simpler, more explicit joins
    - Use IN clause with subquery for better query optimization

  3. Security
    - Maintains authentication requirement
    - Allows users to see:
      a) Their own projects (user_id = auth.uid())
      b) Projects from users in the same organization
*/

-- Fix Retrofit Projects
DROP POLICY IF EXISTS "Users can view organization retrofit projects" ON retrofit_projects;

CREATE POLICY "Users can view organization retrofit projects"
  ON retrofit_projects FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR 
    user_id IN (
      SELECT om2.user_id
      FROM organization_members om1
      JOIN organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
        AND om1.organization_id IS NOT NULL
        AND om2.organization_id IS NOT NULL
    )
  );

-- Fix UPDATE policy too
DROP POLICY IF EXISTS "Users can update organization retrofit projects" ON retrofit_projects;

CREATE POLICY "Users can update organization retrofit projects"
  ON retrofit_projects FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR 
    user_id IN (
      SELECT om2.user_id
      FROM organization_members om1
      JOIN organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
        AND om1.organization_id IS NOT NULL
        AND om2.organization_id IS NOT NULL
    )
  );

-- Fix DELETE policy too
DROP POLICY IF EXISTS "Users can delete organization retrofit projects" ON retrofit_projects;

CREATE POLICY "Users can delete organization retrofit projects"
  ON retrofit_projects FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR 
    user_id IN (
      SELECT om2.user_id
      FROM organization_members om1
      JOIN organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
        AND om1.organization_id IS NOT NULL
        AND om2.organization_id IS NOT NULL
    )
  );

-- Fix HK Projects
DROP POLICY IF EXISTS "Users can view organization HK projects" ON hk_projects;

CREATE POLICY "Users can view organization HK projects"
  ON hk_projects FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR 
    user_id IN (
      SELECT om2.user_id
      FROM organization_members om1
      JOIN organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
        AND om1.organization_id IS NOT NULL
        AND om2.organization_id IS NOT NULL
    )
  );

-- Fix UPDATE policy too
DROP POLICY IF EXISTS "Users can update organization HK projects" ON hk_projects;

CREATE POLICY "Users can update organization HK projects"
  ON hk_projects FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR 
    user_id IN (
      SELECT om2.user_id
      FROM organization_members om1
      JOIN organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
        AND om1.organization_id IS NOT NULL
        AND om2.organization_id IS NOT NULL
    )
  );

-- Fix DELETE policy too
DROP POLICY IF EXISTS "Users can delete organization HK projects" ON hk_projects;

CREATE POLICY "Users can delete organization HK projects"
  ON hk_projects FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR 
    user_id IN (
      SELECT om2.user_id
      FROM organization_members om1
      JOIN organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
        AND om1.organization_id IS NOT NULL
        AND om2.organization_id IS NOT NULL
    )
  );