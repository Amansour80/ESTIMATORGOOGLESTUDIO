import React, { useState, useRef } from 'react';
import { Plus, Trash2, Edit2, Check, X, Download, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { MaterialItem } from '../../types/retrofit';
import { formatCurrency } from '../../utils/currencyFormatter';
import { generateMaterialsBOQTemplate, parseMaterialsBOQ, downloadBOQTemplate } from '../../utils/boqTemplates';
import BOQImportModal from './BOQImportModal';

interface MaterialsCatalogProps {
  materials: MaterialItem[];
  onUpdate: (materials: MaterialItem[]) => void;
  readOnly?: boolean;
  currency?: string;
}

export default function MaterialsCatalog({ materials, onUpdate, readOnly = false, currency = 'AED' }: MaterialsCatalogProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<MaterialItem | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState<MaterialItem[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    const newMaterial: MaterialItem = {
      id: crypto.randomUUID(),
      category: 'General',
      item: '',
      unit: 'pcs',
      unitRate: 0,
      estimatedQty: 0,
      notes: '',
    };
    onUpdate([...materials, newMaterial]);
    setEditingId(newMaterial.id);
    setEditForm(newMaterial);
  };

  const handleEdit = (material: MaterialItem) => {
    setEditingId(material.id);
    setEditForm({ ...material });
  };

  const handleSave = () => {
    if (editForm) {
      onUpdate(materials.map(m => m.id === editForm.id ? editForm : m));
      setEditingId(null);
      setEditForm(null);
    }
  };

  const handleCancel = () => {
    if (editForm && materials.find(m => m.id === editForm.id && !m.item)) {
      onUpdate(materials.filter(m => m.id !== editForm.id));
    }
    setEditingId(null);
    setEditForm(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this material item?')) {
      onUpdate(materials.filter(m => m.id !== id));
    }
  };

  const handleDownloadTemplate = async () => {
    const blob = await generateMaterialsBOQTemplate(currency);
    downloadBOQTemplate(blob, `Materials_BOQ_Template.xlsx`);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const result = await parseMaterialsBOQ(file);

    if (result.success && result.data) {
      setImportData(result.data);
      setImportErrors([]);
      setShowImportModal(true);
    } else if (result.errors) {
      setImportData([]);
      setImportErrors(result.errors);
      setShowImportModal(true);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = () => {
    onUpdate([...materials, ...importData]);
    setShowImportModal(false);
    setImportData([]);
    setImportErrors([]);
  };

  const handleCancelImport = () => {
    setShowImportModal(false);
    setImportData([]);
    setImportErrors([]);
  };

  const totalCost = materials.reduce((sum, m) => sum + (m.estimatedQty * m.unitRate), 0);

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors rounded-t-lg"
      >
        <div className="text-left">
          <h3 className="text-lg font-semibold text-slate-900">Materials Catalog</h3>
          <p className="text-sm text-slate-600">Define materials required for the retrofit project</p>
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
            <div className="flex justify-end gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
              title="Download BOQ Template"
            >
              <Download className="w-4 h-4" />
              BOQ Template
            </button>
            <button
              onClick={handleUploadClick}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
              title="Upload Filled BOQ"
            >
              <Upload className="w-4 h-4" />
              Upload BOQ
            </button>
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Material
            </button>
            </div>
          )}

          <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileSelect}
        className="hidden"
      />

          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Item</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Unit</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Unit Rate</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Quantity</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Total Cost</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Notes</th>
                {!readOnly && <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase w-24">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {materials.length === 0 ? (
                <tr>
                  <td colSpan={readOnly ? 7 : 8} className="px-4 py-8 text-center text-slate-500">
                    No materials added yet. Click "Add Material" to get started.
                  </td>
                </tr>
              ) : (
                materials.map((material) => (
                  <tr key={material.id} className="hover:bg-slate-50">
                    {editingId === material.id && editForm ? (
                      <>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={editForm.category}
                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                            className="w-full px-2 py-1 border border-slate-300 rounded"
                            placeholder="Category"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={editForm.item}
                            onChange={(e) => setEditForm({ ...editForm, item: e.target.value })}
                            className="w-full px-2 py-1 border border-slate-300 rounded"
                            placeholder="Item name"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={editForm.unit}
                            onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                            className="w-full px-2 py-1 border border-slate-300 rounded"
                            placeholder="Unit"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={editForm.unitRate}
                            onChange={(e) => setEditForm({ ...editForm, unitRate: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-right"
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={editForm.estimatedQty}
                            onChange={(e) => setEditForm({ ...editForm, estimatedQty: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-right"
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td className="px-4 py-3 text-right text-slate-900">
                          {formatCurrency(editForm.estimatedQty * editForm.unitRate)}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={editForm.notes}
                            onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                            className="w-full px-2 py-1 border border-slate-300 rounded"
                            placeholder="Notes"
                          />
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
                        <td className="px-4 py-3 text-slate-700">{material.category}</td>
                        <td className="px-4 py-3 text-slate-900 font-medium">{material.item}</td>
                        <td className="px-4 py-3 text-slate-700">{material.unit}</td>
                        <td className="px-4 py-3 text-right text-slate-900">{formatCurrency(material.unitRate)}</td>
                        <td className="px-4 py-3 text-right text-slate-900">{material.estimatedQty.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-slate-900 font-medium">
                          {formatCurrency(material.estimatedQty * material.unitRate)}
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-sm">{material.notes}</td>
                        {!readOnly && (
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEdit(material)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(material.id)}
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
                ))
              )}
            </tbody>
            {materials.length > 0 && (
              <tfoot className="bg-slate-50 border-t-2 border-slate-300">
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-right font-semibold text-slate-900">
                    Total Materials Cost:
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">
                    {formatCurrency(totalCost)}
                  </td>
                  <td colSpan={readOnly ? 1 : 2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

          {showImportModal && (
            <BOQImportModal
              type="materials"
              data={importData}
              errors={importErrors}
              onConfirm={handleConfirmImport}
              onCancel={handleCancelImport}
            />
          )}
        </div>
      )}
    </div>
  );
}
