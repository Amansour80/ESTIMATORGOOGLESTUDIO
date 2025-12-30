import React, { useState } from 'react';
import { X, Package, DollarSign } from 'lucide-react';
import { createActualCost, createMaterialCostEntry } from '../../utils/budgetDatabase';

interface Activity {
  id: string;
  name: string;
}

interface LogMaterialCostModalProps {
  projectId: string;
  activities: Activity[];
  onClose: () => void;
  onSuccess: () => void;
}

export function LogMaterialCostModal({ projectId, activities, onClose, onSuccess }: LogMaterialCostModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    activity_id: '',
    material_name: '',
    quantity: 1,
    unit: '',
    unit_price: 0,
    supplier: '',
    invoice_number: '',
    description: '',
    cost_date: new Date().toISOString().split('T')[0],
    status: 'draft' as 'draft' | 'pending_approval'
  });

  const calculateTotalCost = () => {
    return formData.quantity * formData.unit_price;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.material_name || !formData.activity_id || !formData.unit) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const totalCost = calculateTotalCost();

      const actualCost = await createActualCost({
        project_id: projectId,
        activity_id: formData.activity_id || undefined,
        cost_type: 'material',
        description: formData.description || `${formData.material_name} - ${formData.quantity} ${formData.unit}`,
        quantity: formData.quantity,
        unit_price: formData.unit_price,
        total_amount: totalCost,
        cost_date: formData.cost_date,
        status: formData.status
      });

      await createMaterialCostEntry({
        actual_cost_id: actualCost.id,
        material_name: formData.material_name,
        quantity: formData.quantity,
        unit: formData.unit,
        unit_price: formData.unit_price,
        total_cost: totalCost,
        supplier: formData.supplier || undefined,
        invoice_number: formData.invoice_number || undefined
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating material cost entry:', error);
      alert('Failed to create material cost entry');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Log Material Costs</h2>
              <p className="text-sm text-slate-600">Record material purchases and expenses</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Activity *
              </label>
              <select
                value={formData.activity_id}
                onChange={(e) => setFormData({ ...formData, activity_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">{activities.length === 0 ? 'No activities available - create activities first' : 'Choose activity...'}</option>
                {activities.map(activity => (
                  <option key={activity.id} value={activity.id}>
                    {activity.name}
                  </option>
                ))}
              </select>
              {activities.length === 0 && (
                <p className="mt-1 text-sm text-red-600">
                  Please create activities in the Activities tab before logging costs
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Material Name *
              </label>
              <input
                type="text"
                value={formData.material_name}
                onChange={(e) => setFormData({ ...formData, material_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., PVC Pipes, Cement, Steel Beams"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Quantity *
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Unit *
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., m, kg, pcs, m²"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Unit Price (AED) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Purchase Date *
              </label>
              <input
                type="date"
                value={formData.cost_date}
                onChange={(e) => setFormData({ ...formData, cost_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Supplier
              </label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Supplier name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Invoice Number
              </label>
              <input
                type="text"
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="INV-12345"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="Additional details about the material purchase..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'pending_approval' })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="draft">Save as Draft</option>
                <option value="pending_approval">Submit for Approval</option>
              </select>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="font-medium text-slate-900">Total Cost:</span>
              </div>
              <span className="text-2xl font-bold text-green-600">
                {formatCurrency(calculateTotalCost())}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-2">
              {formData.quantity} {formData.unit} × {formatCurrency(formData.unit_price)}
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? 'Saving...' : 'Log Material Cost'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
