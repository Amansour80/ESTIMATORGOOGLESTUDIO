import React, { useState } from 'react';
import { X, Truck, DollarSign } from 'lucide-react';
import { createActualCost, createEquipmentCostEntry } from '../../utils/budgetDatabase';

interface Activity {
  id: string;
  name: string;
}

interface LogEquipmentCostModalProps {
  projectId: string;
  activities: Activity[];
  onClose: () => void;
  onSuccess: () => void;
}

export function LogEquipmentCostModal({ projectId, activities, onClose, onSuccess }: LogEquipmentCostModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    activity_id: '',
    equipment_type: '',
    equipment_name: '',
    rental_days: 1,
    daily_rate: 0,
    supplier: '',
    description: '',
    cost_date: new Date().toISOString().split('T')[0],
    status: 'draft' as 'draft' | 'pending_approval'
  });

  const calculateTotalCost = () => {
    return formData.rental_days * formData.daily_rate;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.equipment_name || !formData.activity_id) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const totalCost = calculateTotalCost();

      const actualCost = await createActualCost({
        project_id: projectId,
        activity_id: formData.activity_id || undefined,
        cost_type: 'equipment',
        description: formData.description || `${formData.equipment_name} - ${formData.rental_days} days`,
        quantity: formData.rental_days,
        unit_price: formData.daily_rate,
        total_amount: totalCost,
        cost_date: formData.cost_date,
        status: formData.status
      });

      await createEquipmentCostEntry({
        actual_cost_id: actualCost.id,
        equipment_type: formData.equipment_type,
        equipment_name: formData.equipment_name,
        rental_days: formData.rental_days,
        daily_rate: formData.daily_rate,
        total_cost: totalCost,
        supplier: formData.supplier || undefined
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating equipment cost entry:', error);
      alert('Failed to create equipment cost entry');
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
            <div className="p-2 bg-purple-100 rounded-lg">
              <Truck className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Log Equipment Costs</h2>
              <p className="text-sm text-slate-600">Record equipment rental and logistics expenses</p>
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

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Equipment Type *
              </label>
              <select
                value={formData.equipment_type}
                onChange={(e) => setFormData({ ...formData, equipment_type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select type...</option>
                <option value="Heavy Machinery">Heavy Machinery</option>
                <option value="Crane">Crane</option>
                <option value="Forklift">Forklift</option>
                <option value="Scaffolding">Scaffolding</option>
                <option value="Vehicle">Vehicle</option>
                <option value="Tools">Tools</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Equipment Name *
              </label>
              <input
                type="text"
                value={formData.equipment_name}
                onChange={(e) => setFormData({ ...formData, equipment_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 50-Ton Crane, Forklift 3T"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Rental Days *
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={formData.rental_days}
                onChange={(e) => setFormData({ ...formData, rental_days: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Daily Rate (AED) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.daily_rate}
                onChange={(e) => setFormData({ ...formData, daily_rate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Rental Date *
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
                Supplier/Vendor
              </label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Equipment rental company"
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
                placeholder="Additional details about the equipment rental..."
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

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-slate-900">Total Cost:</span>
              </div>
              <span className="text-2xl font-bold text-purple-600">
                {formatCurrency(calculateTotalCost())}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-2">
              {formData.rental_days} days × {formatCurrency(formData.daily_rate)}
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
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? 'Saving...' : 'Log Equipment Cost'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
