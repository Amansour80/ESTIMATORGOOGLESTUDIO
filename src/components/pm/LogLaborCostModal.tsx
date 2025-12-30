import React, { useState, useEffect } from 'react';
import { X, Users, Calendar, DollarSign } from 'lucide-react';
import { createActualCost, createLaborCostEntry } from '../../utils/budgetDatabase';
import { loadRetrofitLabor } from '../../utils/laborLibraryDatabase';

interface Activity {
  id: string;
  name: string;
}

interface LogLaborCostModalProps {
  projectId: string;
  organizationId: string;
  activities: Activity[];
  onClose: () => void;
  onSuccess: () => void;
}

interface LaborLibraryItem {
  id: string;
  name: string;
  role: string;
  hourly_rate?: number;
  monthly_salary: number;
}

export function LogLaborCostModal({ projectId, organizationId, activities, onClose, onSuccess }: LogLaborCostModalProps) {
  const [loading, setLoading] = useState(false);
  const [laborLibrary, setLaborLibrary] = useState<LaborLibraryItem[]>([]);
  const [formData, setFormData] = useState({
    activity_id: '',
    manpower_type: '',
    trade: '',
    num_workers: 1,
    calculation_type: 'hourly' as 'hourly' | 'daily',
    hours_worked: 8,
    days_worked: 1,
    rate_per_hour: 0,
    rate_per_day: 0,
    work_date_start: new Date().toISOString().split('T')[0],
    work_date_end: '',
    description: '',
    status: 'draft' as 'draft' | 'pending_approval'
  });

  useEffect(() => {
    loadLaborLibrary();
  }, [organizationId]);

  const loadLaborLibrary = async () => {
    try {
      const data = await loadRetrofitLabor(organizationId);
      setLaborLibrary(data);
    } catch (error) {
      console.error('Error loading labor library:', error);
    }
  };

  const handleManpowerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selected = laborLibrary.find(l => l.id === selectedId);

    if (selected) {
      const hourlyRate = selected.hourly_rate || (selected.monthly_salary / 22 / 8);
      const dailyRate = hourlyRate * 8;

      setFormData(prev => ({
        ...prev,
        manpower_type: selected.name,
        trade: selected.role || '',
        rate_per_hour: hourlyRate,
        rate_per_day: dailyRate
      }));
    }
  };

  const calculateTotalCost = () => {
    if (formData.calculation_type === 'hourly') {
      return formData.num_workers * formData.hours_worked * formData.rate_per_hour;
    } else {
      return formData.num_workers * formData.days_worked * formData.rate_per_day;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.manpower_type || !formData.activity_id) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const totalCost = calculateTotalCost();

      const actualCost = await createActualCost({
        project_id: projectId,
        activity_id: formData.activity_id || undefined,
        cost_type: 'labor',
        description: formData.description || `${formData.manpower_type} - ${formData.num_workers} worker(s)`,
        quantity: formData.num_workers,
        unit_price: formData.calculation_type === 'hourly' ? formData.rate_per_hour : formData.rate_per_day,
        total_amount: totalCost,
        cost_date: formData.work_date_start,
        status: formData.status
      });

      await createLaborCostEntry({
        actual_cost_id: actualCost.id,
        manpower_type: formData.manpower_type,
        trade: formData.trade,
        num_workers: formData.num_workers,
        hours_worked: formData.calculation_type === 'hourly' ? formData.hours_worked : undefined,
        days_worked: formData.calculation_type === 'daily' ? formData.days_worked : undefined,
        rate_per_hour: formData.calculation_type === 'hourly' ? formData.rate_per_hour : undefined,
        rate_per_day: formData.calculation_type === 'daily' ? formData.rate_per_day : undefined,
        total_cost: totalCost,
        work_date_start: formData.work_date_start,
        work_date_end: formData.work_date_end || undefined
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating labor cost entry:', error);
      alert('Failed to create labor cost entry');
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
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Log Labor Costs</h2>
              <p className="text-sm text-slate-600">Record manpower hours and costs</p>
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
                Manpower Type *
              </label>
              <select
                onChange={handleManpowerSelect}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select from library...</option>
                {laborLibrary.map(item => {
                  const hourlyRate = item.hourly_rate || (item.monthly_salary / 22 / 8);
                  return (
                    <option key={item.id} value={item.id}>
                      {item.name} {item.role ? `(${item.role})` : ''} - {formatCurrency(hourlyRate)}/hr
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Role/Position
              </label>
              <input
                type="text"
                value={formData.manpower_type}
                onChange={(e) => setFormData({ ...formData, manpower_type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Senior Technician"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Trade
              </label>
              <input
                type="text"
                value={formData.trade}
                onChange={(e) => setFormData({ ...formData, trade: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., HVAC, Electrical"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Number of Workers *
              </label>
              <input
                type="number"
                min="1"
                value={formData.num_workers}
                onChange={(e) => setFormData({ ...formData, num_workers: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Calculation Type *
              </label>
              <select
                value={formData.calculation_type}
                onChange={(e) => setFormData({ ...formData, calculation_type: e.target.value as 'hourly' | 'daily' })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
              </select>
            </div>

            {formData.calculation_type === 'hourly' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Hours Worked *
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={formData.hours_worked}
                    onChange={(e) => setFormData({ ...formData, hours_worked: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Rate per Hour (AED) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.rate_per_hour}
                    onChange={(e) => setFormData({ ...formData, rate_per_hour: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Days Worked *
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={formData.days_worked}
                    onChange={(e) => setFormData({ ...formData, days_worked: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Rate per Day (AED) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.rate_per_day}
                    onChange={(e) => setFormData({ ...formData, rate_per_day: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Work Date Start *
              </label>
              <input
                type="date"
                value={formData.work_date_start}
                onChange={(e) => setFormData({ ...formData, work_date_start: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Work Date End (Optional)
              </label>
              <input
                type="date"
                value={formData.work_date_end}
                onChange={(e) => setFormData({ ...formData, work_date_end: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                placeholder="Additional details about the work..."
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

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-slate-900">Total Cost:</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">
                {formatCurrency(calculateTotalCost())}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-2">
              {formData.num_workers} worker(s) × {formData.calculation_type === 'hourly' ? `${formData.hours_worked} hours` : `${formData.days_worked} days`} × {formatCurrency(formData.calculation_type === 'hourly' ? formData.rate_per_hour : formData.rate_per_day)}
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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? 'Saving...' : 'Log Labor Cost'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
