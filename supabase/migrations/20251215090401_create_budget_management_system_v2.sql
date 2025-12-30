/*
  # Budget Management System for Retrofit PM

  1. New Tables
    - `budget_baselines` - Immutable snapshot of approved estimation budget
    - `activity_budget_allocations` - Budget allocated to specific activities  
    - `cost_categories` - User-defined and system cost categories
    - `actual_costs` - Main cost tracking table
    - `labor_cost_entries` - Detailed labor cost information
    - `material_cost_entries` - Material purchase details
    - `equipment_cost_entries` - Equipment rental/purchase details
    - `subcontractor_cost_entries` - Subcontractor invoice details
    - `budget_change_orders` - Change order tracking
    - `change_order_line_items` - Detailed change order breakdown
    - `budget_revisions` - Budget revision history
    - `cost_forecasts` - Cost projections

  2. Security
    - Enable RLS on all tables
    - Add policies for project members to view/manage budget data
    - Admins and project managers can approve costs and change orders

  3. Indexes
    - Foreign key indexes for performance
    - Query optimization indexes
*/

-- Budget Baselines
CREATE TABLE IF NOT EXISTS budget_baselines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES retrofit_projects(id) ON DELETE CASCADE NOT NULL,
  baseline_version integer NOT NULL DEFAULT 1,
  total_budget numeric NOT NULL DEFAULT 0,
  assets_budget numeric NOT NULL DEFAULT 0,
  labor_budget numeric NOT NULL DEFAULT 0,
  materials_budget numeric NOT NULL DEFAULT 0,
  equipment_budget numeric NOT NULL DEFAULT 0,
  subcontractor_budget numeric NOT NULL DEFAULT 0,
  overhead_budget numeric NOT NULL DEFAULT 0,
  contingency_budget numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  imported_from_estimation boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Activity Budget Allocations
CREATE TABLE IF NOT EXISTS activity_budget_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid REFERENCES project_activities(id) ON DELETE CASCADE NOT NULL,
  cost_category text NOT NULL,
  allocated_amount numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Cost Categories
CREATE TABLE IF NOT EXISTS cost_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  category_name text NOT NULL,
  category_type text NOT NULL DEFAULT 'custom',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_category_type CHECK (category_type IN ('predefined', 'custom'))
);

-- Actual Costs
CREATE TABLE IF NOT EXISTS actual_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES retrofit_projects(id) ON DELETE CASCADE NOT NULL,
  activity_id uuid REFERENCES project_activities(id) ON DELETE SET NULL,
  cost_type text NOT NULL,
  cost_category_id uuid REFERENCES cost_categories(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity numeric,
  unit_price numeric,
  total_amount numeric NOT NULL,
  cost_date date NOT NULL DEFAULT CURRENT_DATE,
  document_id uuid REFERENCES project_documents(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  approved_at timestamptz,
  CONSTRAINT valid_cost_type CHECK (cost_type IN ('labor', 'material', 'equipment', 'subcontractor', 'other')),
  CONSTRAINT valid_status CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected'))
);

-- Labor Cost Entries
CREATE TABLE IF NOT EXISTS labor_cost_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actual_cost_id uuid REFERENCES actual_costs(id) ON DELETE CASCADE NOT NULL,
  manpower_type text NOT NULL,
  trade text,
  num_workers integer NOT NULL DEFAULT 1,
  hours_worked numeric,
  days_worked numeric,
  rate_per_hour numeric,
  rate_per_day numeric,
  total_cost numeric NOT NULL,
  work_date_start date NOT NULL,
  work_date_end date,
  created_at timestamptz DEFAULT now()
);

-- Material Cost Entries
CREATE TABLE IF NOT EXISTS material_cost_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actual_cost_id uuid REFERENCES actual_costs(id) ON DELETE CASCADE NOT NULL,
  material_name text NOT NULL,
  material_id uuid,
  quantity numeric NOT NULL,
  unit text NOT NULL,
  unit_price numeric NOT NULL,
  total_cost numeric NOT NULL,
  supplier text,
  invoice_number text,
  created_at timestamptz DEFAULT now()
);

-- Equipment Cost Entries
CREATE TABLE IF NOT EXISTS equipment_cost_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actual_cost_id uuid REFERENCES actual_costs(id) ON DELETE CASCADE NOT NULL,
  equipment_type text NOT NULL,
  equipment_name text NOT NULL,
  rental_days numeric,
  daily_rate numeric,
  total_cost numeric NOT NULL,
  supplier text,
  created_at timestamptz DEFAULT now()
);

-- Subcontractor Cost Entries
CREATE TABLE IF NOT EXISTS subcontractor_cost_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actual_cost_id uuid REFERENCES actual_costs(id) ON DELETE CASCADE NOT NULL,
  subcontractor_name text NOT NULL,
  invoice_number text,
  work_description text NOT NULL,
  progress_percentage numeric DEFAULT 0,
  retention_percentage numeric DEFAULT 0,
  retention_amount numeric DEFAULT 0,
  gross_amount numeric NOT NULL,
  net_payable numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Budget Change Orders
