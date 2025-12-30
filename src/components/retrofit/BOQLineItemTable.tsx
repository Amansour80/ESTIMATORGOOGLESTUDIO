import React, { useState } from 'react';
import { Trash2, Edit2, Check, X } from 'lucide-react';
import { BOQLineItem, BOQ_CATEGORIES, STANDARD_UOMS } from '../../types/boq';
import { OrgRetrofitLabor } from '../../utils/laborLibraryDatabase';
import { calculateLineItemTotals, formatLaborDropdownText } from '../../utils/boqCalculations';

interface BOQLineItemTableProps {
  lineItems: BOQLineItem[];
  laborLibrary: OrgRetrofitLabor[];
  currency: string;
  onUpdate: (id: string, updates: Partial<BOQLineItem>) => void;
  onDelete: (id: string) => void;
}

export function BOQLineItemTable({
  lineItems,
  laborLibrary,
  currency,
  onUpdate,
  onDelete
}: BOQLineItemTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<BOQLineItem | null>(null);

  const supervisors = laborLibrary.filter(labor =>
    labor.role.toLowerCase().includes('supervisor') ||
    labor.role.toLowerCase().includes('manager') ||
    labor.role.toLowerCase().includes('foreman')
  );

  const startEdit = (item: BOQLineItem) => {
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const saveEdit = () => {
    if (editForm) {
      onUpdate(editForm.id, editForm);
      setEditingId(null);
      setEditForm(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2
    }).format(value).replace('AED', currency);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-blue-700 text-white">
            <th className="px-3 py-2 text-left font-semibold">Category</th>
            <th className="px-3 py-2 text-left font-semibold">Description</th>
            <th className="px-3 py-2 text-left font-semibold">UOM</th>
            <th className="px-3 py-2 text-right font-semibold">Qty</th>
            <th className="px-3 py-2 text-right font-semibold">Unit Mat. Cost</th>
            <th className="px-3 py-2 text-right font-semibold">Total Mat. Cost</th>
            <th className="px-3 py-2 text-left font-semibold">Labor</th>
            <th className="px-3 py-2 text-right font-semibold">Lab. Hrs</th>
            <th className="px-3 py-2 text-right font-semibold">Lab. Cost</th>
            <th className="px-3 py-2 text-left font-semibold">Supervision</th>
            <th className="px-3 py-2 text-right font-semibold">Sup. Hrs</th>
            <th className="px-3 py-2 text-right font-semibold">Sup. Cost</th>
            <th className="px-3 py-2 text-right font-semibold">Direct Cost</th>
            <th className="px-3 py-2 text-right font-semibold">Subcont. Cost</th>
            <th className="px-3 py-2 text-right font-semibold">Line Total</th>
            <th className="px-3 py-2 text-center font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map((item, index) => {
            const isEditing = editingId === item.id;
            const currentItem = isEditing && editForm ? editForm : item;
            const calcs = calculateLineItemTotals(currentItem, laborLibrary);

            const labor = currentItem.laborDetailId
              ? laborLibrary.find(l => l.id === currentItem.laborDetailId)
              : null;

            const supervisor = currentItem.supervisionDetailId
              ? laborLibrary.find(l => l.id === currentItem.supervisionDetailId)
              : null;

            return (
              <tr
                key={item.id}
                className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}
              >
                <td className="px-3 py-2">
                  {isEditing ? (
                    <select
                      value={currentItem.category}
                      onChange={(e) => setEditForm({ ...currentItem, category: e.target.value })}
                      className="w-full px-2 py-1 border rounded text-sm"
                    >
                      {BOQ_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-sm">{item.category}</span>
                  )}
                </td>

                <td className="px-3 py-2">
                  {isEditing ? (
                    <input
                      type="text"
                      value={currentItem.description}
                      onChange={(e) => setEditForm({ ...currentItem, description: e.target.value })}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  ) : (
                    <span className="text-sm">{item.description}</span>
                  )}
                </td>

                <td className="px-3 py-2">
                  {isEditing ? (
                    <select
                      value={currentItem.uom}
                      onChange={(e) => setEditForm({ ...currentItem, uom: e.target.value })}
                      className="w-full px-2 py-1 border rounded text-sm"
                    >
                      {STANDARD_UOMS.map(uom => (
                        <option key={uom} value={uom}>{uom}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-sm">{item.uom}</span>
                  )}
                </td>

                <td className="px-3 py-2 text-right">
                  {isEditing ? (
                    <input
                      type="number"
                      value={currentItem.quantity}
                      onChange={(e) => setEditForm({ ...currentItem, quantity: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-1 border rounded text-sm text-right"
                      min="0"
                      step="0.01"
                    />
                  ) : (
                    <span className="text-sm">{item.quantity.toLocaleString()}</span>
                  )}
                </td>

                <td className="px-3 py-2 text-right">
                  {isEditing ? (
                    <input
                      type="number"
                      value={currentItem.unitMaterialCost}
                      onChange={(e) => setEditForm({ ...currentItem, unitMaterialCost: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-1 border rounded text-sm text-right"
                      min="0"
                      step="0.01"
                    />
                  ) : (
                    <span className="text-sm">{formatCurrency(item.unitMaterialCost)}</span>
                  )}
                </td>

                <td className="px-3 py-2 text-right bg-gray-100">
                  <span className="text-sm font-medium">{formatCurrency(calcs.totalMaterialCost)}</span>
                </td>

                <td className="px-3 py-2">
                  {isEditing ? (
                    <select
                      value={currentItem.laborDetailId || ''}
                      onChange={(e) => setEditForm({ ...currentItem, laborDetailId: e.target.value || null })}
                      className="w-full px-2 py-1 border rounded text-sm"
                    >
                      <option value="">-- None --</option>
                      {laborLibrary.map(lab => (
                        <option key={lab.id} value={lab.id}>
                          {formatLaborDropdownText(lab, currency)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-sm">{labor ? formatLaborDropdownText(labor, currency) : '-'}</span>
                  )}
                </td>

                <td className="px-3 py-2 text-right">
                  {isEditing ? (
                    <input
                      type="number"
                      value={currentItem.laborHours}
                      onChange={(e) => setEditForm({ ...currentItem, laborHours: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-1 border rounded text-sm text-right"
                      min="0"
                      step="0.01"
                    />
                  ) : (
                    <span className="text-sm">{item.laborHours.toLocaleString()}</span>
                  )}
                </td>

                <td className="px-3 py-2 text-right bg-gray-100">
                  <span className="text-sm font-medium">{formatCurrency(calcs.laborCost)}</span>
                </td>

                <td className="px-3 py-2">
                  {isEditing ? (
                    <select
                      value={currentItem.supervisionDetailId || ''}
                      onChange={(e) => setEditForm({ ...currentItem, supervisionDetailId: e.target.value || null })}
                      className="w-full px-2 py-1 border rounded text-sm"
                    >
                      <option value="">-- None --</option>
                      {supervisors.map(sup => (
                        <option key={sup.id} value={sup.id}>
                          {formatLaborDropdownText(sup, currency)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-sm">{supervisor ? formatLaborDropdownText(supervisor, currency) : '-'}</span>
                  )}
                </td>

                <td className="px-3 py-2 text-right">
                  {isEditing ? (
                    <input
                      type="number"
                      value={currentItem.supervisionHours}
                      onChange={(e) => setEditForm({ ...currentItem, supervisionHours: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-1 border rounded text-sm text-right"
                      min="0"
                      step="0.01"
                    />
                  ) : (
                    <span className="text-sm">{item.supervisionHours.toLocaleString()}</span>
                  )}
                </td>

                <td className="px-3 py-2 text-right bg-gray-100">
                  <span className="text-sm font-medium">{formatCurrency(calcs.supervisionCost)}</span>
                </td>

                <td className="px-3 py-2 text-right">
                  {isEditing ? (
                    <input
                      type="number"
                      value={currentItem.directCost}
                      onChange={(e) => setEditForm({ ...currentItem, directCost: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-1 border rounded text-sm text-right"
                      min="0"
                      step="0.01"
                    />
                  ) : (
                    <span className="text-sm">{formatCurrency(item.directCost)}</span>
                  )}
                </td>

                <td className="px-3 py-2 text-right">
                  {isEditing ? (
                    <input
                      type="number"
                      value={currentItem.subcontractorCost}
                      onChange={(e) => setEditForm({ ...currentItem, subcontractorCost: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-1 border rounded text-sm text-right"
                      min="0"
                      step="0.01"
                    />
                  ) : (
                    <span className="text-sm">{formatCurrency(item.subcontractorCost)}</span>
                  )}
                </td>

                <td className="px-3 py-2 text-right bg-blue-50">
                  <span className="text-sm font-bold text-blue-700">{formatCurrency(calcs.lineTotal)}</span>
                </td>

                <td className="px-3 py-2">
                  <div className="flex items-center justify-center gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={saveEdit}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Save"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(item)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(item.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
