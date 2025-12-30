import React, { useState, useEffect } from 'react';
import { X, FileText, DollarSign, Plus } from 'lucide-react';
import { createActualCost, getCostCategories, createCostCategory } from '../../utils/budgetDatabase';
import { useOrganization } from '../../contexts/OrganizationContext';
import { formatCurrency } from '../../utils/currencyFormatter';

interface Activity {
  id: string;
  name: string;
}

interface LogOverheadCostModalProps {
  projectId: string;
  organizationId: string;
  activities: Activity[];
  onClose: () => void;
  onSuccess: () => void;
}

export function LogOverheadCostModal({ projectId, organizationId, activities, onClose, onSuccess }: LogOverheadCostModalProps) {
  const { currentOrganization } = useOrganization();
  const currency = currentOrganization?.currency || 'AED';
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; category_name: string }>>([]);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [formData, setFormData] = useState({
    activity_id: '',
    cost_category_id: '',
    category_name: '',
    description: '',
    total_amount: 0,
    cost_date: new Date().toISOString().split('T')[0],
    status: 'draft' as 'draft' | 'pending_approval'
  });

  useEffect(() => {
    loadCategories();
  }, [organizationId]);

  const loadCategories = async () => {
    try {
      const data = await getCostCategories(organizationId);
      setCategories(data);
    } catch (error) {
      console.error('Error loading cost categories:', error);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const newCategory = await createCostCategory({
        organization_id: organizationId,
        category_name: newCategoryName,
        category_type: 'custom',
        is_active: true
      });

      setCategories([...categories, newCategory]);
      setFormData({ ...formData, cost_category_id: newCategory.id, category_name: newCategory.category_name });
      setNewCategoryName('');
      setShowNewCategory(false);
    } catch (error) {
      console.error('Error creating cost category:', error);
      alert('Failed to create category');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description || !formData.activity_id) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await createActualCost({
        project_id: projectId,
        activity_id: formData.activity_id || undefined,
        cost_type: 'overhead',
        cost_category_id: formData.cost_category_id || undefined,
        description: formData.description,
        total_amount: formData.total_amount,
        cost_date: formData.cost_date,
        status: formData.status
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating overhead cost entry:', error);
      alert('Failed to create cost entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Log Overhead Costs</h2>
              <p className="text-sm text-slate-600">Indirect costs like supervision, insurance, bonds, etc.</p>
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
                Cost Category
              </label>
              {!showNewCategory ? (
                <div className="flex gap-2">
                  <select
                    value={formData.cost_category_id}
                    onChange={(e) => {
                      const selected = categories.find(c => c.id === e.target.value);
                      setFormData({
                        ...formData,
                        cost_category_id: e.target.value,
                        category_name: selected?.category_name || ''
                      });
                    }}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select category (optional)...</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.category_name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewCategory(true)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    New
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter new category name..."
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewCategory(false);
                      setNewCategoryName('');
                    }}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Describe the overhead expense (e.g., supervision, insurance, bonds)..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Total Amount ({currency}) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.total_amount}
                onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Cost Date *
              </label>
              <input
                type="date"
                value={formData.cost_date}
                onChange={(e) => setFormData({ ...formData, cost_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
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

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-slate-600" />
                <span className="font-medium text-slate-900">Total Cost:</span>
              </div>
              <span className="text-2xl font-bold text-slate-900">
                {formatCurrency(formData.total_amount, currency)}
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
              className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? 'Saving...' : 'Log Cost'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
