/*
  # Add client_name field to all project tables

  1. Changes
    - Add `client_name` field to `hk_projects` table
    - Add `client_name` field to `fm_projects` table
    - Add `client_name` field to `retrofit_projects` table
    
  2. Notes
    - Field is optional (nullable) to maintain backward compatibility
    - Existing projects will have NULL client_name until updated
*/

-- Add client_name to HK projects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hk_projects' AND column_name = 'client_name'
  ) THEN
    ALTER TABLE hk_projects ADD COLUMN client_name TEXT;
  END IF;
END $$;

-- Add client_name to FM projects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fm_projects' AND column_name = 'client_name'
  ) THEN
    ALTER TABLE fm_projects ADD COLUMN client_name TEXT;
  END IF;
END $$;

-- Add client_name to Retrofit projects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'retrofit_projects' AND column_name = 'client_name'
  ) THEN
    ALTER TABLE retrofit_projects ADD COLUMN client_name TEXT;
  END IF;
END $$;
