/*
  # Add DELETE policy for user_notifications

  1. Changes
    - Add RLS policy to allow users to delete their own notifications
  
  2. Security
    - Users can only delete notifications where they are the owner (user_id matches)
*/

CREATE POLICY "Users can delete own notifications"
  ON user_notifications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
