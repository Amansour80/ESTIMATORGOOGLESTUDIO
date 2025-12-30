/*
  # Remove Newly Unused Indexes

  1. Problem
    - Several indexes from our previous migration are still not being used
    - Unused indexes consume storage and slow down writes

  2. Solution
    - Remove indexes that have not been used by any queries

  3. Indexes Removed
    - idx_project_approval_history_role_id
    - idx_approval_workflows_created_by
    - idx_fm_projects_approved_by
    - idx_retrofit_projects_approved_by
    - idx_hk_projects_approved_by
    - idx_inquiries_assigned_to
    - idx_inquiries_created_by
    - idx_organization_roles_created_by
    - idx_user_role_assignments_assigned_by
*/

-- Remove unused indexes
DROP INDEX IF EXISTS idx_project_approval_history_role_id;
DROP INDEX IF EXISTS idx_approval_workflows_created_by;
DROP INDEX IF EXISTS idx_fm_projects_approved_by;
DROP INDEX IF EXISTS idx_retrofit_projects_approved_by;
DROP INDEX IF EXISTS idx_hk_projects_approved_by;
DROP INDEX IF EXISTS idx_inquiries_assigned_to;
DROP INDEX IF EXISTS idx_inquiries_created_by;
DROP INDEX IF EXISTS idx_organization_roles_created_by;
DROP INDEX IF EXISTS idx_user_role_assignments_assigned_by;