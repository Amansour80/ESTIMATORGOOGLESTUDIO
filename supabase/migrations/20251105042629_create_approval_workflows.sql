/*
  # Create Approval Workflows System
  
  ## Overview
  This migration creates the approval_workflows table that stores workflow definitions
  for estimate approval processes. Each organization can create multiple workflows
  with different rules for when they apply.
  
  ## New Tables
  
  ### `approval_workflows`
  Stores workflow definitions and metadata.
  
  **Columns:**
  - `id` (uuid, primary key) - Unique workflow identifier
  - `organization_id` (uuid, foreign key) - Links to organizations table
  - `name` (text) - Workflow name (e.g., "High Value Projects")
  - `description` (text) - Detailed workflow description
  - `is_active` (boolean) - Whether workflow is currently active
  - `is_default` (boolean) - Default workflow when no rules match
  - `created_by` (uuid, foreign key) - User who created the workflow
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ## Security
  - Enable RLS on approval_workflows table
  - Organization members can view workflows
  - Only admins can create/update/delete workflows
  - Only one default workflow per organization
  
  ## Notes
  - Each organization can have multiple workflows
  - Workflows are evaluated by rules to determine which applies
  - If no rules match, the default workflow is used
*/

-- Create approval_workflows table
CREATE TABLE IF NOT EXISTS approval_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  created_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_workflow_name_per_org UNIQUE (organization_id, name),
  CONSTRAINT name_not_empty CHECK (length(trim(name)) > 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_approval_workflows_org_id 
  ON approval_workflows(organization_id);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_active 
  ON approval_workflows(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_approval_workflows_default 
  ON approval_workflows(organization_id, is_default) WHERE is_default = true;

-- Enable RLS
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Organization members can view workflows
CREATE POLICY "Organization members can view workflows"
  ON approval_workflows
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Admins can create workflows for their organization
CREATE POLICY "Admins can create workflows"
  ON approval_workflows
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
    )
  );

-- Admins can update workflows in their organization
CREATE POLICY "Admins can update workflows"
  ON approval_workflows
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
    )
  );

-- Admins can delete workflows in their organization
CREATE POLICY "Admins can delete workflows"
  ON approval_workflows
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
    )
  );

-- Super admins can do everything
CREATE POLICY "Super admins have full access to workflows"
  ON approval_workflows
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_approval_workflows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_approval_workflows_updated_at_trigger 
  ON approval_workflows;
CREATE TRIGGER update_approval_workflows_updated_at_trigger
  BEFORE UPDATE ON approval_workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_approval_workflows_updated_at();

-- Function to ensure only one default workflow per organization
CREATE OR REPLACE FUNCTION ensure_single_default_workflow()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this workflow as default, unset all others in the same org
  IF NEW.is_default = true THEN
    UPDATE approval_workflows
    SET is_default = false
    WHERE organization_id = NEW.organization_id
      AND id != NEW.id
      AND is_default = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to maintain single default workflow
DROP TRIGGER IF EXISTS ensure_single_default_workflow_trigger 
  ON approval_workflows;
CREATE TRIGGER ensure_single_default_workflow_trigger
  BEFORE INSERT OR UPDATE ON approval_workflows
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_workflow();

-- Helper function to get active workflows for an organization
CREATE OR REPLACE FUNCTION get_active_workflows(p_org_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  is_default boolean,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.name,
    w.description,
    w.is_default,
    w.created_at
  FROM approval_workflows w
  WHERE w.organization_id = p_org_id
    AND w.is_active = true
  ORDER BY w.is_default DESC, w.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get default workflow for an organization
CREATE OR REPLACE FUNCTION get_default_workflow(p_org_id uuid)
RETURNS uuid AS $$
DECLARE
  workflow_id uuid;
BEGIN
  SELECT id INTO workflow_id
  FROM approval_workflows
  WHERE organization_id = p_org_id
    AND is_active = true
    AND is_default = true
  LIMIT 1;
  
  RETURN workflow_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;