/*
  # Create Cost Review Workflow System

  This migration creates a configurable review workflow system for actual costs,
  similar to the project approval workflow system.

  ## New Tables

  1. cost_review_workflows
    - id (uuid, primary key)
    - organization_id (uuid, foreign key)
    - name (text)
    - description (text)
    - trigger_conditions (jsonb) - conditions that trigger this workflow
    - is_active (boolean)
    - is_default (boolean)
    - created_by (uuid)
    - created_at (timestamptz)

  2. cost_review_steps
    - id (uuid, primary key)
    - workflow_id (uuid, foreign key)
    - step_order (integer)
    - reviewer_role_id (uuid, foreign key) - which role can review
    - reviewer_user_id (uuid, foreign key) - or specific user
    - require_all_users (boolean) - if role, require all users with that role?
    - created_at (timestamptz)

  3. cost_reviews
    - id (uuid, primary key)
    - actual_cost_id (uuid, foreign key)
    - workflow_id (uuid, foreign key)
    - current_step (integer)
    - status (text) - pending, approved, rejected
    - submitted_by (uuid)
    - submitted_at (timestamptz)
    - completed_at (timestamptz)
    - created_at (timestamptz)

  4. cost_review_history
    - id (uuid, primary key)
    - cost_review_id (uuid, foreign key)
    - step_order (integer)
    - reviewer_user_id (uuid)
    - action (text) - approved, rejected
    - comments (text)
    - action_date (timestamptz)
*/

-- Cost Review Workflows Table
CREATE TABLE IF NOT EXISTS public.cost_review_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL CHECK (length(trim(name)) > 0),
  description text,
  trigger_conditions jsonb DEFAULT '{"min_amount": 0, "cost_types": []}'::jsonb,
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Cost Review Steps Table
CREATE TABLE IF NOT EXISTS public.cost_review_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES public.cost_review_workflows(id) ON DELETE CASCADE NOT NULL,
  step_order integer NOT NULL,
  reviewer_role_id uuid REFERENCES public.organization_roles(id) ON DELETE CASCADE,
  reviewer_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  require_all_users boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT must_have_role_or_user CHECK (
    (reviewer_role_id IS NOT NULL AND reviewer_user_id IS NULL) OR
    (reviewer_role_id IS NULL AND reviewer_user_id IS NOT NULL)
  )
);

-- Cost Reviews Table
CREATE TABLE IF NOT EXISTS public.cost_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actual_cost_id uuid REFERENCES public.actual_costs(id) ON DELETE CASCADE NOT NULL UNIQUE,
  workflow_id uuid REFERENCES public.cost_review_workflows(id) ON DELETE CASCADE NOT NULL,
  current_step integer DEFAULT 1,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_by uuid REFERENCES auth.users(id) NOT NULL,
  submitted_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Cost Review History Table
CREATE TABLE IF NOT EXISTS public.cost_review_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cost_review_id uuid REFERENCES public.cost_reviews(id) ON DELETE CASCADE NOT NULL,
  step_order integer NOT NULL,
  reviewer_user_id uuid REFERENCES auth.users(id) NOT NULL,
  action text NOT NULL CHECK (action IN ('approved', 'rejected')),
  comments text,
  action_date timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cost_review_workflows_org ON public.cost_review_workflows(organization_id);
CREATE INDEX IF NOT EXISTS idx_cost_review_steps_workflow ON public.cost_review_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_cost_reviews_cost ON public.cost_reviews(actual_cost_id);
CREATE INDEX IF NOT EXISTS idx_cost_reviews_status ON public.cost_reviews(status);
CREATE INDEX IF NOT EXISTS idx_cost_review_history_review ON public.cost_review_history(cost_review_id);

-- RLS Policies

-- Cost Review Workflows
ALTER TABLE public.cost_review_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members can view cost review workflows"
ON public.cost_review_workflows FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = cost_review_workflows.organization_id
    AND om.user_id = auth.uid()
  )
);

CREATE POLICY "Organization admins can manage cost review workflows"
ON public.cost_review_workflows FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = cost_review_workflows.organization_id
    AND om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = cost_review_workflows.organization_id
    AND om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
  )
);

-- Cost Review Steps
ALTER TABLE public.cost_review_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members can view cost review steps"
ON public.cost_review_steps FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.cost_review_workflows w
    INNER JOIN public.organization_members om ON om.organization_id = w.organization_id
    WHERE w.id = cost_review_steps.workflow_id
    AND om.user_id = auth.uid()
  )
);

