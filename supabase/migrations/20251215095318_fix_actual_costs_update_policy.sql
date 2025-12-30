/*
  # Fix Actual Costs Update Policy

  This migration fixes the RLS policy for updating actual costs to allow users to update their own cost entries,
  including submitting them for review.

  ## Changes

  1. Drop and recreate the UPDATE policy with proper WITH CHECK clause
  2. Allow cost creators to update their costs
  3. Allow managers/admins to update any costs in their projects
*/

-- Drop the existing update policy
DROP POLICY IF EXISTS "Project members can update their own costs" ON public.actual_costs;

-- Recreate with proper WITH CHECK clause
CREATE POLICY "Project members can update their own costs"
ON public.actual_costs
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.retrofit_project_id = actual_costs.project_id
    AND pm.user_id = auth.uid()
  )
  AND (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.retrofit_project_id = actual_costs.project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('manager', 'admin')
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.retrofit_project_id = actual_costs.project_id
    AND pm.user_id = auth.uid()
  )
);

-- Add comment
COMMENT ON POLICY "Project members can update their own costs" ON public.actual_costs IS 
'Allows cost creators to update their own costs, and managers/admins to update any costs in their projects';
