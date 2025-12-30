/*
  # Fix Trigger Functions with Schema-Qualified Names

  1. Problem
    - Trigger functions have search_path set to empty string
    - But they're not using schema-qualified table names

  2. Solution
    - Replace trigger function bodies with schema-qualified table names

  3. Functions Fixed
    - generate_inquiry_number (trigger)
    - update_inquiries_updated_at (trigger)
    - validate_project_status_transition (trigger)
    - update_updated_at_column (trigger)
    - create_organization_for_new_user (trigger)
    - handle_new_user (trigger)
    - handle_new_user_complete (trigger)
*/

-- Fix generate_inquiry_number
CREATE OR REPLACE FUNCTION generate_inquiry_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  year_part text;
  next_num integer;
  new_number text;
BEGIN
  year_part := to_char(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(inquiry_number FROM 'INQ-' || year_part || '-(\d+)') AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.inquiries
  WHERE organization_id = NEW.organization_id
  AND inquiry_number LIKE 'INQ-' || year_part || '-%';
  
  new_number := 'INQ-' || year_part || '-' || LPAD(next_num::text, 3, '0');
  NEW.inquiry_number := new_number;
  
  RETURN NEW;
END;
$$;

ALTER FUNCTION generate_inquiry_number() SET search_path = '';

-- Fix update_inquiries_updated_at
CREATE OR REPLACE FUNCTION update_inquiries_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

ALTER FUNCTION update_inquiries_updated_at() SET search_path = '';

-- Fix validate_project_status_transition
CREATE OR REPLACE FUNCTION validate_project_status_transition()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  IF NEW.status = 'submitted' THEN
    NEW.submitted_at = NOW();
  ELSIF NEW.status = 'awarded' THEN
    NEW.awarded_at = NOW();
  ELSIF NEW.status = 'lost' THEN
    NEW.lost_at = NOW();
  ELSIF NEW.status = 'cancelled' THEN
    NEW.cancelled_at = NOW();
  END IF;
  
  NEW.status_history = COALESCE(NEW.status_history, '[]'::jsonb) || 
    jsonb_build_object(
      'status', NEW.status,
      'timestamp', NOW(),
      'previous_status', OLD.status
    );
  
  RETURN NEW;
END;
$$;

ALTER FUNCTION validate_project_status_transition() SET search_path = '';

-- Fix update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

ALTER FUNCTION update_updated_at_column() SET search_path = '';

-- Fix create_organization_for_new_user
CREATE OR REPLACE FUNCTION create_organization_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_org_id uuid;
  user_email text;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.id;
  
  INSERT INTO public.organizations (name, created_by)
  VALUES (
    COALESCE(user_email, 'Organization'),
    NEW.id
  )
  RETURNING id INTO new_org_id;
  
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');
  
  INSERT INTO public.subscriptions (organization_id, tier, status)
  VALUES (new_org_id, 'free', 'active');
  
  RETURN NEW;
END;
$$;

ALTER FUNCTION create_organization_for_new_user() SET search_path = '';

-- Fix handle_new_user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_org_id uuid;
BEGIN
  INSERT INTO public.user_profiles (id, full_name, complementary_account)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), false);
  
  INSERT INTO public.organizations (name, created_by)
  VALUES (
    COALESCE(NEW.email, 'Organization'),
    NEW.id
  )
  RETURNING id INTO new_org_id;
  
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');
  
  INSERT INTO public.subscriptions (organization_id, tier, status)
  VALUES (new_org_id, 'free', 'active');
  
  RETURN NEW;
END;
$$;

ALTER FUNCTION handle_new_user() SET search_path = '';

-- Fix handle_new_user_complete
CREATE OR REPLACE FUNCTION handle_new_user_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_org_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = NEW.id) THEN
    INSERT INTO public.user_profiles (id, full_name, complementary_account)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, ''), false);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.organization_members WHERE user_id = NEW.id) THEN
    INSERT INTO public.organizations (name, created_by)
    VALUES (
      COALESCE(NEW.email, 'Organization'),
      NEW.id
    )
    RETURNING id INTO new_org_id;
    
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (new_org_id, NEW.id, 'owner');
    
    INSERT INTO public.subscriptions (organization_id, tier, status)
    VALUES (new_org_id, 'free', 'active');
  END IF;
  
  RETURN NEW;
END;
$$;

ALTER FUNCTION handle_new_user_complete() SET search_path = '';

-- Fix is_super_admin
CREATE OR REPLACE FUNCTION is_super_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
SELECT EXISTS (
  SELECT 1 FROM public.super_admins 
  WHERE user_id = check_user_id
);
$$;

ALTER FUNCTION is_super_admin(check_user_id uuid) SET search_path = '';
