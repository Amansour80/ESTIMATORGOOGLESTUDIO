/*
  # Add Missing Foreign Key Indexes

  1. Performance Improvements
    - Add indexes on foreign key columns to improve join performance
    - Covers organization_id foreign keys across multiple tables
    - Covers invited_by and created_by foreign keys

  2. Tables Affected
    - org_cleaners: Add index on organization_id
    - org_fm_technicians: Add index on organization_id
    - org_retrofit_labor: Add index on organization_id
    - organization_members: Add index on invited_by
    - user_profiles: Add index on created_by
*/

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

-- Add index for user_profiles.created_by
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_by 
ON user_profiles(created_by);
