/*
  # Optimize RLS Policies - Part 3: Pricing & Stripe Tables

  1. Performance Improvements
    - Wrap auth.uid() calls with SELECT to cache the result
    - Prevents re-evaluation for each row

  2. Tables Affected
    - pricing_config
    - stripe_customers
    - stripe_subscriptions
    - stripe_orders
*/

-- Drop and recreate pricing_config policies
DROP POLICY IF EXISTS "Super admins can insert pricing" ON pricing_config;
CREATE POLICY "Super admins can insert pricing"
  ON pricing_config FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Super admins can update pricing" ON pricing_config;
CREATE POLICY "Super admins can update pricing"
  ON pricing_config FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- Drop and recreate stripe_customers policies
DROP POLICY IF EXISTS "Users can view their own customer data" ON stripe_customers;
CREATE POLICY "Users can view their own customer data"
  ON stripe_customers FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Drop and recreate stripe_subscriptions policies
DROP POLICY IF EXISTS "Users can view their own subscription data" ON stripe_subscriptions;
CREATE POLICY "Users can view their own subscription data"
  ON stripe_subscriptions FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id FROM stripe_customers 
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- Drop and recreate stripe_orders policies
DROP POLICY IF EXISTS "Users can view their own order data" ON stripe_orders;
CREATE POLICY "Users can view their own order data"
  ON stripe_orders FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id FROM stripe_customers 
      WHERE user_id = (SELECT auth.uid())
    )
  );
