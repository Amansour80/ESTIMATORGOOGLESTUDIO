/*
  # Add Budget-Related Permissions to Roles
  
  ## Description
  This migration adds budget and cost review permissions to the organization_roles table
  to support the budget management and cost review workflow systems.
  
  ## New Permission Fields
  
  1. can_view_budgets
     - Allows viewing budget information, baselines, and summaries
     - Required to access Budget tab in PM projects
     
  2. can_manage_budgets
     - Allows creating and modifying budget baselines
     - Importing budgets from estimations
     - Creating budget change orders
     - Managing activity budget allocations
     
  3. can_review_costs
     - Allows reviewing and approving actual cost entries
     - Used in cost review workflow steps
     - Can approve or reject cost submissions
     
  4. can_manage_cost_workflows
     - Allows creating and configuring cost review workflows
     - Managing workflow steps and trigger conditions
     - Assigning reviewers to workflow steps
  
  ## Changes
  
  - Updates existing organization_roles records with default values
  - System roles (estimator, admin, owner) get appropriate permissions
  - Custom roles maintain existing permissions, new fields set to false
*/

-- First, check if the columns already exist and only add them if they don't
DO $$
BEGIN
  -- Add can_view_budgets column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'organization_roles'
    AND column_name = 'can_view_budgets'
  ) THEN
    -- Since we can't directly alter jsonb fields, we'll update the permissions jsonb
    -- For all existing roles, add the new permission fields with default values
    UPDATE public.organization_roles
    SET permissions = permissions || jsonb_build_object(
      'can_view_budgets', 
      CASE 
        WHEN role_type = 'system' AND role_name IN ('Owner', 'Admin', 'Estimator') THEN true
        ELSE false
      END
    )
    WHERE NOT (permissions ? 'can_view_budgets');
  END IF;

  -- Add can_manage_budgets
  IF NOT EXISTS (
    SELECT 1 
    FROM public.organization_roles
    WHERE permissions ? 'can_manage_budgets'
    LIMIT 1
  ) THEN
    UPDATE public.organization_roles
    SET permissions = permissions || jsonb_build_object(
      'can_manage_budgets', 
      CASE 
        WHEN role_type = 'system' AND role_name IN ('Owner', 'Admin') THEN true
        ELSE false
      END
    );
  END IF;

  -- Add can_review_costs
  IF NOT EXISTS (
    SELECT 1 
    FROM public.organization_roles
    WHERE permissions ? 'can_review_costs'
    LIMIT 1
  ) THEN
    UPDATE public.organization_roles
    SET permissions = permissions || jsonb_build_object(
      'can_review_costs', 
      CASE 
        WHEN role_type = 'system' AND role_name IN ('Owner', 'Admin') THEN true
        ELSE false
      END
    );
  END IF;

  -- Add can_manage_cost_workflows
  IF NOT EXISTS (
    SELECT 1 
    FROM public.organization_roles
    WHERE permissions ? 'can_manage_cost_workflows'
    LIMIT 1
  ) THEN
    UPDATE public.organization_roles
    SET permissions = permissions || jsonb_build_object(
      'can_manage_cost_workflows', 
      CASE 
        WHEN role_type = 'system' AND role_name IN ('Owner', 'Admin') THEN true
        ELSE false
      END
    );
  END IF;
END $$;

-- Create a function to validate permissions structure
CREATE OR REPLACE FUNCTION public.validate_role_permissions()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Ensure all required permission fields exist
  IF NOT (
    NEW.permissions ? 'can_view' AND
    NEW.permissions ? 'can_edit' AND
    NEW.permissions ? 'can_approve' AND
    NEW.permissions ? 'can_manage_workflows' AND
    NEW.permissions ? 'can_manage_roles' AND
    NEW.permissions ? 'can_view_budgets' AND
    NEW.permissions ? 'can_manage_budgets' AND
    NEW.permissions ? 'can_review_costs' AND
    NEW.permissions ? 'can_manage_cost_workflows'
  ) THEN
    RAISE EXCEPTION 'Role permissions must include all required fields';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add trigger to validate permissions on insert/update
DROP TRIGGER IF EXISTS validate_role_permissions_trigger ON public.organization_roles;
CREATE TRIGGER validate_role_permissions_trigger
  BEFORE INSERT OR UPDATE ON public.organization_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_role_permissions();

-- Add helpful comment on the permissions column
COMMENT ON COLUMN public.organization_roles.permissions IS 
'Role permissions stored as JSONB with the following fields:
- can_view: View project details and estimates
- can_edit: Create and modify project estimates
- can_approve: Approve or reject project estimates in workflows
- can_manage_workflows: Create and configure approval workflows
- can_manage_roles: Create roles and assign them to users
- can_view_budgets: View budget information and summaries
- can_manage_budgets: Create and modify budgets and change orders
- can_review_costs: Review and approve actual cost entries
- can_manage_cost_workflows: Create and configure cost review workflows';
