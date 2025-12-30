/*
  # Extend retrofit_projects for Project Management
  
  1. Changes
    - Add PM status tracking fields to retrofit_projects
    - Add baseline locking fields
    - Add computed progress and forecast fields
    
  2. Notes
    - All columns are nullable to preserve existing data
    - No breaking changes to existing estimator functionality
*/

-- Add PM metadata columns to retrofit_projects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'retrofit_projects' AND column_name = 'pm_status'
  ) THEN
    ALTER TABLE retrofit_projects ADD COLUMN pm_status text DEFAULT 'Draft';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'retrofit_projects' AND column_name = 'baseline_locked_at'
  ) THEN
    ALTER TABLE retrofit_projects ADD COLUMN baseline_locked_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'retrofit_projects' AND column_name = 'baseline_locked_by'
  ) THEN
    ALTER TABLE retrofit_projects ADD COLUMN baseline_locked_by uuid REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'retrofit_projects' AND column_name = 'forecast_end_date'
  ) THEN
    ALTER TABLE retrofit_projects ADD COLUMN forecast_end_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'retrofit_projects' AND column_name = 'overall_progress'
  ) THEN
    ALTER TABLE retrofit_projects ADD COLUMN overall_progress int DEFAULT 0 CHECK (overall_progress >= 0 AND overall_progress <= 100);
  END IF;
END $$;

-- Add index for PM status filtering
CREATE INDEX IF NOT EXISTS idx_retrofit_projects_pm_status ON retrofit_projects(pm_status);

-- Add comment for documentation
COMMENT ON COLUMN retrofit_projects.pm_status IS 'Project management status: Draft, Active, On Hold, Completed, Cancelled';
COMMENT ON COLUMN retrofit_projects.baseline_locked_at IS 'Timestamp when project baseline was locked';
COMMENT ON COLUMN retrofit_projects.baseline_locked_by IS 'User who locked the baseline';
COMMENT ON COLUMN retrofit_projects.forecast_end_date IS 'Computed from activities, stored for fast list rendering';
COMMENT ON COLUMN retrofit_projects.overall_progress IS 'Computed from activities (0-100), stored for fast list rendering';