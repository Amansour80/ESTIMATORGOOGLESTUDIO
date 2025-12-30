/*
  # Add Missing Columns to project_issues
  
  1. Problem
    - Frontend expects `issue_type` and `reported_by` columns
    - These columns are missing from the project_issues table
  
  2. Solution
    - Add `issue_type` column with CHECK constraint
    - Add `reported_by` column as reference to auth.users
    - Add index for performance
*/

-- Add issue_type column
ALTER TABLE project_issues 
ADD COLUMN IF NOT EXISTS issue_type text DEFAULT 'RFI' 
CHECK (issue_type IN ('RFI', 'Defect', 'Change Request', 'Safety', 'Quality', 'Other'));

-- Add reported_by column (for tracking who reported the issue)
ALTER TABLE project_issues 
ADD COLUMN IF NOT EXISTS reported_by uuid REFERENCES auth.users(id);

-- Add index for issue_type
CREATE INDEX IF NOT EXISTS idx_project_issues_type ON project_issues(issue_type);

-- Update status CHECK constraint to include 'Pending Response'
ALTER TABLE project_issues DROP CONSTRAINT IF EXISTS project_issues_status_check;
ALTER TABLE project_issues 
ADD CONSTRAINT project_issues_status_check 
CHECK (status IN ('Open', 'In Progress', 'Pending Response', 'Resolved', 'Closed'));
