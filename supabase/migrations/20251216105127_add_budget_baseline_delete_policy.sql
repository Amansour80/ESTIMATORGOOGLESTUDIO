/*
  # Add Delete Policy for Budget Baselines

  1. Changes
    - Add DELETE policy to budget_baselines table
    - Only project managers and admins can delete budget baselines
  
  2. Security
    - Checks if user is a project member with manager or admin role
    - Ensures only authorized users can delete budgets
*/

-- Add delete policy for budget baselines
CREATE POLICY "Project managers can delete budget baselines"
  ON budget_baselines FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.retrofit_project_id = budget_baselines.project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('manager', 'admin')
    )
  );
