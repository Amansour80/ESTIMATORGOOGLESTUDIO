/*
  # Add Approval Fields to Project Tables
  
  ## Overview
  This migration adds approval-related fields to existing project tables
  (fm_projects, retrofit_projects, hk_projects) to track approval status
  and lock projects during approval process.
  
  ## Changes
  
  ### Added Columns to All Project Tables
  - `approval_status` (approval_status enum) - Current approval status
  - `is_locked` (boolean) - Prevents editing during approval
  - `approved_at` (timestamptz) - When project was approved
  - `approved_by` (uuid) - User who approved (final approver)
  
  ## Security
  - No RLS changes needed (existing policies apply)
  - Locked projects cannot be edited by normal users
  
  ## Notes
  - approval_status defaults to 'draft'
  - is_locked defaults to false
  - Projects are locked when submitted for approval
  - Projects are unlocked when approved/rejected or revision requested
*/

-- Add approval fields to fm_projects
DO $$ BEGIN
  ALTER TABLE fm_projects 
  ADD COLUMN IF NOT EXISTS approval_status approval_status DEFAULT 'draft';
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE fm_projects 
  ADD COLUMN IF NOT EXISTS is_locked boolean DEFAULT false;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE fm_projects 
  ADD COLUMN IF NOT EXISTS approved_at timestamptz;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE fm_projects 
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES user_profiles(id);
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Add approval fields to retrofit_projects
DO $$ BEGIN
  ALTER TABLE retrofit_projects 
  ADD COLUMN IF NOT EXISTS approval_status approval_status DEFAULT 'draft';
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE retrofit_projects 
  ADD COLUMN IF NOT EXISTS is_locked boolean DEFAULT false;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE retrofit_projects 
  ADD COLUMN IF NOT EXISTS approved_at timestamptz;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE retrofit_projects 
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES user_profiles(id);
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Add approval fields to hk_projects
DO $$ BEGIN
  ALTER TABLE hk_projects 
  ADD COLUMN IF NOT EXISTS approval_status approval_status DEFAULT 'draft';
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE hk_projects 
  ADD COLUMN IF NOT EXISTS is_locked boolean DEFAULT false;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE hk_projects 
  ADD COLUMN IF NOT EXISTS approved_at timestamptz;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE hk_projects 
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES user_profiles(id);
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Create indexes for approval status queries
CREATE INDEX IF NOT EXISTS idx_fm_projects_approval_status 
  ON fm_projects(approval_status);
CREATE INDEX IF NOT EXISTS idx_fm_projects_locked 
  ON fm_projects(is_locked) WHERE is_locked = true;

CREATE INDEX IF NOT EXISTS idx_retrofit_projects_approval_status 
  ON retrofit_projects(approval_status);
CREATE INDEX IF NOT EXISTS idx_retrofit_projects_locked 
  ON retrofit_projects(is_locked) WHERE is_locked = true;

CREATE INDEX IF NOT EXISTS idx_hk_projects_approval_status 
  ON hk_projects(approval_status);
CREATE INDEX IF NOT EXISTS idx_hk_projects_locked 
  ON hk_projects(is_locked) WHERE is_locked = true;

