/*
  # Create Organization Labor Libraries

  1. New Tables
    - `org_fm_technicians`
      - Organization-wide FM technician types (salary, benefits, etc.)
    - `org_retrofit_labor`
      - Organization-wide Retrofit labor types (salary, benefits, etc.)
    - `org_cleaners`
      - Organization-wide cleaner types (salary, benefits, etc.)

  2. Security
    - Enable RLS on all new tables
    - Organization members can read their org's labor libraries
    - Organization admins can manage their org's labor libraries
*/

-- Create org_fm_technicians table
CREATE TABLE IF NOT EXISTS org_fm_technicians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  monthly_salary numeric NOT NULL DEFAULT 0,
  monthly_benefits numeric NOT NULL DEFAULT 0,
  expected_overtime_hours_per_month numeric NOT NULL DEFAULT 0,
  deployment_model text NOT NULL DEFAULT 'resident',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE org_fm_technicians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members can view FM technicians"
  ON org_fm_technicians FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = org_fm_technicians.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can insert FM technicians"
  ON org_fm_technicians FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = org_fm_technicians.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Organization admins can update FM technicians"
  ON org_fm_technicians FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = org_fm_technicians.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = org_fm_technicians.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Organization admins can delete FM technicians"
  ON org_fm_technicians FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = org_fm_technicians.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- Create org_retrofit_labor table
CREATE TABLE IF NOT EXISTS org_retrofit_labor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL,
  monthly_salary numeric NOT NULL DEFAULT 0,
  monthly_benefits numeric NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE org_retrofit_labor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members can view Retrofit labor"
  ON org_retrofit_labor FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = org_retrofit_labor.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can insert Retrofit labor"
  ON org_retrofit_labor FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = org_retrofit_labor.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Organization admins can update Retrofit labor"
  ON org_retrofit_labor FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = org_retrofit_labor.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = org_retrofit_labor.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Organization admins can delete Retrofit labor"
  ON org_retrofit_labor FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = org_retrofit_labor.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- Create org_cleaners table
CREATE TABLE IF NOT EXISTS org_cleaners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  monthly_salary numeric NOT NULL DEFAULT 0,
  monthly_benefits numeric NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE org_cleaners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members can view cleaners"
  ON org_cleaners FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = org_cleaners.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can insert cleaners"
  ON org_cleaners FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = org_cleaners.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Organization admins can update cleaners"
  ON org_cleaners FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = org_cleaners.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = org_cleaners.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Organization admins can delete cleaners"
  ON org_cleaners FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = org_cleaners.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );
