import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ContractModel, ContractModelConfig } from '../../types/fm';

interface Props {
  config: ContractModelConfig;
  onChange: (config: ContractModelConfig) => void;
}

const modelLabels: Record<ContractModel, string> = {
  fully_comprehensive: 'Fully Comprehensive',
  semi_comprehensive: 'Semi-Comprehensive',
  cost_plus: 'Cost-Plus',
};

export default function ContractModelConfigComponent({ config, onChange }: Props) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Contract Model for Materials & Consumables</h2>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-gray-100 rounded transition-colors pointer-events-auto"
        >
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>

      {isExpanded && (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Global Model
          </label>
          <select
            value={config.global}
            onChange={(e) => onChange({ ...config, global: e.target.value as ContractModel })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-yellow-50"
          >
            {Object.entries(modelLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cost-Plus Handling Fee (%)
          </label>
          <input
            type="number"
            value={config.costPlusHandlingFee}
            onChange={(e) => onChange({ ...config, costPlusHandlingFee: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-yellow-50"
            min="0"
            step="0.1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Applied when using Cost-Plus model
          </p>
        </div>

        <div className="pt-2 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">
            <strong>Note:</strong> Per-category overrides can be set in the Materials/Consumables catalogs.
          </p>
        </div>
      </div>
      )}
    </div>
  );
}
