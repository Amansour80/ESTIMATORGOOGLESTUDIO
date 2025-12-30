/*
  # Fix All Column Name Mismatches

  ## Problem
  Functions use "approval_id" but actual tables use "project_approval_id"
  - project_approval_history.project_approval_id (not approval_id)
  - approval_notifications.project_approval_id (not approval_id)

  ## Solution
  Rebuild all functions with correct column names
*/

CREATE OR REPLACE FUNCTION record_approval_action(
  p_approval_id uuid,
  p_node_id text,
  p_step_name text,
  p_user_id uuid,
  p_role_id uuid,
  p_action text,
  p_comments text,
  p_metadata jsonb
)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public' 
AS $$
BEGIN
  INSERT INTO project_approval_history (
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
    p_action::approval_action,
    p_comments,
    p_metadata
  );
END;
$$;

CREATE OR REPLACE FUNCTION notify_approvers_at_node(
  p_approval_id uuid,
  p_node_id text
)
RETURNS integer 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public' 
AS $$
DECLARE 
  v_workflow_id uuid; 
  v_node_config jsonb; 
  v_role_id uuid; 
  v_notification_count int := 0;
BEGIN
  SELECT pa.workflow_id INTO v_workflow_id 
  FROM project_approvals pa 
  WHERE pa.id = p_approval_id;
  
  SELECT node INTO v_node_config 
  FROM approval_workflow_canvas c, jsonb_array_elements(c.nodes) as node 
  WHERE c.workflow_id = v_workflow_id AND node->>'id' = p_node_id;
  
  IF v_node_config->>'type' = 'approval' THEN
    FOR v_role_id IN 
      SELECT (role_element->>'id')::uuid 
      FROM jsonb_array_elements(v_node_config->'data'->'roles') as role_element
    LOOP
      INSERT INTO approval_notifications (
        project_approval_id,
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
        'Approval Required',
        'A project requires your approval',
        '/approvals'
      FROM user_role_assignments ura 
      WHERE ura.role_id = v_role_id AND ura.is_active = true;
      
      GET DIAGNOSTICS v_notification_count = ROW_COUNT;
    END LOOP;
  END IF;
  
  RETURN v_notification_count;
END;
$$;
