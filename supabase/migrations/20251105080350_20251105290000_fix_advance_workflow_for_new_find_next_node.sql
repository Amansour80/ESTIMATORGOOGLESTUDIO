/*
  # Fix advance_workflow_through_conditions to Use New find_next_node Signature

  ## Problem
  advance_workflow_through_conditions still calls find_next_node with boolean parameter
  But we changed find_next_node to accept text parameter ('true'/'false' for conditions)
  
  ## Solution
  Update advance_workflow_through_conditions to pass 'true'/'false' as text
*/

CREATE OR REPLACE FUNCTION advance_workflow_through_conditions(
  p_approval_id uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_current_node_id text;
  v_workflow_id uuid;
  v_project_data jsonb;
  v_node jsonb;
  v_node_type text;
  v_condition_result boolean;
  v_next_node_id text;
  v_iteration int := 0;
BEGIN
  SELECT current_node_id, workflow_id, metadata
  INTO v_current_node_id, v_workflow_id, v_project_data
  FROM project_approvals
  WHERE id = p_approval_id;
  
  WHILE v_iteration < 10 LOOP
    v_iteration := v_iteration + 1;
    
    -- Get current node
    SELECT node INTO v_node
    FROM approval_workflow_canvas awc, jsonb_array_elements(awc.nodes) as node
    WHERE awc.workflow_id = v_workflow_id AND node->>'id' = v_current_node_id;
    
    v_node_type := v_node->>'type';
    
    -- If not a condition node, we're done
    IF v_node_type != 'condition' THEN
      EXIT;
    END IF;
    
    -- Evaluate condition
    v_condition_result := evaluate_condition_node(v_node->'data', v_project_data);
    
    -- Find next node (pass 'true' or 'false' as text for condition nodes)
    v_next_node_id := find_next_node(
      v_workflow_id, 
      v_current_node_id, 
      CASE WHEN v_condition_result THEN 'true' ELSE 'false' END
    );
    
    -- If no next node found, find an end node and auto-complete
    IF v_next_node_id IS NULL THEN
      -- Try to find an 'approved' end node
      SELECT node->>'id' INTO v_next_node_id
      FROM approval_workflow_canvas awc, jsonb_array_elements(awc.nodes) as node
      WHERE awc.workflow_id = v_workflow_id 
        AND node->>'type' = 'end'
        AND node->'data'->>'endType' = 'approved'
      LIMIT 1;
      
      -- If still no node, find any end node
      IF v_next_node_id IS NULL THEN
        SELECT node->>'id' INTO v_next_node_id
        FROM approval_workflow_canvas awc, jsonb_array_elements(awc.nodes) as node
        WHERE awc.workflow_id = v_workflow_id 
          AND node->>'type' = 'end'
        LIMIT 1;
      END IF;
      
      -- If STILL no end node, raise error
      IF v_next_node_id IS NULL THEN
        RAISE EXCEPTION 'No path found from condition node % and no end node exists', v_current_node_id;
      END IF;
      
      -- Auto-approve since no explicit path
      UPDATE project_approvals
      SET 
        current_node_id = v_next_node_id,
        status = 'approved',
        updated_at = now()
      WHERE id = p_approval_id;
      
      RETURN v_next_node_id;
    END IF;
    
    v_current_node_id := v_next_node_id;
    
    UPDATE project_approvals
    SET current_node_id = v_current_node_id, updated_at = now()
    WHERE id = p_approval_id;
  END LOOP;
  
  RETURN v_current_node_id;
END;
$$;