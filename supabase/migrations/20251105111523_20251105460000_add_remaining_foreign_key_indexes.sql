/*
  # Add Remaining Foreign Key Indexes

  1. Problem
    - Additional foreign keys still lack covering indexes
    - These are causing suboptimal query performance

  2. Solution
    - Add indexes for all remaining unindexed foreign keys

  3. Tables Affected
    - approval_notifications (user_id)
    - org_cleaners (organization_id)
    - org_fm_technicians (organization_id)
    - org_retrofit_labor (organization_id)
    - organization_members (invited_by)
    - project_approval_history (user_id)
    - project_approvals (organization_id, submitted_by)
    - user_notifications (organization_id)
    - user_profiles (created_by)
*/

-- Add index for approval_notifications.user_id
CREATE INDEX IF NOT EXISTS idx_approval_notifications_user_id 
ON approval_notifications(user_id);

-- Add index for org_cleaners.organization_id
CREATE INDEX IF NOT EXISTS idx_org_cleaners_organization_id 
ON org_cleaners(organization_id);

-- Add index for org_fm_technicians.organization_id
CREATE INDEX IF NOT EXISTS idx_org_fm_technicians_organization_id 
ON org_fm_technicians(organization_id);

-- Add index for org_retrofit_labor.organization_id
CREATE INDEX IF NOT EXISTS idx_org_retrofit_labor_organization_id 
ON org_retrofit_labor(organization_id);

-- Add index for organization_members.invited_by
CREATE INDEX IF NOT EXISTS idx_organization_members_invited_by 
ON organization_members(invited_by);

-- Add index for project_approval_history.user_id
CREATE INDEX IF NOT EXISTS idx_project_approval_history_user_id 
ON project_approval_history(user_id);

-- Add index for project_approvals.organization_id
CREATE INDEX IF NOT EXISTS idx_project_approvals_organization_id 
ON project_approvals(organization_id);

-- Add index for project_approvals.submitted_by
CREATE INDEX IF NOT EXISTS idx_project_approvals_submitted_by 
ON project_approvals(submitted_by);

-- Add index for user_notifications.organization_id
CREATE INDEX IF NOT EXISTS idx_user_notifications_organization_id 
ON user_notifications(organization_id);

-- Add index for user_profiles.created_by
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_by 
ON user_profiles(created_by);