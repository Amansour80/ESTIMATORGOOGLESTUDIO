import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { LogisticsItem } from '../../types/retrofit';

interface LogisticsItemsProps {
  items: LogisticsItem[];
  onChange: (items: LogisticsItem[]) => void;
}

export function LogisticsItems({ items, onChange }: LogisticsItemsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const addItem = () => {
    const newItem: LogisticsItem = {
      id: crypto.randomUUID(),
      description: '',
      quantity: 0,
      unitRate: 0,
      notes: '',
    };
    onChange([...items, newItem]);
  };

  const updateItem = (id: string, updates: Partial<LogisticsItem>) => {
    onChange(items.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const removeItem = (id: string) => {
    onChange(items.filter((i) => i.id !== id));
  };

  const totalCost = items.reduce((sum, item) => sum + item.quantity * item.unitRate, 0);

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors rounded-t-lg"
      >
        <h2 className="text-xl font-semibold text-gray-800">Logistics & Other Costs</h2>
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
            >
              <Plus size={18} />
              Add Item
            </button>
          </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-2 text-left font-medium text-gray-700">Description</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Quantity</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Unit Rate (AED)</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Total (AED)</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Notes</th>
              <th className="px-3 py-2 text-center font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-gray-200">
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, { description: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Crane rental, Scaffolding"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                    className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={item.unitRate}
                    onChange={(e) => updateItem(item.id, { unitRate: parseFloat(e.target.value) || 0 })}
                    className="w-28 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                  />
                </td>
                <td className="px-3 py-2 font-medium text-gray-800">
                  {(item.quantity * item.unitRate).toLocaleString()}
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={item.notes}
                    onChange={(e) => updateItem(item.id, { notes: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional notes"
                  />
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
            ))}
            {items.length > 0 && (
              <tr className="bg-gray-50 font-bold">
                <td colSpan={3} className="px-3 py-2 text-right">
                  TOTAL LOGISTICS COST:
                </td>
                <td className="px-3 py-2 text-gray-800">{totalCost.toLocaleString()} AED</td>
                <td colSpan={2}></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

          {items.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No logistics items added yet. Click "Add Item" to get started.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
