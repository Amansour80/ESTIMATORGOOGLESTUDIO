/*
  # Fix evaluate_rule Function

  ## Problem
  The evaluate_rule function is missing the proper search_path setting
  and uses enum types that may cause issues.

  ## Solution
  Recreate the function with search_path = '' and use text instead of enums.
*/

CREATE OR REPLACE FUNCTION evaluate_rule(
  p_field_value jsonb,
  p_operator text,
  p_rule_value jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result boolean;
  numeric_field numeric;
  numeric_rule numeric;
BEGIN
  CASE p_operator
    WHEN 'equals' THEN
      result := p_field_value = p_rule_value;

    WHEN 'not_equals' THEN
      result := p_field_value != p_rule_value;

    WHEN 'greater_than' THEN
      numeric_field := (p_field_value)::text::numeric;
      numeric_rule := (p_rule_value)::text::numeric;
      result := numeric_field > numeric_rule;

    WHEN 'greater_than_or_equal' THEN
      numeric_field := (p_field_value)::text::numeric;
      numeric_rule := (p_rule_value)::text::numeric;
      result := numeric_field >= numeric_rule;

    WHEN 'less_than' THEN
      numeric_field := (p_field_value)::text::numeric;
      numeric_rule := (p_rule_value)::text::numeric;
      result := numeric_field < numeric_rule;

    WHEN 'less_than_or_equal' THEN
      numeric_field := (p_field_value)::text::numeric;
      numeric_rule := (p_rule_value)::text::numeric;
      result := numeric_field <= numeric_rule;

    WHEN 'between' THEN
      numeric_field := (p_field_value)::text::numeric;
      result := numeric_field BETWEEN 
        (p_rule_value->0)::text::numeric AND 
        (p_rule_value->1)::text::numeric;

    WHEN 'in' THEN
      result := p_field_value IN (SELECT jsonb_array_elements(p_rule_value));

    WHEN 'not_in' THEN
      result := p_field_value NOT IN (SELECT jsonb_array_elements(p_rule_value));

    WHEN 'contains' THEN
      result := (p_field_value)::text ILIKE '%' || (p_rule_value)::text || '%';

    WHEN 'not_contains' THEN
      result := (p_field_value)::text NOT ILIKE '%' || (p_rule_value)::text || '%';

    ELSE
      result := false;
  END CASE;

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;
