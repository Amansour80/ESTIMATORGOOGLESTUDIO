/*
  # Fix evaluate_condition_node Function Call

  ## Problem
  The evaluate_condition_node function calls evaluate_condition_rule
  without schema qualification.

  ## Solution
  Add public. prefix to the function call.
*/

CREATE OR REPLACE FUNCTION evaluate_condition_node(
  p_node_data jsonb,
  p_project_data jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_rule jsonb;
  v_result boolean;
  v_require_all boolean;
  v_any_true boolean := false;
  v_all_true boolean := true;
BEGIN
  -- Get requireAll flag (default to false = OR logic)
  v_require_all := COALESCE((p_node_data->>'requireAll')::boolean, false);

  -- Evaluate each condition rule
  FOR v_rule IN SELECT * FROM jsonb_array_elements(p_node_data->'conditionRules')
  LOOP
    -- SCHEMA-QUALIFIED call
    v_result := public.evaluate_condition_rule(
      v_rule->>'field',
      v_rule->>'operator',
      v_rule->>'value',
      p_project_data
    );

    IF v_result THEN
      v_any_true := true;
    ELSE
      v_all_true := false;
    END IF;

    -- Short circuit if possible
    IF v_require_all AND NOT v_result THEN
      RETURN false;
    END IF;

    IF NOT v_require_all AND v_result THEN
      RETURN true;
    END IF;
  END LOOP;

  -- Return based on require_all flag
  IF v_require_all THEN
    RETURN v_all_true;
  ELSE
    RETURN v_any_true;
  END IF;
END;
$$;