CREATE TABLE IF NOT EXISTS budget_change_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES retrofit_projects(id) ON DELETE CASCADE NOT NULL,
  change_order_number text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  reason text,
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  requested_at timestamptz DEFAULT now(),
  current_budget numeric NOT NULL,
  requested_budget_change numeric NOT NULL,
  new_total_budget numeric NOT NULL,
  impact_analysis text,
  status text NOT NULL DEFAULT 'draft',
  workflow_id uuid REFERENCES approval_workflows(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_co_status CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected'))
);

-- Change Order Line Items
CREATE TABLE IF NOT EXISTS change_order_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  change_order_id uuid REFERENCES budget_change_orders(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL,
  current_allocation numeric NOT NULL,
  requested_change numeric NOT NULL,
  new_allocation numeric NOT NULL,
  justification text,
  created_at timestamptz DEFAULT now()
);

-- Budget Revisions
CREATE TABLE IF NOT EXISTS budget_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES retrofit_projects(id) ON DELETE CASCADE NOT NULL,
  revision_number integer NOT NULL,
  change_order_id uuid REFERENCES budget_change_orders(id) ON DELETE SET NULL,
  previous_budget numeric NOT NULL,
  revised_budget numeric NOT NULL,
  revision_date timestamptz DEFAULT now(),
  revised_by uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Cost Forecasts
CREATE TABLE IF NOT EXISTS cost_forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES retrofit_projects(id) ON DELETE CASCADE NOT NULL,
  activity_id uuid REFERENCES project_activities(id) ON DELETE SET NULL,
  forecast_date date NOT NULL DEFAULT CURRENT_DATE,
  forecasted_cost_to_complete numeric NOT NULL,
  estimate_at_completion numeric NOT NULL,
  confidence_level text NOT NULL DEFAULT 'likely',
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_confidence CHECK (confidence_level IN ('optimistic', 'likely', 'pessimistic'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_budget_baselines_project ON budget_baselines(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_baselines_active ON budget_baselines(project_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_activity_budget_alloc_activity ON activity_budget_allocations(activity_id);
CREATE INDEX IF NOT EXISTS idx_cost_categories_org ON cost_categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_actual_costs_project ON actual_costs(project_id);
CREATE INDEX IF NOT EXISTS idx_actual_costs_activity ON actual_costs(activity_id);
CREATE INDEX IF NOT EXISTS idx_actual_costs_status ON actual_costs(project_id, status);
CREATE INDEX IF NOT EXISTS idx_actual_costs_date ON actual_costs(project_id, cost_date);
CREATE INDEX IF NOT EXISTS idx_labor_entries_cost ON labor_cost_entries(actual_cost_id);
CREATE INDEX IF NOT EXISTS idx_material_entries_cost ON material_cost_entries(actual_cost_id);
CREATE INDEX IF NOT EXISTS idx_equipment_entries_cost ON equipment_cost_entries(actual_cost_id);
CREATE INDEX IF NOT EXISTS idx_subcontractor_entries_cost ON subcontractor_cost_entries(actual_cost_id);
CREATE INDEX IF NOT EXISTS idx_change_orders_project ON budget_change_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_change_orders_status ON budget_change_orders(project_id, status);
CREATE INDEX IF NOT EXISTS idx_change_order_items_co ON change_order_line_items(change_order_id);
CREATE INDEX IF NOT EXISTS idx_budget_revisions_project ON budget_revisions(project_id);
CREATE INDEX IF NOT EXISTS idx_cost_forecasts_project ON cost_forecasts(project_id);
CREATE INDEX IF NOT EXISTS idx_cost_forecasts_activity ON cost_forecasts(activity_id);

-- Enable RLS
ALTER TABLE budget_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_budget_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE actual_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE labor_cost_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_cost_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_cost_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcontractor_cost_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_change_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_order_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_forecasts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Budget Baselines
CREATE POLICY "Project members can view budget baselines"
  ON budget_baselines FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.retrofit_project_id = budget_baselines.project_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Project managers can create budget baselines"
  ON budget_baselines FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.retrofit_project_id = budget_baselines.project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('manager', 'admin')
    )
  );

CREATE POLICY "Project managers can update budget baselines"
  ON budget_baselines FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.retrofit_project_id = budget_baselines.project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('manager', 'admin')
    )
  );

-- RLS Policies for Activity Budget Allocations
CREATE POLICY "Project members can view activity budget allocations"
  ON activity_budget_allocations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_activities pa
      JOIN project_members pm ON pm.retrofit_project_id = pa.retrofit_project_id
      WHERE pa.id = activity_budget_allocations.activity_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Project managers can manage activity budget allocations"
  ON activity_budget_allocations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_activities pa
      JOIN project_members pm ON pm.retrofit_project_id = pa.retrofit_project_id
      WHERE pa.id = activity_budget_allocations.activity_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('manager', 'admin')
    )
  );

