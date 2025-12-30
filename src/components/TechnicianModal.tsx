import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import SkillTagSelector from './SkillTagSelector';
import { OrgFMTechnician, OrgRetrofitLabor, OrgCleaner } from '../utils/laborLibraryDatabase';
import ValidatedInput from './ValidatedInput';

interface TechnicianModalProps {
  technician: OrgFMTechnician | null;
  onClose: () => void;
  onSave: (tech: Omit<OrgFMTechnician, 'id'> | OrgFMTechnician) => Promise<void>;
}

export function TechnicianModal({ technician, onClose, onSave }: TechnicianModalProps) {
  const [formData, setFormData] = useState<Partial<OrgFMTechnician>>({
    name: '',
    skill_tags: [],
    monthly_salary: 0,
    additional_cost: 0,
    expected_overtime_hours_per_month: 0,
    can_supervise: false,
    input_base_count: 0,
    notes: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (technician) {
      setFormData({
        ...technician,
        skill_tags: technician.skill_tags || [],
        notes: technician.notes || '',
      });
    }
  }, [technician]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      setError('Name is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (technician?.id) {
        await onSave({ ...formData, id: technician.id } as OrgFMTechnician);
      } else {
        await onSave(formData as Omit<OrgFMTechnician, 'id'>);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save technician');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">
            {technician ? 'Edit FM Technician' : 'Add FM Technician'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Technician Type *
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Senior HVAC Technician, Chiller Specialist, Plumber"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the type/role, not individual names (e.g., "HVAC Technician" not "Ahmad")
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills *
              </label>
              <SkillTagSelector
                selectedTags={formData.skill_tags || []}
                onChange={(tags) => setFormData({ ...formData, skill_tags: tags })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Select all relevant skills for accurate auto-assignment
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.can_supervise || false}
                  onChange={(e) =>
                    setFormData({ ...formData, can_supervise: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">Can Supervise</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Supervisors excluded from auto-assignment
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <ValidatedInput
                  label="Monthly Salary (AED)"
                  type="number"
                  value={formData.monthly_salary || 0}
                  onChange={(value) => setFormData({ ...formData, monthly_salary: Number(value) })}
                  min={0}
                  step={1}
                />

                <ValidatedInput
                  label="Additional Cost (AED)"
                  type="number"
                  value={formData.additional_cost || 0}
                  onChange={(value) => setFormData({ ...formData, additional_cost: Number(value) })}
                  min={0}
                  step={1}
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">CTC (Cost To Company):</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {((formData.monthly_salary || 0) + (formData.additional_cost || 0)).toFixed(2)} AED/month
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Hourly Rate:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {(((formData.monthly_salary || 0) + (formData.additional_cost || 0)) / 208).toFixed(2)} AED/hour
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Hourly rate calculated as CTC ÷ 208 hours. Used for output-based projects.
                </p>
              </div>
            </div>

            <ValidatedInput
              label="Expected Overtime Hours/Month"
              type="number"
              value={formData.expected_overtime_hours_per_month || 0}
              onChange={(value) =>
                setFormData({ ...formData, expected_overtime_hours_per_month: Number(value) })
              }
              min={0}
              step={0.5}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Optional notes about this technician type..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={isSaving}
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Technician'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface RetrofitLaborModalProps {
  labor: OrgRetrofitLabor | null;
  onClose: () => void;
  onSave: (labor: Omit<OrgRetrofitLabor, 'id'> | OrgRetrofitLabor) => Promise<void>;
}

export function RetrofitLaborModal({ labor, onClose, onSave }: RetrofitLaborModalProps) {
  const [formData, setFormData] = useState<Partial<OrgRetrofitLabor>>({
    name: '',
    role: '',
    skill_tags: [],
    monthly_salary: 0,
    additional_cost: 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (labor) {
      setFormData({
        ...labor,
        skill_tags: labor.skill_tags || [],
      });
    }
  }, [labor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      setError('Name is required');
      return;
    }

    if (!formData.role?.trim()) {
      setError('Role is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (labor?.id) {
        await onSave({ ...formData, id: labor.id } as OrgRetrofitLabor);
      } else {
        await onSave(formData as Omit<OrgRetrofitLabor, 'id'>);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save labor type');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">
            {labor ? 'Edit Retrofit Labor' : 'Add Retrofit Labor'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Labor Type *
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Electrician, Mason, Carpenter"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the type/role, not individual names
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <input
                type="text"
                value={formData.role || ''}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Technician, Foreman, Supervisor"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills *
              </label>
              <SkillTagSelector
                selectedTags={formData.skill_tags || []}
                onChange={(tags) => setFormData({ ...formData, skill_tags: tags })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Select all relevant skills for accurate auto-assignment
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <ValidatedInput
                label="Monthly Salary (AED)"
                type="number"
                value={formData.monthly_salary || 0}
                onChange={(value) => setFormData({ ...formData, monthly_salary: Number(value) })}
                min={0}
                step={1}
              />

              <ValidatedInput
                label="Additional Cost (AED)"
                type="number"
                value={formData.additional_cost || 0}
                onChange={(value) => setFormData({ ...formData, additional_cost: Number(value) })}
                min={0}
                step={1}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={isSaving}
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Labor Type'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface CleanerModalProps {
  cleaner: OrgCleaner | null;
  onClose: () => void;
  onSave: (cleaner: Omit<OrgCleaner, 'id'> | OrgCleaner) => Promise<void>;
}

export function CleanerModal({ cleaner, onClose, onSave }: CleanerModalProps) {
  const [formData, setFormData] = useState<Partial<OrgCleaner>>({
    name: '',
    skill_tags: [],
    monthly_salary: 0,
    additional_cost: 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cleaner) {
      setFormData({
        ...cleaner,
        skill_tags: cleaner.skill_tags || [],
      });
    }
  }, [cleaner]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      setError('Name is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (cleaner?.id) {
        await onSave({ ...formData, id: cleaner.id } as OrgCleaner);
      } else {
        await onSave(formData as Omit<OrgCleaner, 'id'>);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save cleaner type');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">
            {cleaner ? 'Edit Cleaner/HK' : 'Add Cleaner/HK'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cleaner Type *
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Housekeeping Staff, Janitor, Supervisor"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the type/role, not individual names
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills *
              </label>
              <SkillTagSelector
                selectedTags={formData.skill_tags || []}
                onChange={(tags) => setFormData({ ...formData, skill_tags: tags })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Select all relevant skills for accurate auto-assignment
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <ValidatedInput
                label="Monthly Salary (AED)"
                type="number"
                value={formData.monthly_salary || 0}
                onChange={(value) => setFormData({ ...formData, monthly_salary: Number(value) })}
                min={0}
                step={1}
              />

              <ValidatedInput
                label="Additional Cost (AED)"
                type="number"
                value={formData.additional_cost || 0}
                onChange={(value) => setFormData({ ...formData, additional_cost: Number(value) })}
                min={0}
                step={1}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={isSaving}
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Cleaner Type'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
