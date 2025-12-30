/*
  # Fix start_approval_workflow Schema Qualification
  
  1. Problem
    - start_approval_workflow references fm_projects, retrofit_projects, hk_projects without schema
    - SECURITY DEFINER functions need explicit schema qualification
  
  2. Solution
    - Add 'public.' prefix to all table references
*/

DROP FUNCTION IF EXISTS start_approval_workflow(uuid, text, uuid, uuid);

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

  -- Fetch project data with explicit schema qualification
  IF p_project_type = 'fm' THEN
    SELECT jsonb_build_object(
      'project_value', COALESCE(calculated_value, 0),
      'calculated_value', COALESCE(calculated_value, 0),
      'project_type', 'fm',
      'client_name', client_name,
      'duration_months', COALESCE((project_data->'projectInfo'->>'contractYears')::numeric, 1) * 12
    ) INTO v_project_data
    FROM public.fm_projects WHERE id = p_project_id;
    
  ELSIF p_project_type = 'retrofit' THEN
    SELECT jsonb_build_object(
      'project_value', COALESCE(calculated_value, 0),
      'calculated_value', COALESCE(calculated_value, 0),
      'project_type', 'retrofit',
      'client_name', client_name,
      'duration_months', COALESCE((project_data->'phases'->0->>'duration')::numeric, 0)
    ) INTO v_project_data
    FROM public.retrofit_projects WHERE id = p_project_id;
    
  ELSIF p_project_type = 'hk' THEN
    SELECT jsonb_build_object(
      'project_value', COALESCE(calculated_value, 0),
      'calculated_value', COALESCE(calculated_value, 0),
      'project_type', 'hk',
      'client_name', client_name,
      'duration_months', 12
    ) INTO v_project_data
    FROM public.hk_projects WHERE id = p_project_id;
  END IF;

  IF v_project_data IS NULL THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  -- Find matching workflow
  v_workflow_id := find_matching_workflow(p_org_id, v_project_data);
  IF v_workflow_id IS NULL THEN
    RAISE EXCEPTION 'No workflow found';
  END IF;

  -- Get start and first step nodes
  SELECT 
    (SELECT node->>'id' FROM jsonb_array_elements(nodes) as node WHERE node->>'type' = 'start' LIMIT 1),
    (SELECT node->>'id' FROM jsonb_array_elements(nodes) as node WHERE node->>'type' IN ('approval', 'condition') LIMIT 1)
  INTO v_start_node_id, v_first_step_node_id
  FROM public.approval_workflow_canvas WHERE workflow_id = v_workflow_id;

  -- Create approval record
  INSERT INTO public.project_approvals (
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

  -- Record submission action
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
  
  -- Advance through any condition nodes
  v_final_node_id := advance_workflow_through_conditions(v_approval_id);
  
  -- Notify approvers at the final node
  PERFORM notify_approvers_at_node(v_approval_id, v_final_node_id);

  RETURN v_approval_id;
END;
$$;