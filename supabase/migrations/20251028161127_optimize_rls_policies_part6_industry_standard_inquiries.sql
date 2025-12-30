/*
  # Optimize RLS Policies - Part 6: Industry Standard Library & Inquiries

  1. Performance Improvements
    - Wrap auth.uid() calls with SELECT to cache the result
    - Prevents re-evaluation for each row

  2. Tables Affected
    - industry_standard_asset_library
    - industry_standard_ppm_tasks
    - inquiries
*/

-- Drop and recreate industry_standard_asset_library policies
DROP POLICY IF EXISTS "Super admins can insert SFG20 assets" ON industry_standard_asset_library;
CREATE POLICY "Super admins can insert SFG20 assets"
  ON industry_standard_asset_library FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Super admins can update SFG20 assets" ON industry_standard_asset_library;
CREATE POLICY "Super admins can update SFG20 assets"
  ON industry_standard_asset_library FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Super admins can delete SFG20 assets" ON industry_standard_asset_library;
CREATE POLICY "Super admins can delete SFG20 assets"
  ON industry_standard_asset_library FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- Drop and recreate industry_standard_ppm_tasks policies
DROP POLICY IF EXISTS "Super admins can insert SFG20 tasks" ON industry_standard_ppm_tasks;
CREATE POLICY "Super admins can insert SFG20 tasks"
  ON industry_standard_ppm_tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Super admins can update SFG20 tasks" ON industry_standard_ppm_tasks;
CREATE POLICY "Super admins can update SFG20 tasks"
  ON industry_standard_ppm_tasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Super admins can delete SFG20 tasks" ON industry_standard_ppm_tasks;
CREATE POLICY "Super admins can delete SFG20 tasks"
  ON industry_standard_ppm_tasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- Drop and recreate inquiries policies
DROP POLICY IF EXISTS "Organization members can view inquiries" ON inquiries;
CREATE POLICY "Organization members can view inquiries"
  ON inquiries FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Organization members can create inquiries" ON inquiries;
CREATE POLICY "Organization members can create inquiries"
  ON inquiries FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins and estimators can update inquiries" ON inquiries;
CREATE POLICY "Admins and estimators can update inquiries"
  ON inquiries FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = (SELECT auth.uid()) 
      AND role IN ('admin', 'owner', 'estimator')
    )
  );

DROP POLICY IF EXISTS "Admins can delete inquiries" ON inquiries;
CREATE POLICY "Admins can delete inquiries"
  ON inquiries FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = (SELECT auth.uid()) 
      AND role IN ('admin', 'owner')
    )
  );

DROP POLICY IF EXISTS "Super admins have full access to inquiries" ON inquiries;
CREATE POLICY "Super admins have full access to inquiries"
  ON inquiries FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE user_id = (SELECT auth.uid())
    )
  );
