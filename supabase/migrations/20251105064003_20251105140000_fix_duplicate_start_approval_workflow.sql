/*
  # Fix Duplicate start_approval_workflow Function

  ## Problem
  Two versions of start_approval_workflow exist:
  - One with project_type_enum parameter (old)
  - One with text parameter (new)
  
  This causes "Could not choose the best candidate function" error.

  ## Solution
  Drop the old function that uses project_type_enum and keep the new one with text parameter.
*/

-- Drop the old version that uses project_type_enum
DROP FUNCTION IF EXISTS start_approval_workflow(uuid, project_type_enum, uuid, uuid);
