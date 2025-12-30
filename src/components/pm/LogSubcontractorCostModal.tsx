import React, { useState } from 'react';
import { X, Briefcase, DollarSign } from 'lucide-react';
import { createActualCost, createSubcontractorCostEntry } from '../../utils/budgetDatabase';

interface Activity {
  id: string;
  name: string;
}

interface LogSubcontractorCostModalProps {
  projectId: string;
  activities: Activity[];
  onClose: () => void;
  onSuccess: () => void;
}

export function LogSubcontractorCostModal({ projectId, activities, onClose, onSuccess }: LogSubcontractorCostModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    activity_id: '',
    subcontractor_name: '',
    invoice_number: '',
    work_description: '',
    gross_amount: 0,
    progress_percentage: 0,
    retention_percentage: 5,
    description: '',
    cost_date: new Date().toISOString().split('T')[0],
    status: 'draft' as 'draft' | 'pending_approval'
  });

  const calculateRetention = () => {
    return (formData.gross_amount * formData.retention_percentage) / 100;
  };

  const calculateNetPayable = () => {
    return formData.gross_amount - calculateRetention();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subcontractor_name || !formData.activity_id || !formData.work_description) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const retention_amount = calculateRetention();
      const net_payable = calculateNetPayable();

      const actualCost = await createActualCost({
        project_id: projectId,
        activity_id: formData.activity_id || undefined,
        cost_type: 'subcontractor',
        description: formData.description || `${formData.subcontractor_name} - ${formData.work_description}`,
        quantity: 1,
        unit_price: net_payable,
        total_amount: net_payable,
        cost_date: formData.cost_date,
        status: formData.status
      });

      await createSubcontractorCostEntry({
        actual_cost_id: actualCost.id,
        subcontractor_name: formData.subcontractor_name,
        invoice_number: formData.invoice_number || undefined,
        work_description: formData.work_description,
        progress_percentage: formData.progress_percentage,
        retention_percentage: formData.retention_percentage,
        retention_amount,
        gross_amount: formData.gross_amount,
        net_payable
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating subcontractor cost entry:', error);
      alert('Failed to create subcontractor cost entry');
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
            <div className="p-2 bg-orange-100 rounded-lg">
              <Briefcase className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Log Subcontractor Costs</h2>
              <p className="text-sm text-slate-600">Record subcontractor invoices and payments</p>
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
                Subcontractor Name *
              </label>
              <input
                type="text"
                value={formData.subcontractor_name}
                onChange={(e) => setFormData({ ...formData, subcontractor_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Company name"
                required
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
                Work Description *
              </label>
              <textarea
                value={formData.work_description}
                onChange={(e) => setFormData({ ...formData, work_description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="Describe the work performed..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Gross Amount (AED) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.gross_amount}
                onChange={(e) => setFormData({ ...formData, gross_amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Invoice Date *
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
                Progress Percentage
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={formData.progress_percentage}
                onChange={(e) => setFormData({ ...formData, progress_percentage: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Retention Percentage
              </label>
              <input
                type="number"
                min="0"
                max="20"
                step="0.5"
                value={formData.retention_percentage}
                onChange={(e) => setFormData({ ...formData, retention_percentage: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Additional Notes
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="Additional details..."
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

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Gross Amount:</span>
              <span className="font-medium text-slate-900">{formatCurrency(formData.gross_amount)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Retention ({formData.retention_percentage}%):</span>
              <span className="font-medium text-red-600">-{formatCurrency(calculateRetention())}</span>
            </div>
            <div className="h-px bg-orange-200"></div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-orange-600" />
                <span className="font-medium text-slate-900">Net Payable:</span>
              </div>
              <span className="text-2xl font-bold text-orange-600">
                {formatCurrency(calculateNetPayable())}
              </span>
            </div>
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
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? 'Saving...' : 'Log Subcontractor Cost'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
