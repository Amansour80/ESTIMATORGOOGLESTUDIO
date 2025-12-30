/*
  # Fix get_unread_notification_count function overloads
  
  1. Drop both versions of the function
  2. Recreate single version without parameters (uses auth.uid())
*/

-- Drop both overloaded versions
DROP FUNCTION IF EXISTS public.get_unread_notification_count();
DROP FUNCTION IF EXISTS public.get_unread_notification_count(uuid);

-- Create the correct version that uses auth.uid()
CREATE OR REPLACE FUNCTION public.get_unread_notification_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_count integer;
BEGIN
  -- Return 0 if not authenticated
  IF auth.uid() IS NULL THEN
    RETURN 0;
  END IF;

  -- Count unread notifications
  SELECT COUNT(*)::integer INTO v_count
  FROM public.approval_notifications
  WHERE user_id = auth.uid()
    AND is_read = false;
  
  RETURN COALESCE(v_count, 0);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_unread_notification_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_notification_count() TO anon;
