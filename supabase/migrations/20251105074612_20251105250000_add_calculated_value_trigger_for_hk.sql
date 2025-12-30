/*
  # Add Trigger to Auto-Calculate Value for HK Projects

  ## Problem
  HK projects are being saved with calculated_value = 0 even when they have data
  
  ## Solution
  Create a trigger that calculates the value from project_data before insert/update
  Uses the pricing data already in the project_data JSON
*/

CREATE OR REPLACE FUNCTION calculate_hk_project_value()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_final_price numeric;
BEGIN
  -- Try to extract the final annual price from the project_data
  -- The HK calculator stores this in various possible paths
  
  -- First try: Check if there's a pricing object with finalPriceAnnual
  IF NEW.project_data ? 'pricing' AND 
     NEW.project_data->'pricing' ? 'finalPriceAnnual' THEN
    v_final_price := (NEW.project_data->'pricing'->>'finalPriceAnnual')::numeric;
  
  -- Second try: Check if there's results object
  ELSIF NEW.project_data ? 'results' AND 
        NEW.project_data->'results' ? 'finalPriceAnnual' THEN
    v_final_price := (NEW.project_data->'results'->>'finalPriceAnnual')::numeric;
  
  -- Third try: Check projectInfo for annualSellingPrice
  ELSIF NEW.project_data ? 'projectInfo' AND 
        NEW.project_data->'projectInfo' ? 'annualSellingPrice' THEN
    v_final_price := (NEW.project_data->'projectInfo'->>'annualSellingPrice')::numeric;
  
  -- If no pre-calculated value found, keep the explicitly set calculated_value
  ELSE
    v_final_price := COALESCE(NEW.calculated_value, 0);
  END IF;
  
  -- Update the calculated_value
  NEW.calculated_value := COALESCE(v_final_price, 0);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER hk_projects_calculate_value
  BEFORE INSERT OR UPDATE ON hk_projects
  FOR EACH ROW
  EXECUTE FUNCTION calculate_hk_project_value();

-- Also add similar triggers for FM and Retrofit
CREATE OR REPLACE FUNCTION calculate_fm_project_value()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_final_price numeric;
BEGIN
  IF NEW.project_data ? 'pricing' AND 
     NEW.project_data->'pricing' ? 'totalAnnualPrice' THEN
    v_final_price := (NEW.project_data->'pricing'->>'totalAnnualPrice')::numeric;
  ELSIF NEW.project_data ? 'results' AND 
        NEW.project_data->'results' ? 'totalAnnualPrice' THEN
    v_final_price := (NEW.project_data->'results'->>'totalAnnualPrice')::numeric;
  ELSE
    v_final_price := COALESCE(NEW.calculated_value, 0);
  END IF;
  
  NEW.calculated_value := COALESCE(v_final_price, 0);
  RETURN NEW;
END;
$$;

CREATE TRIGGER fm_projects_calculate_value
  BEFORE INSERT OR UPDATE ON fm_projects
  FOR EACH ROW
  EXECUTE FUNCTION calculate_fm_project_value();

CREATE OR REPLACE FUNCTION calculate_retrofit_project_value()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_final_price numeric;
BEGIN
  IF NEW.project_data ? 'pricing' AND 
     NEW.project_data->'pricing' ? 'grandTotal' THEN
    v_final_price := (NEW.project_data->'pricing'->>'grandTotal')::numeric;
  ELSIF NEW.project_data ? 'summary' AND 
        NEW.project_data->'summary' ? 'grandTotal' THEN
    v_final_price := (NEW.project_data->'summary'->>'grandTotal')::numeric;
  ELSE
    v_final_price := COALESCE(NEW.calculated_value, 0);
  END IF;
  
  NEW.calculated_value := COALESCE(v_final_price, 0);
  RETURN NEW;
END;
$$;

CREATE TRIGGER retrofit_projects_calculate_value
  BEFORE INSERT OR UPDATE ON retrofit_projects
  FOR EACH ROW
  EXECUTE FUNCTION calculate_retrofit_project_value();