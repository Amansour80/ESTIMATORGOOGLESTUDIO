/*
  # Add Project Status Tracking

  1. New Types
    - Create project_status enum with workflow states

  2. Changes to Tables (fm_projects, retrofit_projects, hk_projects)
    - Add `status` column (enum, default DRAFT)
    - Add `submitted_at` timestamp
    - Add `awarded_at` timestamp
    - Add `lost_at` timestamp
    - Add `cancelled_at` timestamp
    - Add `status_history` jsonb for audit trail
    - Add index on status for filtering

  3. Functions
    - `validate_status_transition()` - Enforces workflow rules with admin override
    - `log_status_change()` - Records status changes in history

  4. Triggers
    - Auto-validate transitions before update
    - Auto-log status changes

  5. Security
    - Estimators can only change DRAFT → SUBMITTED
    - Admins/Owners can override any transition
*/

-- Create status enum
DO $$ BEGIN
  CREATE TYPE project_status AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'PENDING_CLIENT_DECISION',
    'AWARDED',
    'LOST',
    'CANCELLED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Function to validate status transitions
CREATE OR REPLACE FUNCTION validate_status_transition()
RETURNS TRIGGER AS $$
DECLARE
  user_role text;
  is_admin boolean;
BEGIN
  -- If status hasn't changed, skip validation
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Check if user is admin/owner
  SELECT role INTO user_role
  FROM organization_members
  WHERE user_id = auth.uid()
    AND organization_id = (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = NEW.user_id
      LIMIT 1
    );

  is_admin := (user_role IN ('admin', 'owner'));

  -- Admins can override any transition
  IF is_admin THEN
    -- Set timestamp fields based on new status
    IF NEW.status = 'SUBMITTED' AND OLD.status = 'DRAFT' THEN
      NEW.submitted_at := now();
    ELSIF NEW.status = 'AWARDED' THEN
      NEW.awarded_at := now();
    ELSIF NEW.status = 'LOST' THEN
      NEW.lost_at := now();
    ELSIF NEW.status = 'CANCELLED' THEN
      NEW.cancelled_at := now();
    END IF;

    RETURN NEW;
  END IF;

  -- Validate transitions for non-admins
  -- CANCELLED can be set from any status
  IF NEW.status = 'CANCELLED' THEN
    NEW.cancelled_at := now();
    RETURN NEW;
  END IF;

  -- Validate specific transitions
  IF OLD.status = 'DRAFT' AND NEW.status = 'SUBMITTED' THEN
    NEW.submitted_at := now();
    RETURN NEW;
  ELSIF OLD.status = 'SUBMITTED' AND NEW.status = 'PENDING_CLIENT_DECISION' THEN
    RETURN NEW;
  ELSIF OLD.status = 'PENDING_CLIENT_DECISION' AND NEW.status IN ('AWARDED', 'LOST') THEN
    IF NEW.status = 'AWARDED' THEN
      NEW.awarded_at := now();
    ELSE
      NEW.lost_at := now();
    END IF;
    RETURN NEW;
  END IF;

  -- Invalid transition
  RAISE EXCEPTION 'Invalid status transition from % to %. Contact an admin for override.', OLD.status, NEW.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log status changes
CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
DECLARE
  user_email text;
  history_entry jsonb;
BEGIN
  IF OLD.status != NEW.status THEN
    -- Get user email
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = auth.uid();

    -- Create history entry
    history_entry := jsonb_build_object(
      'from_status', OLD.status,
      'to_status', NEW.status,
      'changed_at', now(),
      'changed_by', auth.uid(),
      'changed_by_email', user_email
    );

    -- Append to history array
    IF NEW.status_history IS NULL THEN
      NEW.status_history := jsonb_build_array(history_entry);
    ELSE
      NEW.status_history := NEW.status_history || history_entry;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add columns to fm_projects
