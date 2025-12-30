/*
  # Fix Function Search Paths

  1. Problem
    - Many functions have role mutable search_path
    - This is a security risk that allows search path manipulation

  2. Solution
    - Set search_path to empty string for all existing functions
    - This prevents search_path injection attacks
*/

-- Fix all functions at once using dynamic SQL
DO $$
DECLARE
  func RECORD;
  func_signature TEXT;
BEGIN
  FOR func IN 
    SELECT 
      p.proname as name,
      pg_get_function_identity_arguments(p.oid) as args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname IN (
      'update_organization_roles_updated_at',
      'create_default_roles_for_new_org',
      'get_user_approval_roles',
      'user_has_approval_permission',
      'update_approval_workflows_updated_at',
      'ensure_single_default_workflow',
      'get_active_workflows',
      'get_default_workflow',
      'update_workflow_canvas_updated_at',
      'get_workflow_canvas',
      'update_project_approvals_updated_at',
      'get_pending_approvals_for_user',
      'get_approval_timeline',
      'calculate_average_approval_time',
      'set_notification_read_at',
      'create_approval_notification',
      'get_unread_notification_count',
      'mark_all_notifications_read',
      'get_recent_notifications',
      'create_notification',
      'mark_notification_read',
      'sync_project_approval_status',
      'get_projects_pending_approval',
      'start_approval_workflow',
      'process_approval_action',
      'record_approval_action',
      'advance_workflow_through_conditions',
      'evaluate_workflow_rules',
      'find_matching_workflow',
      'can_edit_project',
      'get_next_node',
      'can_user_approve_at_node'
    )
  LOOP
    func_signature := func.name || '(' || func.args || ')';
    EXECUTE format('ALTER FUNCTION %s SET search_path = ''''', func_signature);
    RAISE NOTICE 'Fixed function: %', func_signature;
  END LOOP;
END$$;