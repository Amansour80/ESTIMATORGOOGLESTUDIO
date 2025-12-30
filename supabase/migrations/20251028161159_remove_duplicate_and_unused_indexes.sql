/*
  # Remove Duplicate and Unused Indexes

  1. Duplicate Index Removal
    - Remove idx_retrofit_projects_updated_at (duplicate of idx_retrofit_projects_updated)

  2. Unused Index Removal
    - Remove unused indexes that are not being utilized by queries
    - This improves write performance and reduces storage

  3. Indexes Removed
    - Subscription and project status indexes (unused)
    - Industry standard library indexes (unused)
    - Inquiry indexes (unused)
    - Duplicate retrofit project index
*/

-- Remove duplicate index
DROP INDEX IF EXISTS idx_retrofit_projects_updated_at;

-- Remove unused indexes
DROP INDEX IF EXISTS idx_subscriptions_status;
DROP INDEX IF EXISTS idx_sfg20_assets_code;
DROP INDEX IF EXISTS idx_fm_projects_status;
DROP INDEX IF EXISTS idx_retrofit_projects_status;
DROP INDEX IF EXISTS idx_hk_projects_status;
DROP INDEX IF EXISTS idx_hk_projects_created_at;
DROP INDEX IF EXISTS idx_hk_projects_user_status;
DROP INDEX IF EXISTS idx_fm_projects_created_at;
DROP INDEX IF EXISTS idx_fm_projects_user_status;
DROP INDEX IF EXISTS idx_retrofit_projects_created_at;
DROP INDEX IF EXISTS idx_retrofit_projects_user_status;
DROP INDEX IF EXISTS idx_retrofit_projects_estimation_mode;
DROP INDEX IF EXISTS idx_retrofit_projects_boq_line_items;
DROP INDEX IF EXISTS idx_inquiries_deadline;
DROP INDEX IF EXISTS idx_inquiries_assigned_to;
DROP INDEX IF EXISTS idx_inquiries_created_by;
DROP INDEX IF EXISTS idx_inquiries_project_type;
