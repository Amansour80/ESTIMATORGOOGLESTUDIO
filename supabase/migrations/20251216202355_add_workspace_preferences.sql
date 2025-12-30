/*
  # Add workspace preferences to user profiles

  1. Changes
    - Add `workspace_preferences` JSONB column to `user_profiles` table
    - Allows users to store customized workspace settings
    - Includes dashboard layout, widget visibility, and interface preferences

  2. Notes
    - Nullable column with default NULL
    - No RLS changes needed (inherits from user_profiles policies)
*/

-- Add workspace preferences column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'workspace_preferences'
  ) THEN
    ALTER TABLE public.user_profiles
    ADD COLUMN workspace_preferences JSONB DEFAULT NULL;
  END IF;
END $$;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_workspace_preferences
ON public.user_profiles USING gin(workspace_preferences);