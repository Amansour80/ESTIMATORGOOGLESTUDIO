/*
  # Fix Orphaned Approvals at END Nodes
  
  1. Problem
    - Some approvals have reached END nodes but status is still "pending"
    - These show up incorrectly in pending approval counts
  
  2. Solution
    - Find all pending approvals at END nodes
    - Update their status based on the endType
    - Set completed_at timestamp
*/

-- Update approvals that are at END nodes but still marked as pending
DO $$
DECLARE
  v_approval record;
  v_node jsonb;
  v_node_type text;
  v_end_type text;
  v_new_status text;
BEGIN
  -- Find all pending approvals
  FOR v_approval IN 
    SELECT id, current_node_id, workflow_id
    FROM public.project_approvals
    WHERE status = 'pending'
      AND current_node_id IS NOT NULL
  LOOP
    -- Get the node details
    SELECT node INTO v_node
    FROM public.approval_workflow_canvas awc,
         jsonb_array_elements(awc.nodes) as node
    WHERE awc.workflow_id = v_approval.workflow_id
      AND node->>'id' = v_approval.current_node_id;
    
    -- Check if it's an END node
    IF v_node IS NOT NULL THEN
      v_node_type := v_node->>'type';
      
      IF v_node_type = 'end' THEN
        v_end_type := v_node->'data'->>'endType';
        
        -- Map end type to approval status
        CASE v_end_type
          WHEN 'approved' THEN v_new_status := 'approved';
          WHEN 'rejected' THEN v_new_status := 'rejected';
          WHEN 'revision' THEN v_new_status := 'revision_requested';
          ELSE v_new_status := 'approved';
        END CASE;
        
        -- Update the approval
        UPDATE public.project_approvals
        SET 
          status = v_new_status::approval_status,
          completed_at = COALESCE(completed_at, now()),
          updated_at = now()
        WHERE id = v_approval.id;
        
        RAISE NOTICE 'Fixed approval % - set status to %', v_approval.id, v_new_status;
      END IF;
    END IF;
  END LOOP;
END $$;
