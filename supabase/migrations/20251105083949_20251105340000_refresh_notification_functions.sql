/*
  # Refresh Notification Functions
  
  ## Problem
  Functions that reference pa.organization_id were created before the column existed.
  Need to recreate them to pick up the new schema.
  
  ## Solution
  Drop and recreate process_approval_action and notify_approvers_at_node functions
*/

-- Drop and recreate process_approval_action
DROP FUNCTION IF EXISTS process_approval_action(uuid, uuid, text, text, uuid);

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
  v_project_id uuid;
  v_project_type text;
  v_project_name text;
  v_organization_id uuid;
  v_submitter_id uuid;
  v_approver_name text;
BEGIN
  -- Verify user can approve
  IF NOT can_user_approve_at_node(p_approval_id, p_user_id) THEN
    RAISE EXCEPTION 'User does not have permission to approve at this step';
  END IF;
  
  -- Get current state and project info
  SELECT 
    pa.current_node_id, 
    pa.workflow_id,
    pa.project_id,
    pa.project_type,
    pa.organization_id,
    pa.submitted_by,
    CASE 
      WHEN pa.project_type = 'hk' THEN (SELECT project_name FROM hk_projects WHERE id = pa.project_id)
      WHEN pa.project_type = 'fm' THEN (SELECT project_name FROM fm_projects WHERE id = pa.project_id)
      WHEN pa.project_type = 'retrofit' THEN (SELECT project_name FROM retrofit_projects WHERE id = pa.project_id)
    END as project_name
  INTO 
    v_current_node_id, 
    v_workflow_id,
    v_project_id,
    v_project_type,
    v_organization_id,
    v_submitter_id,
    v_project_name
  FROM project_approvals pa
  WHERE pa.id = p_approval_id;
  
  -- Get approver name
  SELECT full_name INTO v_approver_name
  FROM user_profiles
  WHERE id = p_user_id;
  
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
  
  -- Find next node based on action
  v_next_node_id := find_next_node(v_workflow_id, v_current_node_id, p_action);
  
  -- Handle different approval actions
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
      
      -- Notify estimator that project was approved
      PERFORM create_notification(
        v_submitter_id,
        v_organization_id,
        'approval_approved',
        'Project Approved',
        'Your project "' || v_project_name || '" has been approved by ' || COALESCE(v_approver_name, 'an approver'),
        v_project_id,
        v_project_type,
        v_project_name,
        p_approval_id,
        jsonb_build_object(
          'approver_id', p_user_id,
          'approver_name', v_approver_name,
          'comments', p_comments
        )
      );
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
    -- Mark as rejected
    UPDATE project_approvals
    SET 
      status = 'rejected',
      completed_at = now(),
      updated_at = now()
    WHERE id = p_approval_id;
    
    -- Notify estimator that project was rejected
    PERFORM create_notification(
      v_submitter_id,
      v_organization_id,
      'approval_rejected',
      'Project Rejected',
      'Your project "' || v_project_name || '" has been rejected by ' || COALESCE(v_approver_name, 'an approver'),
      v_project_id,
      v_project_type,
      v_project_name,
      p_approval_id,
      jsonb_build_object(
        'approver_id', p_user_id,
        'approver_name', v_approver_name,
        'comments', p_comments,
        'reason', p_comments
      )
    );
    
  ELSIF p_action = 'revision_requested' THEN
    -- Mark as revision requested
    UPDATE project_approvals
    SET 
      status = 'revision_requested',
      current_node_id = NULL,
      updated_at = now()
    WHERE id = p_approval_id;
    
    -- Notify estimator that revision is requested
    PERFORM create_notification(
      v_submitter_id,
      v_organization_id,
      'revision_requested',
      'Revision Required',
      'Revision requested for project "' || v_project_name || '" by ' || COALESCE(v_approver_name, 'an approver'),
      v_project_id,
      v_project_type,
      v_project_name,
      p_approval_id,
      jsonb_build_object(
        'approver_id', p_user_id,
        'approver_name', v_approver_name,
        'comments', p_comments,
        'revision_notes', p_comments
      )
    );
  END IF;
END;
$$;

-- Drop and recreate notify_approvers_at_node
DROP FUNCTION IF EXISTS notify_approvers_at_node(uuid, text);

CREATE OR REPLACE FUNCTION notify_approvers_at_node(
  p_approval_id uuid,
  p_node_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_role_id uuid;
  v_user_id uuid;
  v_workflow_id uuid;
  v_project_id uuid;
  v_project_type text;
  v_project_name text;
  v_organization_id uuid;
  v_step_name text;
BEGIN
  -- Get workflow and project info
  SELECT 
    pa.workflow_id,
    pa.project_id,
    pa.project_type,
    pa.organization_id,
    CASE 
      WHEN pa.project_type = 'hk' THEN (SELECT project_name FROM hk_projects WHERE id = pa.project_id)
      WHEN pa.project_type = 'fm' THEN (SELECT project_name FROM fm_projects WHERE id = pa.project_id)
      WHEN pa.project_type = 'retrofit' THEN (SELECT project_name FROM retrofit_projects WHERE id = pa.project_id)
    END as project_name
  INTO v_workflow_id, v_project_id, v_project_type, v_organization_id, v_project_name
  FROM project_approvals pa
  WHERE pa.id = p_approval_id;
  
  -- Get step name from node
  SELECT node->'data'->>'stepName' INTO v_step_name
  FROM approval_workflow_canvas awc, jsonb_array_elements(awc.nodes) as node
  WHERE awc.workflow_id = v_workflow_id AND node->>'id' = p_node_id;
  
  -- Get roles assigned to this node
  FOR v_role_id IN
    SELECT (jsonb_array_elements(node->'data'->'roles')->>'id')::uuid
    FROM approval_workflow_canvas awc, jsonb_array_elements(awc.nodes) as node
    WHERE awc.workflow_id = v_workflow_id AND node->>'id' = p_node_id
  LOOP
    -- Get users with this role
    FOR v_user_id IN
      SELECT user_id
      FROM user_role_assignments
      WHERE role_id = v_role_id
        AND is_active = true
    LOOP
      -- Create notification for each approver
      PERFORM create_notification(
        v_user_id,
        v_organization_id,
        'approval_required',
        'Approval Required',
        'Project "' || v_project_name || '" requires your approval at step: ' || COALESCE(v_step_name, 'Approval Step'),
        v_project_id,
        v_project_type,
        v_project_name,
        p_approval_id,
        jsonb_build_object(
          'step_name', v_step_name,
          'node_id', p_node_id
        )
      );
    END LOOP;
  END LOOP;
END;
$$;