/*
  # Fix Cost Review Column Names
  
  ## Changes
  
  The process_cost_review_action function was using incorrect column names.
  The actual_costs table has `approved_by` and `approved_at` columns,
  not `reviewed_by` and `reviewed_at`.
  
  This migration fixes the function to use the correct column names.
*/

CREATE OR REPLACE FUNCTION public.process_cost_review_action(
  p_cost_review_id uuid,
  p_user_id uuid,
  p_action text,
  p_comments text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_step integer;
  v_workflow_id uuid;
  v_total_steps integer;
  v_actual_cost_id uuid;
  v_result jsonb;
BEGIN
  -- Check if user can review
  IF NOT public.can_user_review_cost(p_cost_review_id, p_user_id) THEN
    RAISE EXCEPTION 'User does not have permission to review this cost';
  END IF;
  
  -- Get review details
  SELECT cr.current_step, cr.workflow_id, cr.actual_cost_id
  INTO v_current_step, v_workflow_id, v_actual_cost_id
  FROM public.cost_reviews cr
  WHERE cr.id = p_cost_review_id;
  
  -- Count total steps
  SELECT COUNT(*) INTO v_total_steps
  FROM public.cost_review_steps
  WHERE workflow_id = v_workflow_id;
  
  -- Record the action
  INSERT INTO public.cost_review_history (
    cost_review_id,
    step_order,
    reviewer_user_id,
    action,
    comments
  ) VALUES (
    p_cost_review_id,
    v_current_step,
    p_user_id,
    p_action,
    p_comments
  );
  
  -- Handle rejection
  IF p_action = 'rejected' THEN
    UPDATE public.cost_reviews
    SET status = 'rejected', completed_at = now()
    WHERE id = p_cost_review_id;
    
    UPDATE public.actual_costs
    SET status = 'rejected'
    WHERE id = v_actual_cost_id;
    
    v_result := jsonb_build_object('status', 'rejected', 'completed', true);
  
  -- Handle approval
  ELSIF p_action = 'approved' THEN
    IF v_current_step >= v_total_steps THEN
      -- Final approval
      UPDATE public.cost_reviews
      SET status = 'approved', completed_at = now()
      WHERE id = p_cost_review_id;
      
      UPDATE public.actual_costs
      SET status = 'reviewed', approved_by = p_user_id, approved_at = now()
      WHERE id = v_actual_cost_id;
      
      v_result := jsonb_build_object('status', 'approved', 'completed', true);
    ELSE
      -- Move to next step
      UPDATE public.cost_reviews
      SET current_step = v_current_step + 1
      WHERE id = p_cost_review_id;
      
      v_result := jsonb_build_object(
        'status', 'pending',
        'completed', false,
        'current_step', v_current_step + 1
      );
    END IF;
  END IF;
  
  RETURN v_result;
END;
$$;
