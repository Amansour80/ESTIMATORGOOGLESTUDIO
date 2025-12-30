/*
  # Add User Profile Fields

  1. Changes
    - Add `first_name` column to user_profiles
    - Add `last_name` column to user_profiles
    - Add `phone_number` column to user_profiles
    - Add `position` column to user_profiles (user's position in their organization)

  2. Notes
    - All fields are nullable to allow gradual profile completion
    - Existing `full_name` field is kept for backward compatibility
*/

-- Add new profile fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN first_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN last_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN phone_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'position'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN position text;
  END IF;
END $$;
