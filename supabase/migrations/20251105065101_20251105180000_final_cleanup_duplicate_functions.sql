/*
  # Final Cleanup - Remove Any Remaining Duplicate Functions

  ## Purpose
  Ensure there are no duplicate function definitions that could cause
  "Could not choose the best candidate function" errors.

  ## Actions
  - Drop any remaining functions with enum parameters
  - Keep only the text-based versions for flexibility
*/

-- Clean up any remaining duplicates
DROP FUNCTION IF EXISTS start_approval_workflow(uuid, project_type_enum, uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS record_approval_action(uuid, text, text, uuid, uuid, approval_action, text, jsonb) CASCADE;
DROP FUNCTION IF EXISTS evaluate_rule(jsonb, rule_operator, jsonb) CASCADE;