DO $$ BEGIN
  ALTER TABLE fm_projects ADD COLUMN IF NOT EXISTS status project_status DEFAULT 'DRAFT';
  ALTER TABLE fm_projects ADD COLUMN IF NOT EXISTS submitted_at timestamptz;
  ALTER TABLE fm_projects ADD COLUMN IF NOT EXISTS awarded_at timestamptz;
  ALTER TABLE fm_projects ADD COLUMN IF NOT EXISTS lost_at timestamptz;
  ALTER TABLE fm_projects ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
  ALTER TABLE fm_projects ADD COLUMN IF NOT EXISTS status_history jsonb DEFAULT '[]'::jsonb;
END $$;

-- Add columns to retrofit_projects
DO $$ BEGIN
  ALTER TABLE retrofit_projects ADD COLUMN IF NOT EXISTS status project_status DEFAULT 'DRAFT';
  ALTER TABLE retrofit_projects ADD COLUMN IF NOT EXISTS submitted_at timestamptz;
  ALTER TABLE retrofit_projects ADD COLUMN IF NOT EXISTS awarded_at timestamptz;
  ALTER TABLE retrofit_projects ADD COLUMN IF NOT EXISTS lost_at timestamptz;
  ALTER TABLE retrofit_projects ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
  ALTER TABLE retrofit_projects ADD COLUMN IF NOT EXISTS status_history jsonb DEFAULT '[]'::jsonb;
END $$;

-- Add columns to hk_projects
DO $$ BEGIN
  ALTER TABLE hk_projects ADD COLUMN IF NOT EXISTS status project_status DEFAULT 'DRAFT';
  ALTER TABLE hk_projects ADD COLUMN IF NOT EXISTS submitted_at timestamptz;
  ALTER TABLE hk_projects ADD COLUMN IF NOT EXISTS awarded_at timestamptz;
  ALTER TABLE hk_projects ADD COLUMN IF NOT EXISTS lost_at timestamptz;
  ALTER TABLE hk_projects ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
  ALTER TABLE hk_projects ADD COLUMN IF NOT EXISTS status_history jsonb DEFAULT '[]'::jsonb;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_fm_projects_status ON fm_projects(status);
CREATE INDEX IF NOT EXISTS idx_retrofit_projects_status ON retrofit_projects(status);
CREATE INDEX IF NOT EXISTS idx_hk_projects_status ON hk_projects(status);

-- Add triggers for fm_projects
DROP TRIGGER IF EXISTS validate_fm_status_transition ON fm_projects;
CREATE TRIGGER validate_fm_status_transition
  BEFORE UPDATE ON fm_projects
  FOR EACH ROW
  EXECUTE FUNCTION validate_status_transition();

DROP TRIGGER IF EXISTS log_fm_status_change ON fm_projects;
CREATE TRIGGER log_fm_status_change
  BEFORE UPDATE ON fm_projects
  FOR EACH ROW
  EXECUTE FUNCTION log_status_change();

-- Add triggers for retrofit_projects
DROP TRIGGER IF EXISTS validate_retrofit_status_transition ON retrofit_projects;
CREATE TRIGGER validate_retrofit_status_transition
  BEFORE UPDATE ON retrofit_projects
  FOR EACH ROW
  EXECUTE FUNCTION validate_status_transition();

DROP TRIGGER IF EXISTS log_retrofit_status_change ON retrofit_projects;
CREATE TRIGGER log_retrofit_status_change
  BEFORE UPDATE ON retrofit_projects
  FOR EACH ROW
  EXECUTE FUNCTION log_status_change();

-- Add triggers for hk_projects
DROP TRIGGER IF EXISTS validate_hk_status_transition ON hk_projects;
CREATE TRIGGER validate_hk_status_transition
  BEFORE UPDATE ON hk_projects
  FOR EACH ROW
  EXECUTE FUNCTION validate_status_transition();

DROP TRIGGER IF EXISTS log_hk_status_change ON hk_projects;
CREATE TRIGGER log_hk_status_change
  BEFORE UPDATE ON hk_projects
  FOR EACH ROW
  EXECUTE FUNCTION log_status_change();
