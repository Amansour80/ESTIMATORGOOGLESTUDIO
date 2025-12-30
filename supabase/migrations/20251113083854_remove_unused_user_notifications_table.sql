/*
  # Remove unused user_notifications table
  
  1. Drop user_notifications table (not being used, was added incorrectly)
  2. Notifications should only be for approval workflows via approval_notifications table
  3. Remove related functions that reference user_notifications
*/

-- Drop the user_notifications table if it exists
DROP TABLE IF EXISTS public.user_notifications CASCADE;

-- The correct notifications system uses approval_notifications table only
-- No changes needed to approval_notifications
