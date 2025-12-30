import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { SupervisionRole, LaborType } from '../../types/retrofit';
import { formatCurrency } from '../../utils/currencyFormatter';

interface SupervisionConfigProps {
  supervisionRoles: SupervisionRole[];
  laborLibrary: LaborType[];
  onUpdate: (roles: SupervisionRole[]) => void;
  readOnly?: boolean;
}

export default function SupervisionConfig({ supervisionRoles, laborLibrary, onUpdate, readOnly = false }: SupervisionConfigProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<SupervisionRole | null>(null);

  const handleAdd = () => {
    const newRole: SupervisionRole = {
      id: crypto.randomUUID(),
      laborTypeId: laborLibrary[0]?.id || '',
      count: 1,
      durationMonths: 3,
    };
    onUpdate([...supervisionRoles, newRole]);
    setEditingId(newRole.id);
    setEditForm(newRole);
  };

  const handleEdit = (role: SupervisionRole) => {
    setEditingId(role.id);
    setEditForm({ ...role });
  };

  const handleSave = () => {
    if (editForm) {
      onUpdate(supervisionRoles.map(r => r.id === editForm.id ? editForm : r));
      setEditingId(null);
      setEditForm(null);
    }
  };

  const handleCancel = () => {
    if (editForm && supervisionRoles.find(r => r.id === editForm.id && r.count === 1 && r.durationMonths === 3)) {
      onUpdate(supervisionRoles.filter(r => r.id !== editForm.id));
    }
    setEditingId(null);
    setEditForm(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this supervision role?')) {
      onUpdate(supervisionRoles.filter(r => r.id !== id));
    }
  };

  const calculateRoleCost = (role: SupervisionRole): number => {
    const laborType = laborLibrary.find(l => l.id === role.laborTypeId);
    if (!laborType) return 0;
    const monthlyCost = (laborType.monthlySalary || 0) + (laborType.additionalCost || 0);
    const hourlyRateFallback = laborType.hourlyRate * 160;
    const costPerMonth = monthlyCost > 0 ? monthlyCost : hourlyRateFallback;
    return role.count * role.durationMonths * costPerMonth;
  };

  const totalCost = supervisionRoles.reduce((sum, role) => sum + calculateRoleCost(role), 0);

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors rounded-t-lg"
      >
        <div className="text-left">
          <h3 className="text-lg font-semibold text-slate-900">Supervision & Management</h3>
          <p className="text-sm text-slate-600">Define supervision and management roles for the project</p>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-600 flex-shrink-0 ml-4" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-600 flex-shrink-0 ml-4" />
        )}
      </button>

      {isExpanded && (
        <div className="p-6 space-y-4">
          {!readOnly && (
            <div className="flex justify-end">
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Add Role
              </button>
            </div>
          )}

          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Role</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Count</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Duration (Months)</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Monthly Cost</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Total Cost</th>
                {!readOnly && <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase w-24">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {supervisionRoles.length === 0 ? (
                <tr>
                  <td colSpan={readOnly ? 5 : 6} className="px-4 py-8 text-center text-slate-500">
                    No supervision roles added yet. Click "Add Role" to get started.
                  </td>
                </tr>
              ) : (
                supervisionRoles.map((role) => {
                  const laborType = laborLibrary.find(l => l.id === role.laborTypeId);
                  const monthlyCost = laborType ? ((laborType.monthlySalary || 0) + (laborType.additionalCost || 0)) : 0;
                  const hourlyRateFallback = laborType ? laborType.hourlyRate * 160 : 0;
                  const costPerMonth = monthlyCost > 0 ? monthlyCost : hourlyRateFallback;

                  return (
                    <tr key={role.id} className="hover:bg-slate-50">
                      {editingId === role.id && editForm ? (
                        <>
                          <td className="px-4 py-3">
                            <select
                              value={editForm.laborTypeId}
                              onChange={(e) => setEditForm({ ...editForm, laborTypeId: e.target.value })}
                              className="w-full px-2 py-1 border border-slate-300 rounded"
                            >
                              {laborLibrary.map(labor => (
                                <option key={labor.id} value={labor.id}>{labor.role}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={editForm.count}
                              onChange={(e) => setEditForm({ ...editForm, count: parseInt(e.target.value) || 1 })}
                              className="w-full px-2 py-1 border border-slate-300 rounded text-right"
                              min="1"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={editForm.durationMonths}
                              onChange={(e) => setEditForm({ ...editForm, durationMonths: parseFloat(e.target.value) || 1 })}
                              className="w-full px-2 py-1 border border-slate-300 rounded text-right"
                              min="0.5"
                              step="0.5"
                            />
                          </td>
                          <td className="px-4 py-3 text-right text-slate-900">
                            {formatCurrency(costPerMonth)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-900 font-medium">
                            {formatCurrency(calculateRoleCost(editForm))}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={handleSave}
                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                                title="Save"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleCancel}
                                className="p-1 text-slate-600 hover:bg-slate-100 rounded"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-slate-900 font-medium">
                            {laborType?.role || 'Unknown Role'}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-900">{role.count}</td>
                          <td className="px-4 py-3 text-right text-slate-900">{role.durationMonths}</td>
                          <td className="px-4 py-3 text-right text-slate-900">{formatCurrency(costPerMonth)}</td>
                          <td className="px-4 py-3 text-right text-slate-900 font-medium">
                            {formatCurrency(calculateRoleCost(role))}
                          </td>
                          {!readOnly && (
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleEdit(role)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(role.id)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          )}
                        </>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
            {supervisionRoles.length > 0 && (
              <tfoot className="bg-slate-50 border-t-2 border-slate-300">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-right font-semibold text-slate-900">
                    Total Supervision Cost:
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">
                    {formatCurrency(totalCost)}
                  </td>
                  {!readOnly && <td></td>}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
        </div>
      )}
    </div>
  );
}
