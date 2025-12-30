/*
  # Fix create_notification function search path

  1. Changes
    - Update `create_notification` function to use correct search_path 'public'
    - This fixes the "relation user_notifications does not exist" error during asset import
*/

CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_organization_id uuid,
  p_notification_type text,
  p_title text,
  p_message text,
  p_project_id uuid DEFAULT NULL,
  p_project_type text DEFAULT NULL,
  p_project_name text DEFAULT NULL,
  p_approval_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  INSERT INTO public.user_notifications (
    user_id,
    organization_id,
    notification_type,
    title,
    message,
    project_id,
    project_type,
    project_name,
    approval_id,
    metadata
  )
  VALUES (
    p_user_id,
    p_organization_id,
    p_notification_type,
    p_title,
    p_message,
    p_project_id,
    p_project_type,
    p_project_name,
    p_approval_id,
    p_metadata
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;