CREATE POLICY "Organization admins can manage cost review steps"
ON public.cost_review_steps FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.cost_review_workflows w
    INNER JOIN public.organization_members om ON om.organization_id = w.organization_id
    WHERE w.id = cost_review_steps.workflow_id
    AND om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.cost_review_workflows w
    INNER JOIN public.organization_members om ON om.organization_id = w.organization_id
    WHERE w.id = cost_review_steps.workflow_id
    AND om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
  )
);

-- Cost Reviews
ALTER TABLE public.cost_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view cost reviews"
ON public.cost_reviews FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.actual_costs ac
    INNER JOIN public.project_members pm ON pm.retrofit_project_id = ac.project_id
    WHERE ac.id = cost_reviews.actual_cost_id
    AND pm.user_id = auth.uid()
  )
);

CREATE POLICY "Project members can create cost reviews"
ON public.cost_reviews FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.actual_costs ac
    INNER JOIN public.project_members pm ON pm.retrofit_project_id = ac.project_id
    WHERE ac.id = cost_reviews.actual_cost_id
    AND pm.user_id = auth.uid()
  )
  AND submitted_by = auth.uid()
);

CREATE POLICY "Reviewers can update cost reviews"
ON public.cost_reviews FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.actual_costs ac
    INNER JOIN public.project_members pm ON pm.retrofit_project_id = ac.project_id
    WHERE ac.id = cost_reviews.actual_cost_id
    AND pm.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.actual_costs ac
    INNER JOIN public.project_members pm ON pm.retrofit_project_id = ac.project_id
    WHERE ac.id = cost_reviews.actual_cost_id
    AND pm.user_id = auth.uid()
  )
);

-- Cost Review History
ALTER TABLE public.cost_review_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view cost review history"
ON public.cost_review_history FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.cost_reviews cr
    INNER JOIN public.actual_costs ac ON ac.id = cr.actual_cost_id
    INNER JOIN public.project_members pm ON pm.retrofit_project_id = ac.project_id
    WHERE cr.id = cost_review_history.cost_review_id
    AND pm.user_id = auth.uid()
  )
);

CREATE POLICY "Reviewers can create cost review history"
ON public.cost_review_history FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.cost_reviews cr
    INNER JOIN public.actual_costs ac ON ac.id = cr.actual_cost_id
    INNER JOIN public.project_members pm ON pm.retrofit_project_id = ac.project_id
    WHERE cr.id = cost_review_history.cost_review_id
    AND pm.user_id = auth.uid()
  )
  AND reviewer_user_id = auth.uid()
);

-- Helper Functions

-- Function to find matching workflow for a cost
CREATE OR REPLACE FUNCTION public.find_matching_cost_review_workflow(
  p_organization_id uuid,
  p_cost_amount numeric,
  p_cost_type text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workflow_id uuid;
BEGIN
  SELECT w.id INTO v_workflow_id
  FROM public.cost_review_workflows w
  WHERE w.organization_id = p_organization_id
  AND w.is_active = true
  AND p_cost_amount >= COALESCE((w.trigger_conditions->>'min_amount')::numeric, 0)
  AND (
    jsonb_array_length(w.trigger_conditions->'cost_types') = 0
    OR p_cost_type = ANY(
      SELECT jsonb_array_elements_text(w.trigger_conditions->'cost_types')
    )
  )
  ORDER BY 
    COALESCE((w.trigger_conditions->>'min_amount')::numeric, 0) DESC,
    w.is_default DESC
  LIMIT 1;
  
  RETURN v_workflow_id;
END;
$$;

-- Function to check if user can review at current step
CREATE OR REPLACE FUNCTION public.can_user_review_cost(
  p_cost_review_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_step integer;
  v_workflow_id uuid;
  v_can_review boolean := false;
BEGIN
  SELECT cr.current_step, cr.workflow_id
  INTO v_current_step, v_workflow_id
  FROM public.cost_reviews cr
  WHERE cr.id = p_cost_review_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  SELECT EXISTS (
    SELECT 1 FROM public.cost_review_steps crs
    WHERE crs.workflow_id = v_workflow_id
    AND crs.step_order = v_current_step
    AND (
      crs.reviewer_user_id = p_user_id
      OR EXISTS (
        SELECT 1 FROM public.user_role_assignments ura
        WHERE ura.user_id = p_user_id
        AND ura.role_id = crs.reviewer_role_id
        AND ura.is_active = true
      )
    )
  ) INTO v_can_review;
  
  RETURN v_can_review;
END;
$$;

-- Function to process review action
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
      SET status = 'reviewed', reviewed_by = p_user_id, reviewed_at = now()
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

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.cost_reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cost_review_history;
