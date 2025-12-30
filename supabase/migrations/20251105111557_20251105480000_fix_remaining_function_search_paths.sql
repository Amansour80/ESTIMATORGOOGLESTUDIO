/*
  # Fix Remaining Function Search Paths

  1. Problem
    - Some functions still have mutable search paths
    - This is a security vulnerability

  2. Solution
    - Set search_path to empty string for remaining functions

  3. Functions Fixed
    - seed_default_roles
    - get_project_approval_status
    - get_user_approval_activity
    - notify_users_with_role
*/

DO $$
DECLARE
  func RECORD;
  func_signature TEXT;
BEGIN
  -- Fix all remaining functions with mutable search paths
  FOR func IN 
    SELECT 
      p.proname as name,
      pg_get_function_identity_arguments(p.oid) as args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname IN (
      'seed_default_roles',
      'get_project_approval_status',
      'get_user_approval_activity',
      'notify_users_with_role'
    )
  LOOP
    func_signature := func.name || '(' || func.args || ')';
    BEGIN
      EXECUTE format('ALTER FUNCTION %s SET search_path = ''''', func_signature);
      RAISE NOTICE 'Fixed function: %', func_signature;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Could not fix function %: %', func_signature, SQLERRM;
    END;
  END LOOP;
END$$;