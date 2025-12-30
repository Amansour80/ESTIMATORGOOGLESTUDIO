/*
  # Fix start_approval_workflow for ALL Estimators

  ## Problems Fixed
  1. search_path='' prevents finding tables - need public.table_name
  2. Column name inconsistency - all tables use 'project_data' not 'data'
  3. Proper type casting for all enums
  4. Consistent handling across fm, retrofit, and hk

  ## Solution
  Rebuild function with proper schema qualification for ALL resources
*/

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
  -- Validate project_type
  IF p_project_type NOT IN ('fm', 'retrofit', 'hk') THEN
    RAISE EXCEPTION 'Invalid project_type: %. Must be fm, retrofit, or hk', p_project_type;
  END IF;

  -- Build project data for rule evaluation
  -- ALL queries now use public.table_name and correct column names
  IF p_project_type = 'fm' THEN
    SELECT jsonb_build_object(
      'project_value', COALESCE(calculated_value, 0),
      'calculated_value', COALESCE(calculated_value, 0),
      'project_type', 'fm',
      'client_name', client_name,
      'duration_months', COALESCE((project_data->'projectInfo'->>'contractYears')::numeric, 1) * 12
    ) INTO v_project_data
    FROM public.fm_projects
    WHERE id = p_project_id;

  ELSIF p_project_type = 'retrofit' THEN
    SELECT jsonb_build_object(
      'project_value', COALESCE(calculated_value, 0),
      'calculated_value', COALESCE(calculated_value, 0),
      'project_type', 'retrofit',
      'client_name', client_name,
      'duration_months', COALESCE((project_data->'phases'->0->>'duration')::numeric, 0)
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

  -- Check if project exists
  IF v_project_data IS NULL THEN
    RAISE EXCEPTION 'Project not found: % (type: %)', p_project_id, p_project_type;
  END IF;

  -- Find matching workflow
  v_workflow_id := public.find_matching_workflow(p_org_id, v_project_data);

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

  IF v_start_node_id IS NULL OR v_first_step_node_id IS NULL THEN
    RAISE EXCEPTION 'Invalid workflow canvas: missing start or first step node';
  END IF;

  -- Create project approval record (CAST text to enum)
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
    p_project_type::public.project_type_enum,
    v_workflow_id,
    v_first_step_node_id,
    'pending'::public.approval_status,
    p_submitted_by,
    v_project_data
  )
  RETURNING id INTO v_approval_id;

  -- Record submission in history
  PERFORM public.record_approval_action(
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
  v_final_node_id := public.advance_workflow_through_conditions(v_approval_id);

  -- Create notifications for approvers at final node
  PERFORM public.notify_approvers_at_node(v_approval_id, v_final_node_id);

  RETURN v_approval_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to start approval workflow: %', SQLERRM;
END;
$$;
