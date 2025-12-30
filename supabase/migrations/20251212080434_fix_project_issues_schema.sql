/*
  # Fix Project Issues Schema
  
  1. Changes
    - Add missing columns to project_issues table:
      - issue_type (for categorizing issues as RFI, Defect, etc.)
      - reported_by (for clarity, though created_by serves same purpose)
  
  2. Notes
    - Makes the schema match the IssuesManager component expectations
    - Preserves existing data
*/

-- Add issue_type column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_issues' AND column_name = 'issue_type'
  ) THEN
    ALTER TABLE project_issues 
    ADD COLUMN issue_type text DEFAULT 'Other' 
    CHECK (issue_type IN ('RFI', 'Defect', 'Change Request', 'Safety', 'Quality', 'Other'));
  END IF;
END $$;

-- Add reported_by column if it doesn't exist (for clarity)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_issues' AND column_name = 'reported_by'
  ) THEN
    ALTER TABLE project_issues 
    ADD COLUMN reported_by uuid REFERENCES auth.users(id);
    
    -- Copy created_by to reported_by for existing records
    UPDATE project_issues SET reported_by = created_by WHERE reported_by IS NULL;
  END IF;
END $$;

-- Update status check constraint to match component
DO $$
BEGIN
  ALTER TABLE project_issues DROP CONSTRAINT IF EXISTS project_issues_status_check;
  ALTER TABLE project_issues ADD CONSTRAINT project_issues_status_check 
    CHECK (status IN ('Open', 'In Progress', 'Pending Response', 'Resolved', 'Closed'));
END $$;

-- Add index for issue_type
CREATE INDEX IF NOT EXISTS idx_project_issues_type ON project_issues(issue_type);