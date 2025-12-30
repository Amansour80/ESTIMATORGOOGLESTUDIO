import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { CostConfig } from '../../types/fm';

interface Props {
  config: CostConfig;
  onChange: (config: CostConfig) => void;
}

export default function CostConfigFM({ config, onChange }: Props) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Overheads & Markup</h2>
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
      <div className="space-y-6">
        <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
          <h3 className="font-medium text-gray-800 mb-3">In-House Services</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Overheads (%)
              </label>
              <input
                type="number"
                value={config.inHouse.overheadsPercent}
                onChange={(e) =>
                  onChange({
                    ...config,
                    inHouse: { ...config.inHouse, overheadsPercent: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-yellow-50"
                min="0"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Markup / Profit (%)
              </label>
              <input
                type="number"
                value={config.inHouse.markupPercent}
                onChange={(e) =>
                  onChange({
                    ...config,
                    inHouse: { ...config.inHouse, markupPercent: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-yellow-50"
                min="0"
                step="0.1"
              />
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4 bg-green-50">
          <h3 className="font-medium text-gray-800 mb-3">Subcontract Services</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Overheads (%)
              </label>
              <input
                type="number"
                value={config.subcontract.overheadsPercent}
                onChange={(e) =>
                  onChange({
                    ...config,
                    subcontract: { ...config.subcontract, overheadsPercent: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-yellow-50"
                min="0"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Markup / Profit (%)
              </label>
              <input
                type="number"
                value={config.subcontract.markupPercent}
                onChange={(e) =>
                  onChange({
                    ...config,
                    subcontract: { ...config.subcontract, markupPercent: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-yellow-50"
                min="0"
                step="0.1"
              />
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
