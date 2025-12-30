/*
  # Fix PM Notifications to Use Correct Table
  
  1. Changes
    - Fix create_pm_notification function to use user_notifications table
    - Map entity_type and entity_id to proper columns
    - Update function to match user_notifications schema
    
  2. Notes
    - The notifications table doesn't exist, should use user_notifications
    - Maps entity_type to title and metadata
    - Maps entity_id to project_id
*/

-- Drop and recreate the function with correct table name and schema
CREATE OR REPLACE FUNCTION create_pm_notification(
  p_user_id uuid,
  p_organization_id uuid,
  p_type text,
  p_entity_type text,
  p_entity_id uuid,
  p_message text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id uuid;
  v_title text;
BEGIN
  -- Create a title based on notification type
  v_title := CASE 
    WHEN p_type = 'activity_assigned' THEN 'Activity Assigned'
    WHEN p_type = 'activity_status_changed' THEN 'Activity Status Changed'
    WHEN p_type = 'document_submitted' THEN 'Document Submitted'
    WHEN p_type = 'document_decision' THEN 'Document Decision'
    WHEN p_type = 'issue_assigned' THEN 'Issue Assigned'
    WHEN p_type = 'issue_status_changed' THEN 'Issue Status Changed'
    ELSE 'Notification'
  END;

  INSERT INTO user_notifications (
    user_id,
    organization_id,
    notification_type,
    title,
    message,
    project_id,
    metadata,
    is_read
  ) VALUES (
    p_user_id,
    p_organization_id,
    p_type,
    v_title,
    p_message,
    p_entity_id,
    jsonb_build_object('entity_type', p_entity_type, 'entity_id', p_entity_id),
    false
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;