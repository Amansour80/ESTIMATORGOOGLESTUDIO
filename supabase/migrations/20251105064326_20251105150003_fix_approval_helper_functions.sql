/*
  # Fix Approval Helper Functions

  ## Problem
  Functions record_approval_action and notify_approvers_at_node are missing
  proper search_path settings and use enums.

  ## Solution
  Recreate with search_path = '' and fully qualified table names.
*/

-- Fix record_approval_action
CREATE OR REPLACE FUNCTION record_approval_action(
  p_approval_id uuid,
  p_node_id text,
  p_step_name text,
  p_user_id uuid,
  p_role_id uuid,
  p_action text,
  p_comments text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  history_id uuid;
BEGIN
  INSERT INTO public.project_approval_history (
    project_approval_id,
    node_id,
    step_name,
    user_id,
    role_id,
    action,
    comments,
    metadata
  ) VALUES (
    p_approval_id,
    p_node_id,
    p_step_name,
    p_user_id,
    p_role_id,
    p_action::public.approval_action,
    p_comments,
    p_metadata
  )
  RETURNING id INTO history_id;

  RETURN history_id;
END;
$$;

-- Fix notify_approvers_at_node
CREATE OR REPLACE FUNCTION notify_approvers_at_node(
  p_approval_id uuid,
  p_node_id text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_workflow_id uuid;
  v_node_config jsonb;
  v_role_id uuid;
  v_notification_count int := 0;
  v_project_info jsonb;
BEGIN
  -- Get workflow and node configuration
  SELECT pa.workflow_id INTO v_workflow_id
  FROM public.project_approvals pa
  WHERE pa.id = p_approval_id;

  SELECT node INTO v_node_config
  FROM public.approval_workflow_canvas c,
       jsonb_array_elements(c.nodes) as node
  WHERE c.workflow_id = v_workflow_id
    AND node->>'id' = p_node_id;

  -- Only notify if it's an approval node
  IF v_node_config->>'type' = 'approval' THEN
    -- Get project info for notification message
    SELECT jsonb_build_object(
      'project_id', pa.project_id,
      'project_type', pa.project_type,
      'step_name', v_node_config->'data'->>'stepName'
    ) INTO v_project_info
    FROM public.project_approvals pa
    WHERE pa.id = p_approval_id;

    -- Notify each role assigned to this approval node
    FOR v_role_id IN 
      SELECT (role_element->>'id')::uuid
      FROM jsonb_array_elements(v_node_config->'data'->'roles') as role_element
    LOOP
      -- Create notifications for users with this role
      INSERT INTO public.approval_notifications (
        approval_id,
        user_id,
        notification_type,
        title,
        message,
        link
      )
      SELECT 
        p_approval_id,
        ura.user_id,
        'pending_approval',
        'Approval Required: ' || COALESCE(v_node_config->'data'->>'stepName', 'Project Approval'),
        'A project requires your approval',
        '/approvals'
      FROM public.user_role_assignments ura
      WHERE ura.role_id = v_role_id
        AND ura.is_active = true;
      
      GET DIAGNOSTICS v_notification_count = ROW_COUNT;
    END LOOP;
  END IF;

  RETURN v_notification_count;
END;
$$;
