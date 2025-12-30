/*
  # Fix can_user_approve_at_node Function

  ## Problem
  1. Function signature expects p_node_id but frontend only passes p_approval_id and p_user_id
  2. Function needs to get current_node_id from project_approvals table itself
  
  ## Solution
  Rebuild function to automatically get current_node_id from approval record
*/

CREATE OR REPLACE FUNCTION can_user_approve_at_node(
  p_approval_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_workflow_id uuid;
  v_current_node_id text;
  v_node_type text;
  v_node_roles jsonb;
  v_can_approve boolean := false;
BEGIN
  -- Get workflow ID and current node from approval
  SELECT workflow_id, current_node_id
  INTO v_workflow_id, v_current_node_id
  FROM project_approvals
  WHERE id = p_approval_id;
  
  -- If no current node, can't approve
  IF v_current_node_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get node details
  SELECT 
    node->>'type',
    node->'data'->'roles'
  INTO v_node_type, v_node_roles
  FROM approval_workflow_canvas c,
       jsonb_array_elements(c.nodes) as node
  WHERE c.workflow_id = v_workflow_id
    AND node->>'id' = v_current_node_id;
  
  -- Only approval nodes require user action
  IF v_node_type != 'approval' THEN
    RETURN false;
  END IF;
  
  -- Check if user has any of the required roles
  SELECT EXISTS (
    SELECT 1
    FROM user_role_assignments ura
    CROSS JOIN jsonb_array_elements(v_node_roles) as role_obj
    WHERE ura.user_id = p_user_id
      AND ura.role_id = (role_obj->>'id')::uuid
      AND ura.is_active = true
  ) INTO v_can_approve;
  
  RETURN v_can_approve;
END;
$$;

-- Also create process_approval_action function if it doesn't exist
CREATE OR REPLACE FUNCTION process_approval_action(
  p_approval_id uuid,
  p_user_id uuid,
  p_action text,
  p_comments text,
  p_role_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_current_node_id text;
  v_workflow_id uuid;
  v_next_node_id text;
  v_node_type text;
BEGIN
  -- Verify user can approve
  IF NOT can_user_approve_at_node(p_approval_id, p_user_id) THEN
    RAISE EXCEPTION 'User does not have permission to approve at this step';
  END IF;
  
  -- Get current state
  SELECT current_node_id, workflow_id
  INTO v_current_node_id, v_workflow_id
  FROM project_approvals
  WHERE id = p_approval_id;
  
  -- Record the action
  PERFORM record_approval_action(
    p_approval_id,
    v_current_node_id,
    'Approval Decision',
    p_user_id,
    p_role_id,
    p_action,
    p_comments,
    jsonb_build_object('action_type', p_action)
  );
  
  -- Find next node based on action
  v_next_node_id := find_next_node(v_workflow_id, v_current_node_id, p_action::boolean);
  
  -- If approved and there's a next node
  IF p_action = 'approved' AND v_next_node_id IS NOT NULL THEN
    -- Check node type
    SELECT node->>'type' INTO v_node_type
    FROM approval_workflow_canvas awc, jsonb_array_elements(awc.nodes) as node
    WHERE awc.workflow_id = v_workflow_id AND node->>'id' = v_next_node_id;
    
    IF v_node_type = 'end' THEN
      -- Mark as approved
      UPDATE project_approvals
      SET 
        status = 'approved'::approval_status,
        current_node_id = v_next_node_id,
        completed_at = now(),
        updated_at = now()
      WHERE id = p_approval_id;
    ELSE
      -- Move to next approval step
      UPDATE project_approvals
      SET 
        current_node_id = v_next_node_id,
        updated_at = now()
      WHERE id = p_approval_id;
      
      -- Advance through conditions
      v_next_node_id := advance_workflow_through_conditions(p_approval_id);
      
      -- Notify next approvers
      PERFORM notify_approvers_at_node(p_approval_id, v_next_node_id);
    END IF;
  ELSIF p_action = 'rejected' THEN
    UPDATE project_approvals
    SET 
      status = 'rejected'::approval_status,
      completed_at = now(),
      updated_at = now()
    WHERE id = p_approval_id;
  ELSIF p_action = 'revision_requested' THEN
    UPDATE project_approvals
    SET 
      status = 'revision_requested'::approval_status,
      current_node_id = NULL,
      updated_at = now()
    WHERE id = p_approval_id;
  END IF;
END;
$$;