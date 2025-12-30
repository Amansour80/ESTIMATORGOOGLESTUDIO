/*
  # Update Project Policies for Organization-Wide Access

  1. Changes
    - Drop existing restrictive policies on fm_projects, retrofit_projects, hk_projects
    - Create new policies that allow organization members to view/edit/delete each other's projects
    - Users in same organization can see all projects from that organization
    - Users without organization can only see their own projects

  2. Security
    - Maintains authentication requirement
    - Organization-based access control via organization_members table
    - Users can only access projects from their own organization or their own projects
*/

-- FM Projects Policies
DROP POLICY IF EXISTS "Users can view own projects" ON fm_projects;
DROP POLICY IF EXISTS "Users can create own projects" ON fm_projects;
DROP POLICY IF EXISTS "Users can update own projects" ON fm_projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON fm_projects;

CREATE POLICY "Users can view organization projects"
  ON fm_projects FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM organization_members om1
      INNER JOIN organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
      AND om2.user_id = fm_projects.user_id
      AND om1.organization_id IS NOT NULL
    )
  );

CREATE POLICY "Users can create projects"
  ON fm_projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update organization projects"
  ON fm_projects FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM organization_members om1
      INNER JOIN organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
      AND om2.user_id = fm_projects.user_id
      AND om1.organization_id IS NOT NULL
    )
  );

CREATE POLICY "Users can delete organization projects"
  ON fm_projects FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM organization_members om1
      INNER JOIN organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
      AND om2.user_id = fm_projects.user_id
      AND om1.organization_id IS NOT NULL
    )
  );

-- Retrofit Projects Policies
DROP POLICY IF EXISTS "Users can read own retrofit projects" ON retrofit_projects;
DROP POLICY IF EXISTS "Users can insert own retrofit projects" ON retrofit_projects;
DROP POLICY IF EXISTS "Users can update own retrofit projects" ON retrofit_projects;
DROP POLICY IF EXISTS "Users can delete own retrofit projects" ON retrofit_projects;

CREATE POLICY "Users can view organization retrofit projects"
  ON retrofit_projects FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM organization_members om1
      INNER JOIN organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
      AND om2.user_id = retrofit_projects.user_id
      AND om1.organization_id IS NOT NULL
    )
  );

CREATE POLICY "Users can create retrofit projects"
  ON retrofit_projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update organization retrofit projects"
  ON retrofit_projects FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM organization_members om1
      INNER JOIN organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
      AND om2.user_id = retrofit_projects.user_id
      AND om1.organization_id IS NOT NULL
    )
  );

CREATE POLICY "Users can delete organization retrofit projects"
  ON retrofit_projects FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM organization_members om1
      INNER JOIN organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
      AND om2.user_id = retrofit_projects.user_id
      AND om1.organization_id IS NOT NULL
    )
  );

-- HK Projects Policies
DROP POLICY IF EXISTS "Users can view own HK projects" ON hk_projects;
DROP POLICY IF EXISTS "Users can insert own HK projects" ON hk_projects;
DROP POLICY IF EXISTS "Users can update own HK projects" ON hk_projects;
DROP POLICY IF EXISTS "Users can delete own HK projects" ON hk_projects;

CREATE POLICY "Users can view organization HK projects"
  ON hk_projects FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM organization_members om1
      INNER JOIN organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
      AND om2.user_id = hk_projects.user_id
      AND om1.organization_id IS NOT NULL
    )
  );

CREATE POLICY "Users can create HK projects"
  ON hk_projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update organization HK projects"
  ON hk_projects FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM organization_members om1
      INNER JOIN organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
      AND om2.user_id = hk_projects.user_id
      AND om1.organization_id IS NOT NULL
    )
  );

CREATE POLICY "Users can delete organization HK projects"
  ON hk_projects FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM organization_members om1
      INNER JOIN organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
      AND om2.user_id = hk_projects.user_id
      AND om1.organization_id IS NOT NULL
    )
  );
