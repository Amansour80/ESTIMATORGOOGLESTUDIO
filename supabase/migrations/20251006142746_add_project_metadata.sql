/*
  # Add Project Metadata Columns to FM Projects

  1. Schema Changes
    - Add `project_location` (text) column to fm_projects table
    - Add `project_type` (text) column to fm_projects table
    - These fields duplicate data from project_data.projectInfo for easier querying

  2. Notes
    - Default values are empty strings to match the default state
    - Existing projects will have empty strings for these fields
    - The source of truth remains project_data.projectInfo
    - These columns are for convenience and searchability
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fm_projects' AND column_name = 'project_location'
  ) THEN
    ALTER TABLE fm_projects ADD COLUMN project_location text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fm_projects' AND column_name = 'project_type'
  ) THEN
    ALTER TABLE fm_projects ADD COLUMN project_type text DEFAULT '';
  END IF;
END $$;