/*
  # Remove All Recursive Policies from organization_members

  1. Problem
    - ANY policy that queries organization_members while checking organization_members causes infinite recursion
    - Even the "Members can view other members" policy causes this

  2. Solution
    - Keep ONLY the simple "Users can view their own memberships" policy for SELECT
    - Remove all other SELECT policies that reference the table itself
    - This means users can only see their own membership records
    - The app only needs to see the user's own membership to load their organization

  3. Changes
    - Drop the recursive "Members can view other members" policy
    - Keep only the non-recursive policies
*/

-- Drop the policy that still causes recursion
DROP POLICY IF EXISTS "Members can view other members in their organizations" ON organization_members;

-- The remaining "Users can view their own memberships" policy is sufficient
-- for the getCurrentUserOrganization function to work
