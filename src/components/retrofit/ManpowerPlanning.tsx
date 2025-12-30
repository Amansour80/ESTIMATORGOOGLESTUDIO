import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { ManpowerItem, LaborType } from '../../types/retrofit';

interface ManpowerPlanningProps {
  manpowerItems: ManpowerItem[];
  laborLibrary: LaborType[];
  onChange: (items: ManpowerItem[]) => void;
}

export function ManpowerPlanning({ manpowerItems, laborLibrary, onChange }: ManpowerPlanningProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const addItem = () => {
    const newItem: ManpowerItem = {
      id: crypto.randomUUID(),
      laborTypeId: laborLibrary[0]?.id || '',
      description: '',
      estimatedHours: 0,
      mobilizationCost: 0,
      demobilizationCost: 0,
    };
    onChange([...manpowerItems, newItem]);
  };

  const updateItem = (id: string, updates: Partial<ManpowerItem>) => {
    onChange(manpowerItems.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const removeItem = (id: string) => {
    onChange(manpowerItems.filter((i) => i.id !== id));
  };

  const calculateItemCost = (item: ManpowerItem): number => {
    const labor = laborLibrary.find((l) => l.id === item.laborTypeId);
    if (!labor) return item.mobilizationCost + item.demobilizationCost;
    return item.estimatedHours * labor.hourlyRate + item.mobilizationCost + item.demobilizationCost;
  };

  const totalCost = manpowerItems.reduce((sum, item) => sum + calculateItemCost(item), 0);

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors rounded-t-lg"
      >
        <h2 className="text-xl font-semibold text-gray-800">Manpower Planning</h2>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-600" />
        )}
      </button>

      {isExpanded && (
        <div className="p-6">
          <div className="flex justify-end mb-4">
            <button
              onClick={addItem}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
              disabled={laborLibrary.length === 0}
            >
              <Plus size={18} />
              Add Manpower Item
        </button>
      </div>

      {laborLibrary.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-yellow-800 text-sm">
            Please define labor types in the Labor Library before adding manpower items.
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-2 text-left font-medium text-gray-700">Description</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Labor Type</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Hours</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Rate/Hr</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Mob Cost</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Demob Cost</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Total</th>
              <th className="px-3 py-2 text-center font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {manpowerItems.map((item) => {
              const labor = laborLibrary.find((l) => l.id === item.laborTypeId);
              return (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, { description: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="Work description"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={item.laborTypeId}
                      onChange={(e) => updateItem(item.id, { laborTypeId: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    >
                      {laborLibrary.map((labor) => (
                        <option key={labor.id} value={labor.id}>
                          {labor.role}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={item.estimatedHours}
                      onChange={(e) => updateItem(item.id, { estimatedHours: parseFloat(e.target.value) || 0 })}
                      className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.5"
                    />
                  </td>
                  <td className="px-3 py-2 text-gray-700">{labor ? labor.hourlyRate.toLocaleString() : '-'}</td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={item.mobilizationCost}
                      onChange={(e) => updateItem(item.id, { mobilizationCost: parseFloat(e.target.value) || 0 })}
                      className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="100"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={item.demobilizationCost}
                      onChange={(e) =>
                        updateItem(item.id, { demobilizationCost: parseFloat(e.target.value) || 0 })
                      }
                      className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="100"
                    />
                  </td>
                  <td className="px-3 py-2 font-medium text-gray-800">
                    {calculateItemCost(item).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 inline-flex items-center gap-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {manpowerItems.length > 0 && (
              <tr className="bg-gray-50 font-bold">
                <td colSpan={6} className="px-3 py-2 text-right">
                  TOTAL MANPOWER COST:
                </td>
                <td className="px-3 py-2 text-gray-800">{totalCost.toLocaleString()} AED</td>
                <td></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

          {manpowerItems.length === 0 && laborLibrary.length > 0 && (
            <div className="text-center text-gray-500 py-8">
              No manpower items added yet. Click "Add Manpower Item" to get started.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
