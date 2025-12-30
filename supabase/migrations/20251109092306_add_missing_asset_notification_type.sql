/*
  # Add Missing Asset Library Notification Type

  ## Changes
  - Drops and recreates the notification type constraint to include 'missing_asset_library'
  - This allows notifications when assets are imported with low confidence matches

  ## Security
  - No RLS changes needed
*/

-- Drop the existing constraint
ALTER TABLE public.user_notifications 
DROP CONSTRAINT IF EXISTS valid_notification_type;

-- Recreate with the new type
ALTER TABLE public.user_notifications
ADD CONSTRAINT valid_notification_type CHECK (
  notification_type IN (
    'approval_approved',
    'approval_rejected', 
    'revision_requested',
    'submitted_for_approval',
    'approval_required',
    'missing_asset_library'
  )
);