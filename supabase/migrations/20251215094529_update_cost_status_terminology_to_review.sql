/*
  # Update Cost Status Terminology from Approval to Review

  This migration updates the terminology throughout the budget management system to use "review" instead of "approval",
  as approval happens at the LPO (Local Purchase Order) phase which is outside this application.

  ## Changes

  1. Status Values Updated:
    - 'pending_approval' → 'pending_review'
    - 'approved' → 'reviewed'
    - 'draft' and 'rejected' remain unchanged

  2. Tables Updated:
    - actual_costs: Update status column and existing data

  3. Important Notes:
    - This is a data migration that updates existing records
    - The review workflow is for cost verification within the project management system
    - Actual LPO approval happens in external procurement systems
*/

-- Update the status values in the actual_costs table
-- First, update existing data to use new terminology
UPDATE public.actual_costs
SET status = 'pending_review'
WHERE status = 'pending_approval';

UPDATE public.actual_costs
SET status = 'reviewed'
WHERE status = 'approved';

-- Drop and recreate the check constraint with new values
ALTER TABLE public.actual_costs
DROP CONSTRAINT IF EXISTS actual_costs_status_check;

ALTER TABLE public.actual_costs
ADD CONSTRAINT actual_costs_status_check
CHECK (status IN ('draft', 'pending_review', 'reviewed', 'rejected'));

-- Add helpful comment
COMMENT ON COLUMN public.actual_costs.status IS
'Cost entry status: draft (not submitted), pending_review (submitted for review), reviewed (accepted after review), rejected (not accepted). Note: LPO approval is handled outside this system.';
