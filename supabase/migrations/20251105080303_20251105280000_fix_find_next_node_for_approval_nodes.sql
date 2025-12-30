/*
  # Fix find_next_node for Approval Nodes

  ## Problem
  When processing approval actions, find_next_node is called with boolean parameter
  This converts to sourceHandle 'true'/'false' but approval nodes use 'approved'/'rejected'
  
  ## Solution
  Update find_next_node to accept text parameter for sourceHandle
  Update process_approval_action to pass 'approved'/'rejected' directly
*/

-- Drop old version and create new one with text parameter
DROP FUNCTION IF EXISTS find_next_node(uuid, text, boolean);

CREATE OR REPLACE FUNCTION find_next_node(
  p_workflow_id uuid,
  p_current_node_id text,
  p_source_handle text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE 
  v_edge jsonb;
BEGIN
  -- Find the edge from current node with matching source handle (if specified)
  SELECT edge INTO v_edge 
  FROM approval_workflow_canvas awc, 
       jsonb_array_elements(awc.edges) as edge 
  WHERE awc.workflow_id = p_workflow_id 
    AND edge->>'source' = p_current_node_id 
    AND (p_source_handle IS NULL OR edge->>'sourceHandle' = p_source_handle)
  LIMIT 1;
  
  RETURN v_edge->>'target';
END;
$$;

-- Update process_approval_action to use correct source handles
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
  
  -- Find next node based on action (use 'approved' or 'rejected' as source handle)
  v_next_node_id := find_next_node(v_workflow_id, v_current_node_id, p_action);
  
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