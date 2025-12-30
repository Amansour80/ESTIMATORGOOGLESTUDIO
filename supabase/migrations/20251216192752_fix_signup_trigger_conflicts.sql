/*
  # Fix Signup Trigger Conflicts

  1. Problem
    - Two conflicting triggers on organizations table:
      * create_default_roles_on_org_creation (old system)
      * trigger_create_system_roles (new system)
    - The old trigger calls seed_default_roles() which conflicts with the new role system
    - This causes signup failures when creating organizations
    
  2. Solution
    - Drop the old trigger and function
    - Keep only the new system (create_system_roles_for_organization)
    - Ensure new users can sign up successfully
    
  3. Changes
    - DROP old trigger: create_default_roles_on_org_creation
    - DROP old function: create_default_roles_for_new_org
    - DROP old function: seed_default_roles
    - Keep new trigger: trigger_create_system_roles
*/

-- Drop the old trigger
DROP TRIGGER IF EXISTS create_default_roles_on_org_creation ON public.organizations;

-- Drop the old functions
DROP FUNCTION IF EXISTS public.create_default_roles_for_new_org();
DROP FUNCTION IF EXISTS public.seed_default_roles(uuid);

-- Verify that the new trigger is still active
-- (No action needed - just documenting that trigger_create_system_roles should remain)
