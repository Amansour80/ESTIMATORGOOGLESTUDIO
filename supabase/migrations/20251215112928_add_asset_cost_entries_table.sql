/*
  # Add Asset Cost Entries Table

  Creates a new table to track asset-related costs in project management.

  1. New Tables
    - `asset_cost_entries`
      - `id` (uuid, primary key)
      - `actual_cost_id` (uuid, foreign key to actual_costs)
      - `asset_name` (text) - Name of the asset
      - `quantity` (numeric) - Number of units
      - `unit` (text) - Unit of measurement
      - `unit_price` (numeric) - Price per unit
      - `total_cost` (numeric) - Total cost (quantity × unit_price)
      - `supplier` (text, optional) - Supplier name
      - `purchase_order_number` (text, optional) - PO number
      - `serial_numbers` (text, optional) - Serial numbers if applicable
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `asset_cost_entries` table
    - Add policies for authenticated users to manage asset costs in their organization's projects
*/

CREATE TABLE IF NOT EXISTS public.asset_cost_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actual_cost_id uuid NOT NULL REFERENCES public.actual_costs(id) ON DELETE CASCADE,
  asset_name text NOT NULL,
  quantity numeric NOT NULL CHECK (quantity > 0),
  unit text NOT NULL,
  unit_price numeric NOT NULL CHECK (unit_price >= 0),
  total_cost numeric NOT NULL CHECK (total_cost >= 0),
  supplier text,
  purchase_order_number text,
  serial_numbers text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.asset_cost_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view asset costs in their organization projects"
  ON public.asset_cost_entries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.actual_costs ac
      JOIN public.retrofit_projects rp ON ac.project_id = rp.id
      WHERE ac.id = asset_cost_entries.actual_cost_id
      AND rp.organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert asset costs in their organization projects"
  ON public.asset_cost_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.actual_costs ac
      JOIN public.retrofit_projects rp ON ac.project_id = rp.id
      WHERE ac.id = asset_cost_entries.actual_cost_id
      AND rp.organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update asset costs in their organization projects"
  ON public.asset_cost_entries
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.actual_costs ac
      JOIN public.retrofit_projects rp ON ac.project_id = rp.id
      WHERE ac.id = asset_cost_entries.actual_cost_id
      AND rp.organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.actual_costs ac
      JOIN public.retrofit_projects rp ON ac.project_id = rp.id
      WHERE ac.id = asset_cost_entries.actual_cost_id
      AND rp.organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete asset costs in their organization projects"
  ON public.asset_cost_entries
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.actual_costs ac
      JOIN public.retrofit_projects rp ON ac.project_id = rp.id
      WHERE ac.id = asset_cost_entries.actual_cost_id
      AND rp.organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE INDEX IF NOT EXISTS idx_asset_cost_entries_actual_cost_id 
  ON public.asset_cost_entries(actual_cost_id);
