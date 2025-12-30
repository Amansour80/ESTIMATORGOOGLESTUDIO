/*
  # Grant Execute Permission for can_user_approve_at_node
  
  1. Problem
    - Function exists but may not be callable via RPC due to missing grants
  
  2. Solution
    - Grant EXECUTE permission to authenticated users
    - Grant EXECUTE permission to anon users (for good measure)
*/

-- Grant execute permissions to authenticated and anon roles
GRANT EXECUTE ON FUNCTION public.can_user_approve_at_node(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_user_approve_at_node(uuid, uuid) TO anon;
