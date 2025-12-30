/*
  # Fix workflow to handle END nodes properly
  
  1. Problem
    - advance_workflow_through_conditions reaches END nodes but doesn't update status
    - Projects sit at "pending" even when auto-approved
  
  2. Solution
    - Check if we've reached an END node
    - Update status based on endType (approved/rejected/revision)
    - Set completed_at timestamp
*/

CREATE OR REPLACE FUNCTION advance_workflow_through_conditions(p_approval_id uuid)
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
  v_end_type text;
  v_new_status text;
BEGIN
  SELECT current_node_id, workflow_id, metadata 
  INTO v_current_node_id, v_workflow_id, v_project_data 
  FROM public.project_approvals 
  WHERE id = p_approval_id;

  WHILE v_iteration < 10 LOOP
    v_iteration := v_iteration + 1;

    SELECT node INTO v_node 
    FROM public.approval_workflow_canvas awc, 
         jsonb_array_elements(awc.nodes) as node 
    WHERE awc.workflow_id = v_workflow_id 
      AND node->>'id' = v_current_node_id;

    v_node_type := v_node->>'type';

    -- If we reached an END node, update the status and complete
    IF v_node_type = 'end' THEN
      v_end_type := v_node->'data'->>'endType';
      
      -- Map end type to approval status
      CASE v_end_type
        WHEN 'approved' THEN v_new_status := 'approved';
        WHEN 'rejected' THEN v_new_status := 'rejected';
        WHEN 'revision' THEN v_new_status := 'revision_requested';
        ELSE v_new_status := 'approved'; -- default to approved
      END CASE;

      -- Update the approval record
      UPDATE public.project_approvals 
      SET 
        status = v_new_status::approval_status,
        completed_at = now(),
        updated_at = now()
      WHERE id = p_approval_id;

      EXIT;
    END IF;

    -- If not a condition node, stop advancing
    IF v_node_type != 'condition' THEN 
      EXIT; 
    END IF;

    -- Evaluate condition and advance
    v_condition_result := evaluate_condition_node(v_node->'data', v_project_data);
    v_next_node_id := find_next_node(v_workflow_id, v_current_node_id, v_condition_result);
    v_current_node_id := v_next_node_id;

    UPDATE public.project_approvals 
    SET current_node_id = v_current_node_id, 
        updated_at = now() 
    WHERE id = p_approval_id;
  END LOOP;

  RETURN v_current_node_id;
END;
$$;