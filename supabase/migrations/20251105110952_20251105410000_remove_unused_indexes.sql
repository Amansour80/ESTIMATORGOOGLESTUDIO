/*
  # Remove Unused Indexes

  1. Problem
    - Many indexes are not being used by queries
    - Unused indexes consume storage and slow down writes
    - They add maintenance overhead without providing benefits

  2. Solution
    - Remove indexes that have not been used
    - Keep only indexes that are actively improving query performance

  3. Impact
    - Reduces storage usage
    - Improves INSERT/UPDATE/DELETE performance
    - Reduces index maintenance overhead
*/

-- Remove unused approval history indexes
DROP INDEX IF EXISTS idx_approval_history_user_id;
DROP INDEX IF EXISTS idx_approval_history_action;
DROP INDEX IF EXISTS idx_approval_history_action_date;
DROP INDEX IF EXISTS idx_approval_history_node;

-- Remove unused project approvals indexes
DROP INDEX IF EXISTS idx_project_approvals_organization_id;
DROP INDEX IF EXISTS idx_project_approvals_status;
DROP INDEX IF EXISTS idx_project_approvals_submitted_by;

-- Remove unused approval notifications indexes
DROP INDEX IF EXISTS idx_approval_notifications_user_id;
DROP INDEX IF EXISTS idx_approval_notifications_unread;
DROP INDEX IF EXISTS idx_approval_notifications_type;

-- Remove unused workflow rules indexes
DROP INDEX IF EXISTS idx_workflow_rules_workflow_id;
DROP INDEX IF EXISTS idx_workflow_rules_field;

-- Remove unused organization labor indexes
DROP INDEX IF EXISTS idx_org_retrofit_labor_organization_id;
DROP INDEX IF EXISTS idx_org_cleaners_organization_id;
DROP INDEX IF EXISTS idx_org_fm_technicians_organization_id;

-- Remove unused organization members index
DROP INDEX IF EXISTS idx_organization_members_invited_by;

-- Remove unused user profiles indexes
DROP INDEX IF EXISTS idx_user_profiles_created_by;
DROP INDEX IF EXISTS idx_user_profiles_theme_preference;

-- Remove unused user role assignments indexes
DROP INDEX IF EXISTS idx_user_role_assignments_user_id;
DROP INDEX IF EXISTS idx_user_role_assignments_active;

-- Remove unused inquiries index
DROP INDEX IF EXISTS idx_inquiries_client_reference;

-- Remove unused organization roles indexes
DROP INDEX IF EXISTS idx_organization_roles_type;
DROP INDEX IF EXISTS idx_organization_roles_active;

-- Remove unused approval workflows index
DROP INDEX IF EXISTS idx_approval_workflows_default;

-- Remove unused project indexes
DROP INDEX IF EXISTS idx_fm_projects_approval_status;
DROP INDEX IF EXISTS idx_fm_projects_locked;
DROP INDEX IF EXISTS idx_retrofit_projects_approval_status;
DROP INDEX IF EXISTS idx_retrofit_projects_locked;
DROP INDEX IF EXISTS idx_hk_projects_approval_status;
DROP INDEX IF EXISTS idx_hk_projects_locked;

-- Remove unused user notifications indexes
DROP INDEX IF EXISTS idx_user_notifications_org_id;
DROP INDEX IF EXISTS idx_user_notifications_created_at;
DROP INDEX IF EXISTS idx_user_notifications_project;