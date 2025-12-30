/*
  # Add 'asset' to valid cost types

  Updates the valid_cost_type constraint on the actual_costs table to include 'asset' as a valid cost type.

  1. Changes
    - Drop existing valid_cost_type constraint
    - Add new constraint that includes 'asset' in the allowed values
*/

-- Drop the old constraint
ALTER TABLE public.actual_costs 
DROP CONSTRAINT IF EXISTS valid_cost_type;

-- Add the new constraint with 'asset' included
ALTER TABLE public.actual_costs 
ADD CONSTRAINT valid_cost_type 
CHECK (cost_type IN ('labor', 'material', 'equipment', 'subcontractor', 'asset', 'other'));
