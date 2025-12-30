/*
  # Optimize RLS Policies - Part 5: Labor Libraries

  1. Performance Improvements
    - Wrap auth.uid() calls with SELECT to cache the result
    - Prevents re-evaluation for each row

  2. Tables Affected
    - org_fm_technicians
    - org_retrofit_labor
    - org_cleaners
*/

-- Drop and recreate org_fm_technicians policies
DROP POLICY IF EXISTS "Organization members can view FM technicians" ON org_fm_technicians;
CREATE POLICY "Organization members can view FM technicians"
  ON org_fm_technicians FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Organization admins can insert FM technicians" ON org_fm_technicians;
CREATE POLICY "Organization admins can insert FM technicians"
  ON org_fm_technicians FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = (SELECT auth.uid()) 
      AND role IN ('admin', 'owner')
    )
  );

DROP POLICY IF EXISTS "Organization admins can update FM technicians" ON org_fm_technicians;
CREATE POLICY "Organization admins can update FM technicians"
  ON org_fm_technicians FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = (SELECT auth.uid()) 
      AND role IN ('admin', 'owner')
    )
  );

DROP POLICY IF EXISTS "Organization admins can delete FM technicians" ON org_fm_technicians;
CREATE POLICY "Organization admins can delete FM technicians"
  ON org_fm_technicians FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = (SELECT auth.uid()) 
      AND role IN ('admin', 'owner')
    )
  );

-- Drop and recreate org_retrofit_labor policies
DROP POLICY IF EXISTS "Organization members can view Retrofit labor" ON org_retrofit_labor;
CREATE POLICY "Organization members can view Retrofit labor"
  ON org_retrofit_labor FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Organization admins can insert Retrofit labor" ON org_retrofit_labor;
CREATE POLICY "Organization admins can insert Retrofit labor"
  ON org_retrofit_labor FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = (SELECT auth.uid()) 
      AND role IN ('admin', 'owner')
    )
  );

DROP POLICY IF EXISTS "Organization admins can update Retrofit labor" ON org_retrofit_labor;
CREATE POLICY "Organization admins can update Retrofit labor"
  ON org_retrofit_labor FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = (SELECT auth.uid()) 
      AND role IN ('admin', 'owner')
    )
  );

DROP POLICY IF EXISTS "Organization admins can delete Retrofit labor" ON org_retrofit_labor;
CREATE POLICY "Organization admins can delete Retrofit labor"
  ON org_retrofit_labor FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = (SELECT auth.uid()) 
      AND role IN ('admin', 'owner')
    )
  );

-- Drop and recreate org_cleaners policies
DROP POLICY IF EXISTS "Organization members can view cleaners" ON org_cleaners;
CREATE POLICY "Organization members can view cleaners"
  ON org_cleaners FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Organization admins can insert cleaners" ON org_cleaners;
CREATE POLICY "Organization admins can insert cleaners"
  ON org_cleaners FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = (SELECT auth.uid()) 
      AND role IN ('admin', 'owner')
    )
  );

DROP POLICY IF EXISTS "Organization admins can update cleaners" ON org_cleaners;
CREATE POLICY "Organization admins can update cleaners"
  ON org_cleaners FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = (SELECT auth.uid()) 
      AND role IN ('admin', 'owner')
    )
  );

DROP POLICY IF EXISTS "Organization admins can delete cleaners" ON org_cleaners;
CREATE POLICY "Organization admins can delete cleaners"
  ON org_cleaners FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = (SELECT auth.uid()) 
      AND role IN ('admin', 'owner')
    )
  );
