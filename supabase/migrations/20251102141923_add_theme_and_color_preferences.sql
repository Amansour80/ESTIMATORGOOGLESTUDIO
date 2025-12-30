/*
  # Add Theme and Color Preferences to User Profiles

  1. New Columns
    - `theme_preference` (text) - User's theme choice: 'light', 'dark', or 'system'
    - `color_preferences` (jsonb) - Custom color choices per estimator page
      Structure: {
        "hk": "teal",
        "fm": "blue",
        "retrofit": "orange",
        "inquiries": "purple",
        "dashboard": "slate"
      }

  2. Defaults
    - theme_preference: 'system' (follows OS preference)
    - color_preferences: Default color scheme matching current design

  3. Impact
    - Enables per-user theme customization (light/dark/system)
    - Enables per-user color customization for each estimator page
    - Individual preferences, not shared across organization
*/

-- Add theme_preference column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'theme_preference'
  ) THEN
    ALTER TABLE user_profiles 
    ADD COLUMN theme_preference text DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system'));
  END IF;
END $$;

-- Add color_preferences column with default color scheme
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'color_preferences'
  ) THEN
    ALTER TABLE user_profiles 
    ADD COLUMN color_preferences jsonb DEFAULT '{
      "hk": "teal",
      "fm": "blue",
      "retrofit": "orange",
      "inquiries": "purple",
      "dashboard": "slate"
    }'::jsonb;
  END IF;
END $$;

-- Create index for faster theme preference queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_theme_preference 
ON user_profiles(theme_preference);
