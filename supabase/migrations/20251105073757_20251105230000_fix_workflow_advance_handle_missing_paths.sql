/*
  # Fix Workflow Advancement to Handle Missing Paths

  ## Problem
  When condition evaluates to FALSE but there's no FALSE edge, workflow gets stuck
  with current_node_id = null or at the condition node.

  ## Solution
  1. If no path exists from a condition node, skip directly to end node (auto-approve)
  2. Ensure current_node_id is always set correctly
  3. Add better error handling
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
    
    -- Find next node
    v_next_node_id := find_next_node(v_workflow_id, v_current_node_id, v_condition_result);

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
        status = 'approved'::approval_status,
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

-- Also fix start_approval_workflow to ensure first node is set correctly
CREATE OR REPLACE FUNCTION start_approval_workflow(
  p_project_id uuid,
  p_project_type text,
  p_submitted_by uuid,
  p_org_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_workflow_id uuid;
  v_approval_id uuid;
  v_project_data jsonb;
  v_start_node_id text;
  v_first_step_node_id text;
  v_final_node_id text;
BEGIN
  IF p_project_type NOT IN ('fm', 'retrofit', 'hk') THEN
    RAISE EXCEPTION 'Invalid project_type: %', p_project_type;
  END IF;

  -- Get project data with calculated_value
  IF p_project_type = 'fm' THEN
    SELECT jsonb_build_object(
      'project_value', COALESCE(calculated_value, 0),
      'calculated_value', COALESCE(calculated_value, 0),
      'project_type', 'fm',
      'client_name', client_name,
      'duration_months', COALESCE((project_data->'projectInfo'->>'contractYears')::numeric, 1) * 12
    ) INTO v_project_data
    FROM fm_projects WHERE id = p_project_id;
  ELSIF p_project_type = 'retrofit' THEN
    SELECT jsonb_build_object(
      'project_value', COALESCE(calculated_value, 0),
      'calculated_value', COALESCE(calculated_value, 0),
      'project_type', 'retrofit',
      'client_name', client_name,
      'duration_months', COALESCE((project_data->'phases'->0->>'duration')::numeric, 0)
    ) INTO v_project_data
    FROM retrofit_projects WHERE id = p_project_id;
  ELSIF p_project_type = 'hk' THEN
    SELECT jsonb_build_object(
      'project_value', COALESCE(calculated_value, 0),
      'calculated_value', COALESCE(calculated_value, 0),
      'project_type', 'hk',
      'client_name', client_name,
      'duration_months', 12
    ) INTO v_project_data
    FROM hk_projects WHERE id = p_project_id;
  END IF;

  IF v_project_data IS NULL THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  v_workflow_id := find_matching_workflow(p_org_id, v_project_data);
  IF v_workflow_id IS NULL THEN
    RAISE EXCEPTION 'No workflow found';
  END IF;

  -- Get start node and first step node
  SELECT 
    (SELECT node->>'id' FROM jsonb_array_elements(nodes) as node WHERE node->>'type' = 'start' LIMIT 1),
    (SELECT node->>'id' FROM jsonb_array_elements(nodes) as node WHERE node->>'type' IN ('approval', 'condition') LIMIT 1)
  INTO v_start_node_id, v_first_step_node_id
  FROM approval_workflow_canvas WHERE workflow_id = v_workflow_id;

  IF v_start_node_id IS NULL THEN
    RAISE EXCEPTION 'Workflow has no start node';
  END IF;

  IF v_first_step_node_id IS NULL THEN
    RAISE EXCEPTION 'Workflow has no approval or condition node after start';
  END IF;

  -- Create approval record with first step node
  INSERT INTO project_approvals (
    project_id, 
    project_type, 
    workflow_id, 
    current_node_id, 
    status, 
    submitted_by, 
    metadata
  )
  VALUES (
    p_project_id, 
    p_project_type::project_type_enum, 
    v_workflow_id, 
    v_first_step_node_id, 
    'pending'::approval_status, 
    p_submitted_by, 
    v_project_data
  )
  RETURNING id INTO v_approval_id;

  -- Record submission
  PERFORM record_approval_action(
    v_approval_id, 
    v_start_node_id, 
    'Submitted', 
    p_submitted_by, 
    NULL, 
    'submitted', 
    'Project submitted', 
    jsonb_build_object('project_data', v_project_data)
  );

  -- Advance through conditions
  v_final_node_id := advance_workflow_through_conditions(v_approval_id);

  -- Create notifications if at approval node
  IF v_final_node_id IS NOT NULL THEN
    PERFORM notify_approvers_at_node(v_approval_id, v_final_node_id);
  END IF;

  RETURN v_approval_id;
END;
$$;
