import React, { useState } from 'react';
import { Settings, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { LaborType } from '../../types/retrofit';

interface LaborLibraryProps {
  laborTypes: LaborType[];
  onChange: (laborTypes: LaborType[]) => void;
}

export function LaborLibrary({ laborTypes, onChange }: LaborLibraryProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const updateLabor = (id: string, updates: Partial<LaborType>) => {
    onChange(laborTypes.map((labor) => (labor.id === id ? { ...labor, ...updates } : labor)));
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors rounded-t-lg"
      >
        <div className="text-left">
          <h2 className="text-xl font-semibold text-gray-800">Labor Library</h2>
          <p className="text-sm text-gray-600 mt-1">Read-only: Loaded from organization settings</p>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-600 flex-shrink-0 ml-4" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-600 flex-shrink-0 ml-4" />
        )}
      </button>

      {isExpanded && (
        <div className="p-6">
          <div className="flex justify-end mb-4">
            <a
              href="/settings"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
            >
              <Settings className="w-4 h-4" />
              Manage in Settings
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

      {laborTypes.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-yellow-800">
            No labor types found. Please add labor types in Settings → Labor Library.
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Role</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Hourly Rate (AED)</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Notes</th>
              <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {laborTypes.map((labor) => (
              <tr key={labor.id} className="border-b border-gray-200">
                <td className="px-4 py-2">
                  <div className="px-2 py-1 bg-gray-100 text-gray-700 rounded border border-gray-300">
                    {labor.name || labor.role}
                  </div>
                </td>
                <td className="px-4 py-2">
                  <div className="px-2 py-1 bg-gray-100 text-gray-700 rounded border border-gray-300">
                    {labor.hourlyRate.toFixed(2)}
                  </div>
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={labor.notes}
                    onChange={(e) => updateLabor(labor.id, { notes: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-yellow-50"
                    placeholder="Project notes"
                  />
                </td>
                <td className="px-4 py-2 text-center">
                  <div className="text-gray-400 text-xs">Read-only</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
        </div>
      )}
    </div>
  );
}
