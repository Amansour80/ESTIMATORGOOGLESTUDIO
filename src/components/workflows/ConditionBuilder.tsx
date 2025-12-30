import React, { useState } from 'react';
import { Plus, Trash2, Info } from 'lucide-react';
import { FIELD_OPTIONS, OPERATOR_OPTIONS } from '../../utils/workflowDatabase';

interface Rule {
  field: string;
  operator: string;
  value: string;
  logicalOperator: 'AND' | 'OR';
}

interface ConditionBuilderProps {
  initialRules?: Rule[];
  onRulesChange: (rules: Rule[]) => void;
}

export default function ConditionBuilder({ initialRules = [], onRulesChange }: ConditionBuilderProps) {
  const [rules, setRules] = useState<Rule[]>(
    initialRules.length > 0
      ? initialRules
      : [{ field: 'calculated_value', operator: 'greater_than', value: '', logicalOperator: 'AND' }]
  );

  const updateRule = (index: number, updates: Partial<Rule>) => {
    const newRules = rules.map((rule, i) => (i === index ? { ...rule, ...updates } : rule));
    setRules(newRules);
    onRulesChange(newRules);
  };

  const addRule = () => {
    const newRules = [
      ...rules,
      { field: 'calculated_value', operator: 'greater_than', value: '', logicalOperator: 'AND' },
    ];
    setRules(newRules);
    onRulesChange(newRules);
  };

  const removeRule = (index: number) => {
    if (rules.length === 1) return; // Keep at least one rule
    const newRules = rules.filter((_, i) => i !== index);
    setRules(newRules);
    onRulesChange(newRules);
  };

  const getFieldType = (field: string): 'number' | 'text' => {
    const numericFields = ['project_value', 'calculated_value', 'profit_margin', 'duration_months', 'total_labor_cost', 'total_material_cost'];
    return numericFields.includes(field) ? 'number' : 'text';
  };

  const getConditionSummary = (): string => {
    if (rules.length === 0 || rules.every(r => !r.value)) {
      return 'No conditions defined';
    }

    return rules
      .filter(r => r.value)
      .map((rule, index) => {
        const field = FIELD_OPTIONS.find(f => f.value === rule.field)?.label || rule.field;
        const operator = OPERATOR_OPTIONS.find(o => o.value === rule.operator)?.label || rule.operator;
        const prefix = index > 0 ? ` ${rule.logicalOperator} ` : '';
        return `${prefix}${field} ${operator} ${rule.value}`;
      })
      .join('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Condition Rules
        </label>
        <button
          onClick={addRule}
          className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Rule
        </button>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-start gap-2">
        <Info className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-xs text-purple-800 font-medium">Condition Summary:</p>
          <p className="text-sm text-purple-700 mt-1">{getConditionSummary()}</p>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {rules.map((rule, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-white">
            {index > 0 && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-500">When</span>
                <select
                  value={rule.logicalOperator}
                  onChange={(e) => updateRule(index, { logicalOperator: e.target.value as 'AND' | 'OR' })}
                  className="text-sm px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="AND">AND</option>
                  <option value="OR">OR</option>
                </select>
              </div>
            )}

            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-4">
                <label className="block text-xs text-gray-600 mb-1">Field</label>
                <select
                  value={rule.field}
                  onChange={(e) => updateRule(index, { field: e.target.value })}
                  className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {FIELD_OPTIONS.map((field) => (
                    <option key={field.value} value={field.value}>
                      {field.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-4">
                <label className="block text-xs text-gray-600 mb-1">Operator</label>
                <select
                  value={rule.operator}
                  onChange={(e) => updateRule(index, { operator: e.target.value })}
                  className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {OPERATOR_OPTIONS.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-3">
                <label className="block text-xs text-gray-600 mb-1">Value</label>
                <input
                  type={getFieldType(rule.field)}
                  value={rule.value}
                  onChange={(e) => updateRule(index, { value: e.target.value })}
                  placeholder="Enter value"
                  className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="col-span-1 flex items-end">
                <button
                  onClick={() => removeRule(index)}
                  disabled={rules.length === 1}
                  className="w-full p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Remove rule"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <p className="text-xs text-gray-700">
          <strong>How it works:</strong> The condition evaluates to TRUE if all/any rules match (based on AND/OR).
          If TRUE, the workflow follows the green path. If FALSE, it follows the red path.
        </p>
      </div>
    </div>
  );
}
