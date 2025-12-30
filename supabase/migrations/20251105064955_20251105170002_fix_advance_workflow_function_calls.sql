/*
  # Fix advance_workflow_through_conditions Function Calls

  ## Problem
  The advance_workflow_through_conditions function calls other functions
  without schema qualification, which fails when search_path is empty.

  ## Solution
  Add public. prefix to all function calls.
*/

CREATE OR REPLACE FUNCTION advance_workflow_through_conditions(
  p_approval_id uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_current_node_id text;
  v_workflow_id uuid;
  v_project_data jsonb;
  v_node jsonb;
  v_node_type text;
  v_condition_result boolean;
  v_next_node_id text;
  v_max_iterations int := 10;
  v_iteration int := 0;
BEGIN
  -- Get approval details
  SELECT current_node_id, workflow_id, metadata
  INTO v_current_node_id, v_workflow_id, v_project_data
  FROM public.project_approvals
  WHERE id = p_approval_id;

  -- Loop through nodes until we hit a non-condition node
  WHILE v_iteration < v_max_iterations LOOP
    v_iteration := v_iteration + 1;

    -- Get current node data
    SELECT node INTO v_node
    FROM public.approval_workflow_canvas awc,
         jsonb_array_elements(awc.nodes) as node
    WHERE awc.workflow_id = v_workflow_id
      AND node->>'id' = v_current_node_id;

    v_node_type := v_node->>'type';

    -- If not a condition node, stop here
    IF v_node_type != 'condition' THEN
      EXIT;
    END IF;

    -- Evaluate condition (SCHEMA-QUALIFIED)
    v_condition_result := public.evaluate_condition_node(v_node->'data', v_project_data);

    -- Find next node based on condition result (SCHEMA-QUALIFIED)
    v_next_node_id := public.find_next_node(v_workflow_id, v_current_node_id, v_condition_result);

    IF v_next_node_id IS NULL THEN
      RAISE EXCEPTION 'No next node found for condition node %', v_current_node_id;
    END IF;

    -- Update current node
    v_current_node_id := v_next_node_id;

    -- Update the approval record
    UPDATE public.project_approvals
    SET current_node_id = v_current_node_id,
        updated_at = now()
    WHERE id = p_approval_id;
  END LOOP;

  RETURN v_current_node_id;
END;
$$;
