/*
  # Fix start_approval_workflow Schema Qualification
  
  1. Problem
    - Function cannot find retrofit_projects table despite search_path being set
    - SECURITY DEFINER functions need explicit schema qualification
  
  2. Solution
    - Explicitly qualify all table references with 'public.' schema
    - This ensures the function works regardless of search_path issues
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
SET search_path = 'public'
AS $$
DECLARE
  v_workflow_id uuid;
  v_approval_id uuid;
  v_existing_approval_id uuid;
  v_project_data jsonb;
  v_start_node_id text;
  v_first_step_node_id text;
  v_final_node_id text;
BEGIN
  IF p_project_type NOT IN ('fm', 'retrofit', 'hk') THEN
    RAISE EXCEPTION 'Invalid project_type: %', p_project_type;
  END IF;

  -- Get project data with calculated_value (with explicit schema qualification)
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

  v_workflow_id := find_matching_workflow(p_org_id, v_project_data);
  IF v_workflow_id IS NULL THEN
    RAISE EXCEPTION 'No workflow found';
  END IF;

  -- Get start node and first step node
  SELECT 
    (SELECT node->>'id' FROM jsonb_array_elements(nodes) as node WHERE node->>'type' = 'start' LIMIT 1),
    (SELECT node->>'id' FROM jsonb_array_elements(nodes) as node WHERE node->>'type' IN ('approval', 'condition') LIMIT 1)
  INTO v_start_node_id, v_first_step_node_id
  FROM public.approval_workflow_canvas WHERE workflow_id = v_workflow_id;

  IF v_start_node_id IS NULL THEN
    RAISE EXCEPTION 'Workflow has no start node';
  END IF;

  IF v_first_step_node_id IS NULL THEN
    RAISE EXCEPTION 'Workflow has no approval or condition node after start';
  END IF;

  -- Check if there's an existing approval with revision_requested status
  SELECT id INTO v_existing_approval_id
  FROM public.project_approvals
  WHERE project_id = p_project_id
    AND project_type = p_project_type::project_type_enum
    AND status = 'revision_requested'
  LIMIT 1;

  IF v_existing_approval_id IS NOT NULL THEN
    -- Reuse existing approval record - restart the workflow
    UPDATE public.project_approvals
    SET 
      workflow_id = v_workflow_id,
      current_node_id = v_first_step_node_id,
      status = 'pending',
      submitted_by = p_submitted_by,
      submitted_at = now(),
      completed_at = NULL,
      metadata = v_project_data,
      updated_at = now()
    WHERE id = v_existing_approval_id;
    
    v_approval_id := v_existing_approval_id;
  ELSE
    -- Create new approval record
    INSERT INTO public.project_approvals (
      project_id, 
      project_type, 
      workflow_id, 
      current_node_id, 
      status, 
      submitted_by, 
      metadata,
      organization_id
    )
    VALUES (
      p_project_id, 
      p_project_type::project_type_enum, 
      v_workflow_id, 
      v_first_step_node_id, 
      'pending', 
      p_submitted_by, 
      v_project_data,
      p_org_id
    )
    RETURNING id INTO v_approval_id;
  END IF;

  -- Record submission
  PERFORM record_approval_action(
    v_approval_id, 
    v_start_node_id, 
    CASE WHEN v_existing_approval_id IS NOT NULL THEN 'Resubmitted' ELSE 'Submitted' END,
    p_submitted_by, 
    NULL, 
    'submitted', 
    CASE WHEN v_existing_approval_id IS NOT NULL THEN 'Project resubmitted after revision' ELSE 'Project submitted' END,
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