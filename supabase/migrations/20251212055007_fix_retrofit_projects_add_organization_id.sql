/*
  # Add organization_id to retrofit_projects
  
  1. Changes
    - Add organization_id column to retrofit_projects table
    - Populate existing records with organization from user
    - Add foreign key constraint
    - Add index for performance
    
  2. Security
    - Update RLS policies to use organization_id
*/

-- Add organization_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'retrofit_projects' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE retrofit_projects ADD COLUMN organization_id uuid;
  END IF;
END $$;

-- Populate organization_id from user's organization membership
UPDATE retrofit_projects rp
SET organization_id = om.organization_id
FROM organization_members om
WHERE rp.user_id = om.user_id
  AND rp.organization_id IS NULL;

-- Make organization_id required for new records
ALTER TABLE retrofit_projects ALTER COLUMN organization_id SET NOT NULL;

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'retrofit_projects_organization_id_fkey'
  ) THEN
    ALTER TABLE retrofit_projects
      ADD CONSTRAINT retrofit_projects_organization_id_fkey
      FOREIGN KEY (organization_id) REFERENCES organizations(id);
  END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_retrofit_projects_organization_id ON retrofit_projects(organization_id);

-- Update RLS policies to include organization check
DROP POLICY IF EXISTS "Users can view projects in their organization" ON retrofit_projects;
CREATE POLICY "Users can view projects in their organization"
  ON retrofit_projects FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update projects in their organization" ON retrofit_projects;
CREATE POLICY "Users can update projects in their organization"
  ON retrofit_projects FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete projects in their organization" ON retrofit_projects;
CREATE POLICY "Users can delete projects in their organization"
  ON retrofit_projects FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert projects in their organization" ON retrofit_projects;
CREATE POLICY "Users can insert projects in their organization"
  ON retrofit_projects FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );