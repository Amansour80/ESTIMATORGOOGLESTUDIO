import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Subcontractor, SubcontractorCategory, SubcontractorPricingMode } from '../../types/retrofit';

interface SubcontractorsConfigProps {
  subcontractors: Subcontractor[];
  onChange: (subcontractors: Subcontractor[]) => void;
}

const categories: { value: SubcontractorCategory; label: string }[] = [
  { value: 'hvac', label: 'HVAC' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'civil', label: 'Civil' },
  { value: 'testing_commissioning', label: 'Testing & Commissioning' },
  { value: 'other', label: 'Other' },
];

export function SubcontractorsConfig({ subcontractors, onChange }: SubcontractorsConfigProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const addSubcontractor = () => {
    const newSub: Subcontractor = {
      id: crypto.randomUUID(),
      category: 'hvac',
      description: '',
      pricingMode: 'lump_sum',
      lumpSumCost: 0,
      quantity: 0,
      unitCost: 0,
    };
    onChange([...subcontractors, newSub]);
  };

  const updateSubcontractor = (id: string, updates: Partial<Subcontractor>) => {
    onChange(subcontractors.map((sub) => (sub.id === id ? { ...sub, ...updates } : sub)));
  };

  const removeSubcontractor = (id: string) => {
    onChange(subcontractors.filter((s) => s.id !== id));
  };

  const calculateCost = (sub: Subcontractor): number => {
    return sub.pricingMode === 'lump_sum' ? sub.lumpSumCost : sub.quantity * sub.unitCost;
  };

  const totalCost = subcontractors.reduce((sum, sub) => sum + calculateCost(sub), 0);

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors rounded-t-lg"
      >
        <h2 className="text-xl font-semibold text-gray-800">Subcontractors</h2>
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
          onClick={addSubcontractor}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={18} />
          Add Subcontractor
        </button>
      </div>

      <div className="space-y-4">
        {subcontractors.map((sub) => (
          <div key={sub.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={sub.category}
                  onChange={(e) =>
                    updateSubcontractor(sub.id, { category: e.target.value as SubcontractorCategory })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={sub.description}
                  onChange={(e) => updateSubcontractor(sub.id, { description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Subcontractor description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pricing Mode</label>
                <select
                  value={sub.pricingMode}
                  onChange={(e) =>
                    updateSubcontractor(sub.id, { pricingMode: e.target.value as SubcontractorPricingMode })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="lump_sum">Lump Sum</option>
                  <option value="per_unit">Per Unit</option>
                </select>
              </div>

              {sub.pricingMode === 'lump_sum' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lump Sum Cost</label>
                  <input
                    type="number"
                    value={sub.lumpSumCost}
                    onChange={(e) => updateSubcontractor(sub.id, { lumpSumCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="100"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      value={sub.quantity}
                      onChange={(e) => updateSubcontractor(sub.id, { quantity: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost</label>
                    <input
                      type="number"
                      value={sub.unitCost}
                      onChange={(e) => updateSubcontractor(sub.id, { unitCost: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </>
              )}

              {sub.pricingMode === 'lump_sum' && <div></div>}

              <div className="flex items-end justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Cost</label>
                  <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-md font-medium text-blue-900">
                    {calculateCost(sub).toLocaleString()} AED
                  </div>
                </div>
                <button
                  onClick={() => removeSubcontractor(sub.id)}
                  className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {subcontractors.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-300 flex justify-end">
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Subcontractors Cost</p>
            <p className="text-2xl font-bold text-gray-800">{totalCost.toLocaleString()} AED</p>
          </div>
        </div>
      )}

          {subcontractors.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No subcontractors added yet. Click "Add Subcontractor" to get started.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
