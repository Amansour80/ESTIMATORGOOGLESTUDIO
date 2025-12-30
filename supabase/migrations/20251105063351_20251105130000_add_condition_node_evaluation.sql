/*
  # Add Condition Node Evaluation to Workflow Engine

  ## Overview
  The workflow system was stopping at condition nodes instead of automatically
  evaluating them and progressing to the next node. This migration adds a function
  to evaluate condition nodes and updates the workflow submission to automatically
  progress through conditions.

  ## Changes
  1. Create evaluate_condition_node() function to check conditions
  2. Create advance_workflow_through_conditions() function to progress workflow
  3. Update start_approval_workflow() to auto-evaluate conditions after submission
  
  ## How It Works
  When a project is submitted:
  - If current node is a condition → evaluate it
  - Find the next node based on condition result (true/false handle)
  - Move to next node
  - If next node is also a condition → repeat
  - Stop when reaching an approval node or end node
*/

-- Function to evaluate a single condition rule against project data
CREATE OR REPLACE FUNCTION evaluate_condition_rule(
  p_field text,
  p_operator text,
  p_value text,
  p_project_data jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_field_value numeric;
  v_compare_value numeric;
BEGIN
  -- Extract field value from project data
  v_field_value := COALESCE((p_project_data->>p_field)::numeric, 0);
  v_compare_value := p_value::numeric;

  -- Evaluate based on operator
  CASE p_operator
    WHEN 'greater_than' THEN
      RETURN v_field_value > v_compare_value;
    WHEN 'less_than' THEN
      RETURN v_field_value < v_compare_value;
    WHEN 'equals' THEN
      RETURN v_field_value = v_compare_value;
    WHEN 'greater_than_or_equal' THEN
      RETURN v_field_value >= v_compare_value;
    WHEN 'less_than_or_equal' THEN
      RETURN v_field_value <= v_compare_value;
    WHEN 'not_equals' THEN
      RETURN v_field_value != v_compare_value;
    ELSE
      RETURN false;
  END CASE;
END;
$$;

-- Function to evaluate all conditions in a condition node
CREATE OR REPLACE FUNCTION evaluate_condition_node(
  p_node_data jsonb,
  p_project_data jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_rule jsonb;
  v_result boolean;
  v_require_all boolean;
  v_any_true boolean := false;
  v_all_true boolean := true;
BEGIN
  -- Get requireAll flag (default to false = OR logic)
  v_require_all := COALESCE((p_node_data->>'requireAll')::boolean, false);

  -- Evaluate each condition rule
  FOR v_rule IN SELECT * FROM jsonb_array_elements(p_node_data->'conditionRules')
  LOOP
    v_result := evaluate_condition_rule(
      v_rule->>'field',
      v_rule->>'operator',
      v_rule->>'value',
      p_project_data
    );

    IF v_result THEN
      v_any_true := true;
    ELSE
      v_all_true := false;
    END IF;

    -- Short circuit if possible
    IF v_require_all AND NOT v_result THEN
      RETURN false;
    END IF;
    
    IF NOT v_require_all AND v_result THEN
      RETURN true;
    END IF;
  END LOOP;

  -- Return based on require_all flag
  IF v_require_all THEN
    RETURN v_all_true;
  ELSE
    RETURN v_any_true;
  END IF;
END;
$$;

-- Function to find the next node based on current node and condition result
CREATE OR REPLACE FUNCTION find_next_node(
  p_workflow_id uuid,
  p_current_node_id text,
  p_condition_result boolean DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_edge jsonb;
  v_source_handle text;
BEGIN
  -- Determine which handle to follow
  IF p_condition_result IS NOT NULL THEN
    v_source_handle := CASE WHEN p_condition_result THEN 'true' ELSE 'false' END;
  END IF;

  -- Find the edge from current node
  SELECT edge INTO v_edge
  FROM public.approval_workflow_canvas awc,
       jsonb_array_elements(awc.edges) as edge
  WHERE awc.workflow_id = p_workflow_id
    AND edge->>'source' = p_current_node_id
    AND (v_source_handle IS NULL OR edge->>'sourceHandle' = v_source_handle)
  LIMIT 1;

  RETURN v_edge->>'target';
END;
$$;

-- Function to advance workflow through condition nodes
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

    -- Evaluate condition
    v_condition_result := evaluate_condition_node(v_node->'data', v_project_data);

    -- Find next node based on condition result
    v_next_node_id := find_next_node(v_workflow_id, v_current_node_id, v_condition_result);

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

-- Update start_approval_workflow to auto-evaluate conditions
CREATE OR REPLACE FUNCTION start_approval_workflow(
  p_project_id uuid,
  p_project_type text,
  p_submitted_by uuid,
  p_org_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_workflow_id uuid;
  v_approval_id uuid;
  v_project_data jsonb;
  v_start_node_id text;
  v_first_step_node_id text;
  v_final_node_id text;
BEGIN
  -- Build project data for rule evaluation
  IF p_project_type = 'fm' THEN
    SELECT jsonb_build_object(
      'project_value', COALESCE(data->'pricing'->>'totalYearlyCost', '0')::numeric,
      'calculated_value', COALESCE(calculated_value, 0),
      'project_type', 'fm',
      'client_name', client_name,
      'duration_months', COALESCE(data->'projectInfo'->>'contractYears', '1')::numeric * 12
    ) INTO v_project_data
    FROM public.fm_projects
    WHERE id = p_project_id;

  ELSIF p_project_type = 'retrofit' THEN
    SELECT jsonb_build_object(
      'project_value', COALESCE(calculated_value, 0),
      'calculated_value', COALESCE(calculated_value, 0),
      'project_type', 'retrofit',
      'client_name', client_name,
      'duration_months', COALESCE(data->'phases'->0->>'duration', '0')::numeric
    ) INTO v_project_data
    FROM public.retrofit_projects
    WHERE id = p_project_id;

  ELSIF p_project_type = 'hk' THEN
    SELECT jsonb_build_object(
      'project_value', COALESCE(calculated_value, 0),
      'calculated_value', COALESCE(calculated_value, 0),
      'project_type', 'hk',
      'client_name', client_name,
      'duration_months', 12
    ) INTO v_project_data
    FROM public.hk_projects
    WHERE id = p_project_id;
  END IF;

  -- Find matching workflow
  v_workflow_id := find_matching_workflow(p_org_id, v_project_data);

  IF v_workflow_id IS NULL THEN
    RAISE EXCEPTION 'No workflow found for this project';
  END IF;

  -- Find start node and first step node
  SELECT 
    (SELECT node->>'id' FROM jsonb_array_elements(nodes) as node WHERE node->>'type' = 'start' LIMIT 1),
    (SELECT node->>'id' FROM jsonb_array_elements(nodes) as node WHERE node->>'type' IN ('approval', 'condition') LIMIT 1)
  INTO v_start_node_id, v_first_step_node_id
  FROM public.approval_workflow_canvas
  WHERE workflow_id = v_workflow_id;

  -- Create project approval record
  INSERT INTO public.project_approvals (
    project_id,
    project_type,
    workflow_id,
    current_node_id,
    status,
    submitted_by,
    metadata
  ) VALUES (
    p_project_id,
    p_project_type,
    v_workflow_id,
    v_first_step_node_id,
    'pending',
    p_submitted_by,
    v_project_data
  )
  RETURNING id INTO v_approval_id;

  -- Record submission in history
  PERFORM record_approval_action(
    v_approval_id,
    v_start_node_id,
    'Submitted',
    p_submitted_by,
    NULL,
    'submitted',
    'Project submitted for approval',
    jsonb_build_object('project_data', v_project_data)
  );

  -- Automatically advance through condition nodes
  v_final_node_id := advance_workflow_through_conditions(v_approval_id);

  -- Create notifications for approvers at final node
  PERFORM notify_approvers_at_node(v_approval_id, v_final_node_id);

  RETURN v_approval_id;
END;
$$;