-- Function to sync project approval status from project_approvals
CREATE OR REPLACE FUNCTION sync_project_approval_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the corresponding project table based on project type
  IF NEW.project_type = 'fm' THEN
    UPDATE fm_projects
    SET 
      approval_status = NEW.status,
      is_locked = CASE 
        WHEN NEW.status = 'pending' THEN true
        WHEN NEW.status IN ('approved', 'rejected', 'draft') THEN false
        ELSE is_locked
      END,
      approved_at = CASE WHEN NEW.status = 'approved' THEN NEW.completed_at ELSE approved_at END,
      approved_by = CASE WHEN NEW.status = 'approved' THEN NEW.submitted_by ELSE approved_by END
    WHERE id = NEW.project_id;
    
  ELSIF NEW.project_type = 'retrofit' THEN
    UPDATE retrofit_projects
    SET 
      approval_status = NEW.status,
      is_locked = CASE 
        WHEN NEW.status = 'pending' THEN true
        WHEN NEW.status IN ('approved', 'rejected', 'draft') THEN false
        ELSE is_locked
      END,
      approved_at = CASE WHEN NEW.status = 'approved' THEN NEW.completed_at ELSE approved_at END,
      approved_by = CASE WHEN NEW.status = 'approved' THEN NEW.submitted_by ELSE approved_by END
    WHERE id = NEW.project_id;
    
  ELSIF NEW.project_type = 'hk' THEN
    UPDATE hk_projects
    SET 
      approval_status = NEW.status,
      is_locked = CASE 
        WHEN NEW.status = 'pending' THEN true
        WHEN NEW.status IN ('approved', 'rejected', 'draft') THEN false
        ELSE is_locked
      END,
      approved_at = CASE WHEN NEW.status = 'approved' THEN NEW.completed_at ELSE approved_at END,
      approved_by = CASE WHEN NEW.status = 'approved' THEN NEW.submitted_by ELSE approved_by END
    WHERE id = NEW.project_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically sync approval status
DROP TRIGGER IF EXISTS sync_project_approval_status_trigger 
  ON project_approvals;
CREATE TRIGGER sync_project_approval_status_trigger
  AFTER INSERT OR UPDATE ON project_approvals
  FOR EACH ROW
  EXECUTE FUNCTION sync_project_approval_status();

-- Function to validate project edit permissions (check if locked)
CREATE OR REPLACE FUNCTION can_edit_project(
  p_project_id uuid,
  p_project_type project_type_enum,
  p_user_id uuid
)
RETURNS boolean AS $$
DECLARE
  is_project_locked boolean;
  user_is_admin boolean;
BEGIN
  -- Check if project is locked
  IF p_project_type = 'fm' THEN
    SELECT is_locked INTO is_project_locked
    FROM fm_projects
    WHERE id = p_project_id;
  ELSIF p_project_type = 'retrofit' THEN
    SELECT is_locked INTO is_project_locked
    FROM retrofit_projects
    WHERE id = p_project_id;
  ELSIF p_project_type = 'hk' THEN
    SELECT is_locked INTO is_project_locked
    FROM hk_projects
    WHERE id = p_project_id;
  END IF;
  
  -- If not locked, can edit
  IF NOT is_project_locked THEN
    RETURN true;
  END IF;
  
  -- Check if user is admin/owner (they can edit locked projects)
  SELECT EXISTS (
    SELECT 1 
    FROM organization_members om
    WHERE om.user_id = p_user_id
      AND om.role IN ('owner', 'admin')
  ) INTO user_is_admin;
  
  RETURN user_is_admin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get all projects pending approval for an organization
CREATE OR REPLACE FUNCTION get_projects_pending_approval(p_org_id uuid)
RETURNS TABLE (
  project_id uuid,
  project_type project_type_enum,
  project_name text,
  submitted_by_name text,
  submitted_at timestamptz,
  current_step text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pa.project_id,
    pa.project_type,
    CASE 
      WHEN pa.project_type = 'fm' THEN fm.project_name
      WHEN pa.project_type = 'retrofit' THEN rp.project_name
      WHEN pa.project_type = 'hk' THEN hk.project_name
    END as project_name,
    up.full_name,
    pa.submitted_at,
    pa.current_node_id
  FROM project_approvals pa
  INNER JOIN approval_workflows w ON pa.workflow_id = w.id
  LEFT JOIN fm_projects fm ON pa.project_id = fm.id AND pa.project_type = 'fm'
  LEFT JOIN retrofit_projects rp ON pa.project_id = rp.id AND pa.project_type = 'retrofit'
  LEFT JOIN hk_projects hk ON pa.project_id = hk.id AND pa.project_type = 'hk'
  INNER JOIN user_profiles up ON pa.submitted_by = up.id
  WHERE w.organization_id = p_org_id
    AND pa.status = 'pending'
  ORDER BY pa.submitted_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;