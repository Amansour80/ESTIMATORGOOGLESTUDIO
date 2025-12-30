/*
  # Remove Duplicate can_user_approve_at_node Function
  
  1. Problem
    - Two versions of can_user_approve_at_node exist:
      - Old: (p_user_id uuid, p_approval_id uuid, p_node_id text)
      - New: (p_approval_id uuid, p_user_id uuid)
    - This causes ambiguity and RPC call failures
  
  2. Solution
    - Drop the old 3-parameter version
    - Keep only the 2-parameter version
*/

-- Drop the old 3-parameter version
DROP FUNCTION IF EXISTS public.can_user_approve_at_node(uuid, uuid, text);

-- Ensure the 2-parameter version exists with correct implementation
CREATE OR REPLACE FUNCTION public.can_user_approve_at_node(
  p_approval_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_workflow_id uuid;
  v_current_node_id text;
  v_node_type text;
  v_node_roles jsonb;
  v_can_approve boolean := false;
BEGIN
  -- Get workflow ID and current node from approval
  SELECT workflow_id, current_node_id
  INTO v_workflow_id, v_current_node_id
  FROM public.project_approvals
  WHERE id = p_approval_id;
  
  -- If no current node, can't approve
  IF v_current_node_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get node details
  SELECT 
    node->>'type',
    node->'data'->'roles'
  INTO v_node_type, v_node_roles
  FROM public.approval_workflow_canvas c,
       jsonb_array_elements(c.nodes) as node
  WHERE c.workflow_id = v_workflow_id
    AND node->>'id' = v_current_node_id;
  
  -- Only approval nodes require user action
  IF v_node_type != 'approval' THEN
    RETURN false;
  END IF;
  
  -- Check if user has any of the required roles
  SELECT EXISTS (
    SELECT 1
    FROM public.user_role_assignments ura
    CROSS JOIN jsonb_array_elements(v_node_roles) as role_obj
    WHERE ura.user_id = p_user_id
      AND ura.role_id = (role_obj->>'id')::uuid
      AND ura.is_active = true
  ) INTO v_can_approve;
  
  RETURN v_can_approve;
END;
$$;
