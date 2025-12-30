/*
  # Create Pricing Configuration Table

  1. New Table
    - `pricing_config`
      - `id` (uuid, primary key) - Unique identifier
      - `plan` (text) - Plan name (free, starter, professional, enterprise)
      - `monthly_price` (decimal) - Monthly price in USD
      - `annual_price` (decimal) - Annual price in USD
      - `user_limit` (integer) - Maximum users allowed
      - `is_active` (boolean) - Whether this pricing is currently active
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
  
  2. Security
    - Enable RLS on pricing_config table
    - Anyone can read pricing (for displaying on pricing page)
    - Only super admins can update pricing

  3. Initial Data
    - Insert default pricing for all plans
*/

-- Create pricing_config table
CREATE TABLE IF NOT EXISTS pricing_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan text NOT NULL UNIQUE CHECK (plan IN ('free', 'starter', 'professional', 'enterprise')),
  monthly_price decimal NOT NULL DEFAULT 0,
  annual_price decimal NOT NULL DEFAULT 0,
  user_limit integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;

-- Anyone can read pricing (including anonymous users for the pricing page)
CREATE POLICY "Anyone can read pricing config"
  ON pricing_config FOR SELECT
  TO public
  USING (true);

-- Only super admins can update pricing
CREATE POLICY "Super admins can update pricing"
  ON pricing_config FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE user_id = auth.uid()
    )
  );

-- Only super admins can insert pricing
CREATE POLICY "Super admins can insert pricing"
  ON pricing_config FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_pricing_config_updated_at
  BEFORE UPDATE ON pricing_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default pricing
INSERT INTO pricing_config (plan, monthly_price, annual_price, user_limit) VALUES
  ('free', 0, 0, 1),
  ('starter', 49, 470, 5),
  ('professional', 149, 1430, 20),
  ('enterprise', 499, 4790, 100)
ON CONFLICT (plan) DO NOTHING;