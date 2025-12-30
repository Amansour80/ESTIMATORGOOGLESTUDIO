/*
  # Remove Old Valid Status Constraint
  
  ## Problem
  
  The actual_costs table has two check constraints:
  - `valid_status` (old) - blocks 'pending_review' and 'reviewed'
  - `actual_costs_status_check` (new) - allows correct statuses
  
  The old constraint was supposed to be dropped but still exists,
  preventing the status updates from working.
  
  ## Solution
  
  Drop the old `valid_status` constraint to allow the new statuses.
*/

-- Drop the old constraint
ALTER TABLE public.actual_costs
DROP CONSTRAINT IF EXISTS valid_status;
