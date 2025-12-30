/*
  # Fix evaluate_workflow_rules Function Search Path

  ## Problem
  The evaluate_workflow_rules function is missing the proper search_path setting.

  ## Solution
  Recreate the function with search_path = '' and fully qualified table names.
*/

CREATE OR REPLACE FUNCTION evaluate_workflow_rules(
  p_workflow_id uuid,
  p_project_data jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  rule_record RECORD;
  group_result boolean;
  current_group int;
  final_result boolean;
  group_results boolean[] := ARRAY[]::boolean[];
  group_operators text[] := ARRAY[]::text[];
BEGIN
  -- Get all rules for this workflow, ordered by rule_group and priority
  FOR rule_record IN 
    SELECT *
    FROM public.approval_workflow_rules
    WHERE workflow_id = p_workflow_id
    ORDER BY rule_group, priority
  LOOP
    -- If we're starting a new group, save the previous group result
    IF current_group IS NOT NULL AND current_group != rule_record.rule_group THEN
      group_results := array_append(group_results, group_result);
      group_operators := array_append(group_operators, rule_record.logical_operator::text);
      group_result := NULL;
    END IF;

    current_group := rule_record.rule_group;

    -- Evaluate this rule
    DECLARE
      field_value jsonb;
      rule_result boolean;
    BEGIN
      field_value := p_project_data->rule_record.field_name;
      rule_result := evaluate_rule(field_value, rule_record.operator::text, rule_record.value);

      -- AND rules within the same group
      IF group_result IS NULL THEN
        group_result := rule_result;
      ELSE
        group_result := group_result AND rule_result;
      END IF;
    END;
  END LOOP;

  -- Add the last group result
  IF group_result IS NOT NULL THEN
    group_results := array_append(group_results, group_result);
  END IF;

  -- If no rules, workflow always matches
  IF array_length(group_results, 1) IS NULL THEN
    RETURN true;
  END IF;

  -- Combine group results using logical operators
  final_result := group_results[1];
  FOR i IN 2..array_length(group_results, 1) LOOP
    IF group_operators[i-1] = 'AND' THEN
      final_result := final_result AND group_results[i];
    ELSE
      final_result := final_result OR group_results[i];
    END IF;
  END LOOP;

  RETURN final_result;
END;
$$;
