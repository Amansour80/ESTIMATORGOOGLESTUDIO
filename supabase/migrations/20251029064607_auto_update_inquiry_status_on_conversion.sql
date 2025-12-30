/*
  # Auto-Update Inquiry Status on Conversion

  1. Problem
    - When converted_to_project_id is set on an inquiry, the status field should automatically be set to 'converted'
    - Currently, if the status field isn't manually updated, inquiries remain in 'new' status even though they're linked to projects

  2. Solution
    - Create a trigger that automatically sets status = 'converted' when converted_to_project_id is set
    - This ensures data consistency between converted_to_project_id and status fields

  3. Impact
    - Prevents inquiries from showing "Convert" button when they're already converted
    - Ensures UI correctly shows "View Project" button for converted inquiries
*/

-- Function to auto-update inquiry status when converted
CREATE OR REPLACE FUNCTION auto_update_inquiry_status_on_conversion()
RETURNS TRIGGER AS $$
BEGIN
  -- If converted_to_project_id is being set (not null), automatically set status to 'converted'
  IF NEW.converted_to_project_id IS NOT NULL AND (OLD.converted_to_project_id IS NULL OR OLD.converted_to_project_id != NEW.converted_to_project_id) THEN
    NEW.status = 'converted';
  END IF;
  
  -- If converted_to_project_id is being cleared, optionally reset status
  -- (You might want to keep it as 'converted' for history, or change to another status)
  IF NEW.converted_to_project_id IS NULL AND OLD.converted_to_project_id IS NOT NULL THEN
    -- Optionally reset status when conversion is cleared
    -- NEW.status = 'new'; -- Uncomment if you want to reset status
    NULL; -- For now, keep the converted status even if link is cleared
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER FUNCTION auto_update_inquiry_status_on_conversion() SET search_path = '';

-- Create trigger on inquiries table
DROP TRIGGER IF EXISTS trigger_auto_update_inquiry_status ON inquiries;
CREATE TRIGGER trigger_auto_update_inquiry_status
  BEFORE INSERT OR UPDATE ON inquiries
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_inquiry_status_on_conversion();
