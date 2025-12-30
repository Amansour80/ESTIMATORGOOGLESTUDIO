/*
  # Create Organization Roles System
  
  ## Overview
  This migration creates a flexible roles system allowing organizations to define custom roles
  beyond the default system roles (admin, estimator, viewer) for approval workflows.
  
  ## New Tables
  
  ### `organization_roles`
  Stores both system-defined and custom organization roles.
  
  **Columns:**
  - `id` (uuid, primary key) - Unique role identifier
  - `organization_id` (uuid, foreign key) - Links to organizations table
  - `role_name` (text) - Display name (e.g., "Cost Controller", "CFO")
  - `role_type` (text) - Either 'system' or 'custom'
  - `description` (text) - Role description
  - `color` (text) - Hex color for UI badges (#3B82F6)
  - `permissions` (jsonb) - Permission flags {can_view, can_edit, can_approve, etc.}
  - `is_active` (boolean) - Whether role is currently active
  - `created_by` (uuid) - User who created this role
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ## Security
  - Enable RLS on organization_roles table
  - Organization members can view their organization's roles
  - Only admins can create/update/delete custom roles
  - System roles cannot be deleted
  
  ## Notes
  - System roles are automatically created for each organization
  - Custom roles are organization-specific
  - Color field helps with visual identification in UI
*/

-- Create enum for role types
DO $$ BEGIN
  CREATE TYPE role_type AS ENUM ('system', 'custom');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create organization_roles table
CREATE TABLE IF NOT EXISTS organization_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role_name text NOT NULL,
  role_type role_type NOT NULL DEFAULT 'custom',
  description text,
  color text DEFAULT '#3B82F6',
  permissions jsonb DEFAULT '{
    "can_view": true,
    "can_edit": false,
    "can_approve": false,
    "can_manage_workflows": false,
    "can_manage_roles": false
  }'::jsonb,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_role_per_org UNIQUE (organization_id, role_name),
  CONSTRAINT valid_color CHECK (color ~* '^#[0-9A-F]{6}$')
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organization_roles_org_id 
  ON organization_roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_roles_type 
  ON organization_roles(role_type);
CREATE INDEX IF NOT EXISTS idx_organization_roles_active 
  ON organization_roles(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE organization_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Organization members can view their organization's roles
CREATE POLICY "Users can view their organization roles"
  ON organization_roles
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Admins can insert custom roles for their organization
CREATE POLICY "Admins can create custom roles"
  ON organization_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    role_type = 'custom'
    AND organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
    )
  );

-- Admins can update custom roles in their organization
CREATE POLICY "Admins can update custom roles"
  ON organization_roles
  FOR UPDATE
  TO authenticated
  USING (
    role_type = 'custom'
    AND organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    role_type = 'custom'
    AND organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
    )
  );

-- Admins can delete custom roles in their organization
CREATE POLICY "Admins can delete custom roles"
  ON organization_roles
  FOR DELETE
  TO authenticated
  USING (
    role_type = 'custom'
    AND organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
    )
  );

-- Super admins can do everything
CREATE POLICY "Super admins have full access to organization roles"
  ON organization_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_organization_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_organization_roles_updated_at_trigger 
  ON organization_roles;
CREATE TRIGGER update_organization_roles_updated_at_trigger
  BEFORE UPDATE ON organization_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_organization_roles_updated_at();

-- Function to seed default system roles for an organization
CREATE OR REPLACE FUNCTION seed_default_roles(org_id uuid)
RETURNS void AS $$
BEGIN
  -- Insert default system roles if they don't exist
  INSERT INTO organization_roles (
    organization_id, 
    role_name, 
    role_type, 
    description, 
    color, 
    permissions
  )
  VALUES
    (
      org_id,
      'Admin',
      'system',
      'Full access to all features and settings',
      '#EF4444',
      '{"can_view": true, "can_edit": true, "can_approve": true, "can_manage_workflows": true, "can_manage_roles": true}'::jsonb
    ),
    (
      org_id,
      'Estimator',
      'system',
      'Can create and edit estimates',
      '#3B82F6',
      '{"can_view": true, "can_edit": true, "can_approve": false, "can_manage_workflows": false, "can_manage_roles": false}'::jsonb
    ),
    (
      org_id,
      'Viewer',
      'system',
      'Can view estimates but not edit',
      '#6B7280',
      '{"can_view": true, "can_edit": false, "can_approve": false, "can_manage_workflows": false, "can_manage_roles": false}'::jsonb
    )
  ON CONFLICT (organization_id, role_name) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed default roles for all existing organizations
DO $$
DECLARE
  org_record RECORD;
BEGIN
  FOR org_record IN SELECT id FROM organizations LOOP
    PERFORM seed_default_roles(org_record.id);
  END LOOP;
END $$;

-- Trigger to automatically create default roles for new organizations
CREATE OR REPLACE FUNCTION create_default_roles_for_new_org()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM seed_default_roles(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS create_default_roles_on_org_creation ON organizations;
CREATE TRIGGER create_default_roles_on_org_creation
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION create_default_roles_for_new_org();