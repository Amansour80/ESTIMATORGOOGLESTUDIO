/*
  # Fix Inquiry Status Reset on Project Deletion
  
  ## Problem
  The trigger `auto_update_inquiry_status_on_conversion` keeps inquiries in 'converted' status
  even when the project link is cleared. This causes converted inquiries to still show 
  "View Project" button even after the project is deleted.
  
  ## Solution
  Update the trigger to reset status to 'in_review' when converted_to_project_id is cleared.
  This ensures inquiries show "Convert to Estimation" button again after project deletion.
  
  ## Changes
  - When converted_to_project_id changes from non-null to null, reset status to 'in_review'
  - This allows the inquiry to be converted to a new project estimation
*/

-- Drop and recreate the function with proper status reset logic
DROP FUNCTION IF EXISTS auto_update_inquiry_status_on_conversion() CASCADE;

CREATE OR REPLACE FUNCTION auto_update_inquiry_status_on_conversion()
RETURNS TRIGGER AS $$
BEGIN
  -- If converted_to_project_id is being set (not null), automatically set status to 'converted'
  IF NEW.converted_to_project_id IS NOT NULL AND (OLD.converted_to_project_id IS NULL OR OLD.converted_to_project_id != NEW.converted_to_project_id) THEN
    NEW.status = 'converted';
  END IF;
  
  -- If converted_to_project_id is being cleared, reset status to 'in_review'
  -- This happens when the linked project is deleted
  IF NEW.converted_to_project_id IS NULL AND OLD.converted_to_project_id IS NOT NULL THEN
    -- Only reset if status was explicitly set to something other than 'converted'
    -- OR if both project fields are being cleared
    IF NEW.status != OLD.status OR (NEW.converted_to_project_type IS NULL AND OLD.converted_to_project_type IS NOT NULL) THEN
      NEW.status = 'in_review';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER FUNCTION auto_update_inquiry_status_on_conversion() SET search_path = '';

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_auto_update_inquiry_status ON inquiries;
CREATE TRIGGER trigger_auto_update_inquiry_status
  BEFORE INSERT OR UPDATE ON inquiries
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_inquiry_status_on_conversion();