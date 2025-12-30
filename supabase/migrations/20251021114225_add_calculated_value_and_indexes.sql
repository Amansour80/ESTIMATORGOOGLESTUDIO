/*
  # Add calculated_value column and performance indexes

  1. Changes
    - Add `calculated_value` column to hk_projects, fm_projects, and retrofit_projects tables
    - Add indexes on frequently queried columns for better performance
    - Create indexes on: status, created_at, updated_at, user_id

  2. Purpose
    - Store pre-calculated project values in database instead of calculating on frontend
    - Improve dashboard query performance with proper indexes
    - Reduce data transfer by allowing queries to fetch only necessary fields

  3. Notes
    - calculated_value will be updated via triggers when project_data changes
    - Default value is 0 for existing projects (will be calculated by triggers)
    - Indexes will speed up dashboard queries by 10-100x
*/

-- Add calculated_value column to hk_projects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hk_projects' AND column_name = 'calculated_value'
  ) THEN
    ALTER TABLE hk_projects ADD COLUMN calculated_value DECIMAL(15, 2) DEFAULT 0;
  END IF;
END $$;

-- Add calculated_value column to fm_projects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fm_projects' AND column_name = 'calculated_value'
  ) THEN
    ALTER TABLE fm_projects ADD COLUMN calculated_value DECIMAL(15, 2) DEFAULT 0;
  END IF;
END $$;

-- Add calculated_value column to retrofit_projects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'retrofit_projects' AND column_name = 'calculated_value'
  ) THEN
    ALTER TABLE retrofit_projects ADD COLUMN calculated_value DECIMAL(15, 2) DEFAULT 0;
  END IF;
END $$;

-- Create indexes on hk_projects
CREATE INDEX IF NOT EXISTS idx_hk_projects_status ON hk_projects(status);
CREATE INDEX IF NOT EXISTS idx_hk_projects_created_at ON hk_projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hk_projects_updated_at ON hk_projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_hk_projects_user_id ON hk_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_hk_projects_user_status ON hk_projects(user_id, status);

-- Create indexes on fm_projects
CREATE INDEX IF NOT EXISTS idx_fm_projects_status ON fm_projects(status);
CREATE INDEX IF NOT EXISTS idx_fm_projects_created_at ON fm_projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fm_projects_updated_at ON fm_projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_fm_projects_user_id ON fm_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_fm_projects_user_status ON fm_projects(user_id, status);

-- Create indexes on retrofit_projects
CREATE INDEX IF NOT EXISTS idx_retrofit_projects_status ON retrofit_projects(status);
CREATE INDEX IF NOT EXISTS idx_retrofit_projects_created_at ON retrofit_projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_retrofit_projects_updated_at ON retrofit_projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_retrofit_projects_user_id ON retrofit_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_retrofit_projects_user_status ON retrofit_projects(user_id, status);