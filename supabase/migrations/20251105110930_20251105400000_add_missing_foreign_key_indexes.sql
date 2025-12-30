/*
  # Add Missing Foreign Key Indexes

  1. Problem
    - Multiple foreign keys lack covering indexes, causing suboptimal query performance
    - Database must perform full table scans when joining on these foreign keys

  2. Solution
    - Add indexes for all unindexed foreign keys
    - This improves JOIN performance and referential integrity checks

  3. Tables Affected
    - approval_workflows (created_by)
    - fm_projects (approved_by)
    - hk_projects (approved_by)
    - inquiries (assigned_to, created_by)
    - organization_roles (created_by)
    - project_approval_history (role_id)
    - retrofit_projects (approved_by)
    - user_role_assignments (assigned_by)
*/

-- Add index for approval_workflows.created_by
CREATE INDEX IF NOT EXISTS idx_approval_workflows_created_by 
ON approval_workflows(created_by);

-- Add index for fm_projects.approved_by
CREATE INDEX IF NOT EXISTS idx_fm_projects_approved_by 
ON fm_projects(approved_by);

-- Add index for hk_projects.approved_by
CREATE INDEX IF NOT EXISTS idx_hk_projects_approved_by 
ON hk_projects(approved_by);

-- Add index for inquiries.assigned_to
CREATE INDEX IF NOT EXISTS idx_inquiries_assigned_to 
ON inquiries(assigned_to);

-- Add index for inquiries.created_by
CREATE INDEX IF NOT EXISTS idx_inquiries_created_by 
ON inquiries(created_by);

-- Add index for organization_roles.created_by
CREATE INDEX IF NOT EXISTS idx_organization_roles_created_by 
ON organization_roles(created_by);

-- Add index for project_approval_history.role_id
CREATE INDEX IF NOT EXISTS idx_project_approval_history_role_id 
ON project_approval_history(role_id);

-- Add index for retrofit_projects.approved_by
CREATE INDEX IF NOT EXISTS idx_retrofit_projects_approved_by 
ON retrofit_projects(approved_by);

-- Add index for user_role_assignments.assigned_by
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_assigned_by 
ON user_role_assignments(assigned_by);