/*
  # Add 'overhead' as valid cost type
  
  1. Changes
    - Add 'overhead' to the valid cost types
    - Keep 'other' for backwards compatibility but UI will use 'overhead'
  
  2. Security
    - No changes to RLS policies
*/

-- Drop the existing constraint
ALTER TABLE actual_costs 
DROP CONSTRAINT IF EXISTS valid_cost_type;

-- Add the new constraint with 'overhead' included
ALTER TABLE actual_costs
ADD CONSTRAINT valid_cost_type 
CHECK (cost_type IN ('labor', 'material', 'equipment', 'subcontractor', 'asset', 'overhead', 'other'));