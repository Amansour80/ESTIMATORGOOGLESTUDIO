import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { RetrofitCostConfig } from '../../types/retrofit';

interface CostConfigProps {
  config: RetrofitCostConfig;
  onChange: (config: RetrofitCostConfig) => void;
}

export function CostConfig({ config, onChange }: CostConfigProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors rounded-t-lg"
      >
        <h2 className="text-xl font-semibold text-gray-800">Cost Configuration</h2>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-600" />
        )}
      </button>

      {isExpanded && (
        <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Overheads (%)
          </label>
          <input
            type="number"
            value={config.overheadsPercent}
            onChange={(e) => onChange({ ...config, overheadsPercent: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            min="0"
            step="0.1"
          />
          <p className="text-xs text-gray-500 mt-1">Applied to base cost</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Risk & Contingency (%)
          </label>
          <input
            type="number"
            value={config.riskContingencyPercent || 0}
            onChange={(e) => onChange({ ...config, riskContingencyPercent: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            min="0"
            step="0.1"
          />
          <p className="text-xs text-gray-500 mt-1">Applied to base cost</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            PM & Generals (%)
          </label>
          <input
            type="number"
            value={config.pmGeneralsPercent || 0}
            onChange={(e) => onChange({ ...config, pmGeneralsPercent: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            min="0"
            step="0.1"
          />
          <p className="text-xs text-gray-500 mt-1">Applied to base cost</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Performance Bond (%)
          </label>
          <input
            type="number"
            value={config.performanceBondPercent}
            onChange={(e) => onChange({ ...config, performanceBondPercent: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            min="0"
            step="0.1"
          />
          <p className="text-xs text-gray-500 mt-1">Applied to base cost</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Insurance (%)
          </label>
          <input
            type="number"
            value={config.insurancePercent}
            onChange={(e) => onChange({ ...config, insurancePercent: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            min="0"
            step="0.1"
          />
          <p className="text-xs text-gray-500 mt-1">Applied to base cost</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Warranty (%)
          </label>
          <input
            type="number"
            value={config.warrantyPercent}
            onChange={(e) => onChange({ ...config, warrantyPercent: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            min="0"
            step="0.1"
          />
          <p className="text-xs text-gray-500 mt-1">Applied to base cost</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Profit Margin (%)
          </label>
          <input
            type="number"
            value={config.profitPercent}
            onChange={(e) => onChange({ ...config, profitPercent: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            min="0"
            step="0.1"
          />
          <p className="text-xs text-gray-500 mt-1">Applied to subtotal</p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Cost Calculation Flow</h3>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Base Cost = All Direct Costs (Manpower, Materials, Subcontractors, etc.)</li>
          <li>Add: Overheads, Risk & Contingency, PM & Generals, Performance Bond, Insurance, Warranty (% of Base Cost)</li>
          <li>Subtotal = Base Cost + All Additions</li>
          <li>Add: Profit (% of Subtotal)</li>
          <li>Selling Price (Grand Total) = Subtotal + Profit</li>
        </ol>
      </div>
        </div>
      )}
    </div>
  );
}
