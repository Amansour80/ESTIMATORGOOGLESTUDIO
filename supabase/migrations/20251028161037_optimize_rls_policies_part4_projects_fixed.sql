/*
  # Optimize RLS Policies - Part 4: Project Tables

  1. Performance Improvements
    - Wrap auth.uid() calls with SELECT to cache the result
    - Prevents re-evaluation for each row

  2. Tables Affected
    - hk_projects
    - fm_projects
    - retrofit_projects
*/

-- Drop and recreate hk_projects policies
DROP POLICY IF EXISTS "Users can create HK projects" ON hk_projects;
CREATE POLICY "Users can create HK projects"
  ON hk_projects FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS "Users can view organization HK projects" ON hk_projects;
CREATE POLICY "Users can view organization HK projects"
  ON hk_projects FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id 
    OR user_id IN (
      SELECT get_organization_user_ids((SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users can update organization HK projects" ON hk_projects;
CREATE POLICY "Users can update organization HK projects"
  ON hk_projects FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id 
    OR user_id IN (
      SELECT get_organization_user_ids((SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users can delete organization HK projects" ON hk_projects;
CREATE POLICY "Users can delete organization HK projects"
  ON hk_projects FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id 
    OR user_id IN (
      SELECT get_organization_user_ids((SELECT auth.uid()))
    )
  );

-- Drop and recreate fm_projects policies
DROP POLICY IF EXISTS "Users can create projects" ON fm_projects;
CREATE POLICY "Users can create projects"
  ON fm_projects FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS "Users can view organization projects" ON fm_projects;
CREATE POLICY "Users can view organization projects"
  ON fm_projects FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id 
    OR user_id IN (
      SELECT get_organization_user_ids((SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users can update organization projects" ON fm_projects;
CREATE POLICY "Users can update organization projects"
  ON fm_projects FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id 
    OR user_id IN (
      SELECT get_organization_user_ids((SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users can delete organization projects" ON fm_projects;
CREATE POLICY "Users can delete organization projects"
  ON fm_projects FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id 
    OR user_id IN (
      SELECT get_organization_user_ids((SELECT auth.uid()))
    )
  );

-- Drop and recreate retrofit_projects policies
DROP POLICY IF EXISTS "Users can create retrofit projects" ON retrofit_projects;
CREATE POLICY "Users can create retrofit projects"
  ON retrofit_projects FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS "Users can view organization retrofit projects" ON retrofit_projects;
CREATE POLICY "Users can view organization retrofit projects"
  ON retrofit_projects FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id 
    OR user_id IN (
      SELECT get_organization_user_ids((SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users can update organization retrofit projects" ON retrofit_projects;
CREATE POLICY "Users can update organization retrofit projects"
  ON retrofit_projects FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id 
    OR user_id IN (
      SELECT get_organization_user_ids((SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users can delete organization retrofit projects" ON retrofit_projects;
CREATE POLICY "Users can delete organization retrofit projects"
  ON retrofit_projects FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id 
    OR user_id IN (
      SELECT get_organization_user_ids((SELECT auth.uid()))
    )
  );