-- RLS Policies for Cost Categories
CREATE POLICY "Organization members can view cost categories"
  ON cost_categories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = cost_categories.organization_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can manage cost categories"
  ON cost_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = cost_categories.organization_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
    )
  );

-- RLS Policies for Actual Costs
CREATE POLICY "Project members can view actual costs"
  ON actual_costs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.retrofit_project_id = actual_costs.project_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Project members can create actual costs"
  ON actual_costs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.retrofit_project_id = actual_costs.project_id
      AND pm.user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Project members can update their own costs"
  ON actual_costs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.retrofit_project_id = actual_costs.project_id
      AND pm.user_id = auth.uid()
    )
    AND (created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.retrofit_project_id = actual_costs.project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('manager', 'admin')
    ))
  );

-- RLS Policies for Labor Cost Entries
CREATE POLICY "Project members can view labor entries"
  ON labor_cost_entries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM actual_costs ac
      JOIN project_members pm ON pm.retrofit_project_id = ac.project_id
      WHERE ac.id = labor_cost_entries.actual_cost_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Cost creators can manage labor entries"
  ON labor_cost_entries FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM actual_costs ac
      JOIN project_members pm ON pm.retrofit_project_id = ac.project_id
      WHERE ac.id = labor_cost_entries.actual_cost_id
      AND pm.user_id = auth.uid()
    )
  );

-- RLS Policies for Material Cost Entries
CREATE POLICY "Project members can view material entries"
  ON material_cost_entries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM actual_costs ac
      JOIN project_members pm ON pm.retrofit_project_id = ac.project_id
      WHERE ac.id = material_cost_entries.actual_cost_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Cost creators can manage material entries"
  ON material_cost_entries FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM actual_costs ac
      JOIN project_members pm ON pm.retrofit_project_id = ac.project_id
      WHERE ac.id = material_cost_entries.actual_cost_id
      AND pm.user_id = auth.uid()
    )
  );

-- RLS Policies for Equipment Cost Entries
CREATE POLICY "Project members can view equipment entries"
  ON equipment_cost_entries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM actual_costs ac
      JOIN project_members pm ON pm.retrofit_project_id = ac.project_id
      WHERE ac.id = equipment_cost_entries.actual_cost_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Cost creators can manage equipment entries"
  ON equipment_cost_entries FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM actual_costs ac
      JOIN project_members pm ON pm.retrofit_project_id = ac.project_id
      WHERE ac.id = equipment_cost_entries.actual_cost_id
      AND pm.user_id = auth.uid()
    )
  );

-- RLS Policies for Subcontractor Cost Entries
CREATE POLICY "Project members can view subcontractor entries"
  ON subcontractor_cost_entries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM actual_costs ac
      JOIN project_members pm ON pm.retrofit_project_id = ac.project_id
      WHERE ac.id = subcontractor_cost_entries.actual_cost_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Cost creators can manage subcontractor entries"
  ON subcontractor_cost_entries FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM actual_costs ac
      JOIN project_members pm ON pm.retrofit_project_id = ac.project_id
      WHERE ac.id = subcontractor_cost_entries.actual_cost_id
      AND pm.user_id = auth.uid()
    )
  );

-- RLS Policies for Budget Change Orders
CREATE POLICY "Project members can view change orders"
  ON budget_change_orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.retrofit_project_id = budget_change_orders.project_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Project members can create change orders"
  ON budget_change_orders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.retrofit_project_id = budget_change_orders.project_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Project managers can update change orders"
  ON budget_change_orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.retrofit_project_id = budget_change_orders.project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('manager', 'admin')
    )
  );

-- RLS Policies for Change Order Line Items
CREATE POLICY "Project members can view change order items"
  ON change_order_line_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_change_orders bco
      JOIN project_members pm ON pm.retrofit_project_id = bco.project_id
      WHERE bco.id = change_order_line_items.change_order_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Project members can manage change order items"
  ON change_order_line_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_change_orders bco
      JOIN project_members pm ON pm.retrofit_project_id = bco.project_id
      WHERE bco.id = change_order_line_items.change_order_id
      AND pm.user_id = auth.uid()
    )
  );

-- RLS Policies for Budget Revisions
CREATE POLICY "Project members can view budget revisions"
  ON budget_revisions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.retrofit_project_id = budget_revisions.project_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Project managers can create budget revisions"
  ON budget_revisions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.retrofit_project_id = budget_revisions.project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('manager', 'admin')
    )
  );

-- RLS Policies for Cost Forecasts
CREATE POLICY "Project members can view cost forecasts"
  ON cost_forecasts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.retrofit_project_id = cost_forecasts.project_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Project members can manage cost forecasts"
  ON cost_forecasts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.retrofit_project_id = cost_forecasts.project_id
      AND pm.user_id = auth.uid()
    )
  );

-- Enable Realtime for Budget tables
ALTER PUBLICATION supabase_realtime ADD TABLE budget_baselines;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_budget_allocations;
ALTER PUBLICATION supabase_realtime ADD TABLE actual_costs;
ALTER PUBLICATION supabase_realtime ADD TABLE budget_change_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE budget_revisions;