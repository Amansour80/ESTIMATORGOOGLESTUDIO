/*
  # Remove Duplicate process_approval_action Function

  ## Problem
  Two versions of process_approval_action exist with different parameter types:
  - One with p_action as approval_action enum
  - One with p_action as text
  
  ## Solution
  Drop the enum version and keep only the text version which the frontend uses
*/

-- Drop the approval_action enum version
DROP FUNCTION IF EXISTS process_approval_action(uuid, uuid, approval_action, text, uuid);

-- Ensure the text version exists and is correct
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
  IF p_action = 'approved' THEN
    v_next_node_id := find_next_node(v_workflow_id, v_current_node_id, true);
  ELSE
    v_next_node_id := find_next_node(v_workflow_id, v_current_node_id, false);
  END IF;
  
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
        status = 'approved',
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
      status = 'rejected',
      completed_at = now(),
      updated_at = now()
    WHERE id = p_approval_id;
  ELSIF p_action = 'revision_requested' THEN
    UPDATE project_approvals
    SET 
      status = 'revision_requested',
      current_node_id = NULL,
      updated_at = now()
    WHERE id = p_approval_id;
  END IF;
END;
$$;