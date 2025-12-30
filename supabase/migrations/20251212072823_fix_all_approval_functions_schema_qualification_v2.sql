/*
  # Fix All Approval Functions Schema Qualification
  
  1. Problem
    - All approval workflow functions have search_path issues
    - SECURITY DEFINER functions need explicit schema qualification
  
  2. Solution
    - Add 'public.' prefix to all table references in all approval functions
    - Drop and recreate functions to handle signature changes
*/

-- Drop existing functions first
DROP FUNCTION IF EXISTS notify_approvers_at_node(uuid, text);
DROP FUNCTION IF EXISTS record_approval_action(uuid, text, text, uuid, uuid, text, text, jsonb);
DROP FUNCTION IF EXISTS find_next_node(uuid, text, boolean);
DROP FUNCTION IF EXISTS advance_workflow_through_conditions(uuid);
DROP FUNCTION IF EXISTS find_matching_workflow(uuid, jsonb);

-- find_matching_workflow
CREATE OR REPLACE FUNCTION find_matching_workflow(p_org_id uuid, p_project_data jsonb)
RETURNS uuid 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public' 
AS $$
DECLARE 
  workflow_rec RECORD; 
  matching_wf_id uuid;
BEGIN
  FOR workflow_rec IN 
    SELECT aw.id 
    FROM public.approval_workflows aw 
    WHERE aw.organization_id = p_org_id 
      AND aw.is_active = true 
      AND aw.is_default = false 
    ORDER BY (
      SELECT COALESCE(MIN(r.priority), 999999) 
      FROM public.approval_workflow_rules r 
      WHERE r.workflow_id = aw.id
    )
  LOOP
    IF evaluate_workflow_rules(workflow_rec.id, p_project_data) THEN 
      RETURN workflow_rec.id; 
    END IF;
  END LOOP;
  
  SELECT aw2.id INTO matching_wf_id 
  FROM public.approval_workflows aw2 
  WHERE aw2.organization_id = p_org_id 
    AND aw2.is_active = true 
    AND aw2.is_default = true 
  LIMIT 1;
  
  RETURN matching_wf_id;
END;
$$;

-- advance_workflow_through_conditions
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
    
    IF v_node_type != 'condition' THEN 
      EXIT; 
    END IF;
    
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

-- find_next_node
CREATE OR REPLACE FUNCTION find_next_node(
  p_workflow_id uuid, 
  p_current_node_id text, 
  p_condition_result boolean DEFAULT NULL
)
RETURNS text 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public' 
AS $$
DECLARE 
  v_edge jsonb; 
  v_source_handle text;
BEGIN
  IF p_condition_result IS NOT NULL THEN 
    v_source_handle := CASE WHEN p_condition_result THEN 'true' ELSE 'false' END; 
  END IF;
  
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

-- record_approval_action
CREATE OR REPLACE FUNCTION record_approval_action(
  p_approval_id uuid, 
  p_node_id text, 
  p_step_name text, 
  p_user_id uuid, 
  p_role_id uuid, 
  p_action text, 
  p_comments text, 
  p_metadata jsonb
)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public' 
AS $$
BEGIN
  INSERT INTO public.project_approval_history (
    project_approval_id, 
    node_id, 
    step_name, 
    user_id, 
    role_id, 
    action, 
    comments, 
    metadata
  )
  VALUES (
    p_approval_id, 
    p_node_id, 
    p_step_name, 
    p_user_id, 
    p_role_id, 
    p_action::approval_action, 
    p_comments, 
    p_metadata
  );
END;
$$;

-- notify_approvers_at_node
CREATE OR REPLACE FUNCTION notify_approvers_at_node(p_approval_id uuid, p_node_id text)
RETURNS void
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public' 
AS $$
DECLARE 
  v_workflow_id uuid; 
  v_node_config jsonb; 
  v_role_id uuid;
BEGIN
  SELECT pa.workflow_id 
  INTO v_workflow_id 
  FROM public.project_approvals pa 
  WHERE pa.id = p_approval_id;
  
  SELECT node INTO v_node_config 
  FROM public.approval_workflow_canvas c, 
       jsonb_array_elements(c.nodes) as node 
  WHERE c.workflow_id = v_workflow_id 
    AND node->>'id' = p_node_id;
  
  IF v_node_config->>'type' = 'approval' THEN
    FOR v_role_id IN 
      SELECT (role_element->>'id')::uuid 
      FROM jsonb_array_elements(v_node_config->'data'->'roles') as role_element
    LOOP
      INSERT INTO public.approval_notifications (
        project_approval_id, 
        user_id, 
        notification_type, 
        title, 
        message, 
        link
      )
      SELECT 
        p_approval_id, 
        ura.user_id, 
        'pending_approval', 
        'Approval Required', 
        'A project requires your approval', 
        '/approvals'
      FROM public.user_role_assignments ura 
      WHERE ura.role_id = v_role_id 
        AND ura.is_active = true;
    END LOOP;
  END IF;
END;
$$;