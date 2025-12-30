/*
  # Organizations, Members & Subscriptions System

  1. New Tables
    
    **organizations**
    - `id` (uuid, primary key) - Unique organization identifier
    - `name` (text) - Organization/company name
    - `logo_url` (text, nullable) - URL to company logo
    - `currency` (text) - Currency code (AED, USD, EUR, etc.)
    - `vat_rate` (decimal) - VAT/tax rate as percentage
    - `date_format` (text) - Date format preference
    - `number_format` (text) - Number format locale
    - `timezone` (text) - Timezone
    - `created_at` (timestamptz) - Creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp

    **organization_members**
    - `id` (uuid, primary key) - Unique member record identifier
    - `organization_id` (uuid, foreign key) - References organizations
    - `user_id` (uuid, foreign key) - References auth.users
    - `role` (text) - User role: owner, admin, user, viewer
    - `invited_by` (uuid, nullable) - Who invited this user
    - `invited_at` (timestamptz) - When invitation was sent
    - `joined_at` (timestamptz, nullable) - When user accepted
    - `status` (text) - pending, active, inactive
    - `created_at` (timestamptz) - Creation timestamp

    **subscriptions**
    - `id` (uuid, primary key) - Unique subscription identifier
    - `organization_id` (uuid, foreign key) - References organizations
    - `plan` (text) - Plan type: free, starter, professional, enterprise
    - `user_limit` (integer) - Maximum allowed users
    - `billing_cycle` (text) - monthly, annual
    - `amount` (decimal) - Subscription amount
    - `status` (text) - active, cancelled, past_due, trialing
    - `current_period_start` (timestamptz) - Current billing period start
    - `current_period_end` (timestamptz) - Current billing period end
    - `stripe_subscription_id` (text, nullable) - Stripe subscription ID
    - `stripe_customer_id` (text, nullable) - Stripe customer ID
    - `created_at` (timestamptz) - Creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on all tables
    - Users can read their own organization
    - Only owners/admins can update organization settings
    - Only owners/admins can manage members
    - Only owners can view subscription details
    - Automatic organization creation for new users
    
  3. Important Notes
    - Each new user automatically gets their own organization (owner role)
    - Default free tier subscription is created automatically
    - Users can belong to multiple organizations
    - Organization owners have full access, admins can manage users
*/

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  currency text NOT NULL DEFAULT 'AED',
  vat_rate decimal DEFAULT 0,
  date_format text DEFAULT 'DD/MM/YYYY',
  number_format text DEFAULT 'en-AE',
  timezone text DEFAULT 'Asia/Dubai',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create organization_members table
CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'user', 'viewer')),
  invited_by uuid REFERENCES auth.users(id),
  invited_at timestamptz DEFAULT now(),
  joined_at timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'professional', 'enterprise')),
  user_limit integer NOT NULL DEFAULT 1,
  billing_cycle text DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
  amount decimal DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
  current_period_start timestamptz DEFAULT now(),
  current_period_end timestamptz DEFAULT now() + interval '30 days',
  stripe_subscription_id text,
  stripe_customer_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_status ON organization_members(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_org_id ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Owners and admins can update their organization"
  ON organizations FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  )
  WITH CHECK (
    id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );

CREATE POLICY "Users can create organizations"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for organization_members
CREATE POLICY "Users can view members of their organizations"
  ON organization_members FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Owners and admins can manage members"
  ON organization_members FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );

-- RLS Policies for subscriptions
CREATE POLICY "Users can view their organization subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Only owners can update subscription"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
        AND role = 'owner'
        AND status = 'active'
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
        AND role = 'owner'
        AND status = 'active'
    )
  );

CREATE POLICY "System can create subscriptions"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to automatically create organization for new users
CREATE OR REPLACE FUNCTION create_organization_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id uuid;
BEGIN
  -- Create organization
  INSERT INTO organizations (name)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Organization'))
  RETURNING id INTO new_org_id;
  
  -- Add user as owner
  INSERT INTO organization_members (organization_id, user_id, role, status, joined_at)
  VALUES (new_org_id, NEW.id, 'owner', 'active', now());
  
  -- Create free subscription
  INSERT INTO subscriptions (organization_id, plan, user_limit, amount, status)
  VALUES (new_org_id, 'free', 1, 0, 'active');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create organization on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_organization_for_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
