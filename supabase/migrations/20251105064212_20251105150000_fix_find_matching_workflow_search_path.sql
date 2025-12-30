/*
  # Fix find_matching_workflow Function Search Path

  ## Problem
  The find_matching_workflow function exists but doesn't have the proper search_path set,
  causing "function does not exist" errors when called from other functions.

  ## Solution
  Recreate the function with proper search_path = 'public' setting.
*/

CREATE OR REPLACE FUNCTION find_matching_workflow(
  p_org_id uuid,
  p_project_data jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  workflow_rec RECORD;
  matching_wf_id uuid;
BEGIN
  -- Get all active non-default workflows for the organization
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
    -- Evaluate rules for this workflow
    IF evaluate_workflow_rules(workflow_rec.id, p_project_data) THEN
      RETURN workflow_rec.id;
    END IF;
  END LOOP;
  
  -- If no rules matched, return the default workflow
  SELECT aw2.id INTO matching_wf_id
  FROM public.approval_workflows aw2
  WHERE aw2.organization_id = p_org_id
    AND aw2.is_active = true
    AND aw2.is_default = true
  LIMIT 1;
  
  RETURN matching_wf_id;
END;
$$;
