/*
  # Fix Function Search Paths

  1. Security Improvements
    - Set search_path to empty string for security functions
    - Prevents search path manipulation attacks
    - Functions will use fully qualified names

  2. Functions Fixed
    - get_organization_user_ids
    - generate_inquiry_number
    - update_inquiries_updated_at
    - validate_project_status_transition
    - find_user_by_email
    - update_updated_at_column
    - create_organization_for_new_user
    - is_super_admin
    - handle_new_user
    - get_user_emails
    - handle_new_user_complete
    - get_organization_members_with_emails
*/

-- Fix search path for functions with parameters
ALTER FUNCTION get_organization_user_ids(input_user_id uuid) SET search_path = '';
ALTER FUNCTION find_user_by_email(search_email text) SET search_path = '';
ALTER FUNCTION is_super_admin(check_user_id uuid) SET search_path = '';
ALTER FUNCTION get_organization_members_with_emails(org_id uuid) SET search_path = '';
ALTER FUNCTION get_user_emails(user_ids uuid[]) SET search_path = '';

-- Fix search path for functions without parameters
ALTER FUNCTION generate_inquiry_number() SET search_path = '';
ALTER FUNCTION update_inquiries_updated_at() SET search_path = '';
ALTER FUNCTION validate_project_status_transition() SET search_path = '';
ALTER FUNCTION update_updated_at_column() SET search_path = '';
ALTER FUNCTION create_organization_for_new_user() SET search_path = '';
ALTER FUNCTION handle_new_user() SET search_path = '';
ALTER FUNCTION handle_new_user_complete() SET search_path = '';
