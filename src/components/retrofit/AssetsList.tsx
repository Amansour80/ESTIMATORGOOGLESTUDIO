import React, { useState, useRef } from 'react';
import { Plus, Trash2, Download, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { Asset } from '../../types/retrofit';
import { generateAssetsBOQTemplate, parseAssetsBOQ, downloadBOQTemplate } from '../../utils/boqTemplates';
import BOQImportModal from './BOQImportModal';

interface AssetsListProps {
  assets: Asset[];
  onChange: (assets: Asset[]) => void;
  currency?: string;
}

export function AssetsList({ assets, onChange, currency = 'AED' }: AssetsListProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState<Asset[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addAsset = () => {
    const newAsset: Asset = {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      quantity: 0,
      unitCost: 0,
      removalCostPerUnit: 0,
    };
    onChange([...assets, newAsset]);
  };

  const updateAsset = (id: string, updates: Partial<Asset>) => {
    onChange(assets.map((asset) => (asset.id === id ? { ...asset, ...updates } : asset)));
  };

  const removeAsset = (id: string) => {
    onChange(assets.filter((a) => a.id !== id));
  };

  const handleDownloadTemplate = async () => {
    const blob = await generateAssetsBOQTemplate(currency);
    downloadBOQTemplate(blob, `Assets_BOQ_Template.xlsx`);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const result = await parseAssetsBOQ(file);

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
    onChange([...assets, ...importData]);
    setShowImportModal(false);
    setImportData([]);
    setImportErrors([]);
  };

  const handleCancelImport = () => {
    setShowImportModal(false);
    setImportData([]);
    setImportErrors([]);
  };

  const totalAssetCost = assets.reduce((sum, a) => sum + a.quantity * a.unitCost, 0);
  const totalRemovalCost = assets.reduce((sum, a) => sum + a.quantity * a.removalCostPerUnit, 0);
  const totalQuantity = assets.reduce((sum, a) => sum + a.quantity, 0);

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors rounded-t-lg"
      >
        <h2 className="text-xl font-semibold text-gray-800">Assets</h2>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-600" />
        )}
      </button>

      {isExpanded && (
        <div className="p-6">
          <div className="flex justify-end gap-2 mb-4">
          <button
            onClick={handleDownloadTemplate}
            className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center gap-2 text-sm"
            title="Download BOQ Template"
          >
            <Download size={16} />
            BOQ Template
          </button>
          <button
            onClick={handleUploadClick}
            className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center gap-2 text-sm"
            title="Upload Filled BOQ"
          >
            <Upload size={16} />
            Upload BOQ
          </button>
          <button
            onClick={addAsset}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={18} />
            Add Asset
          </button>
        </div>

          <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-2 text-left font-medium text-gray-700">Asset Name</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Description</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Qty</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Unit Cost</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Total Cost</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Removal/Unit</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Total Removal</th>
              <th className="px-3 py-2 text-center font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset.id} className="border-b border-gray-200">
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={asset.name}
                    onChange={(e) => updateAsset(asset.id, { name: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="Asset name"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={asset.description}
                    onChange={(e) => updateAsset(asset.id, { description: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="Description"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={asset.quantity}
                    onChange={(e) => updateAsset(asset.id, { quantity: parseInt(e.target.value) || 0 })}
                    className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={asset.unitCost}
                    onChange={(e) => updateAsset(asset.id, { unitCost: parseFloat(e.target.value) || 0 })}
                    className="w-28 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                  />
                </td>
                <td className="px-3 py-2 font-medium text-gray-800">
                  {(asset.quantity * asset.unitCost).toLocaleString()}
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={asset.removalCostPerUnit}
                    onChange={(e) =>
                      updateAsset(asset.id, { removalCostPerUnit: parseFloat(e.target.value) || 0 })
                    }
                    className="w-28 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                  />
                </td>
                <td className="px-3 py-2 font-medium text-gray-800">
                  {(asset.quantity * asset.removalCostPerUnit).toLocaleString()}
                </td>
                <td className="px-3 py-2 text-center">
                  <button
                    onClick={() => removeAsset(asset.id)}
                    className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 inline-flex items-center gap-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {assets.length > 0 && (
              <tr className="bg-gray-50 font-bold">
                <td colSpan={2} className="px-3 py-2 text-right">
                  TOTALS:
                </td>
                <td className="px-3 py-2">{totalQuantity}</td>
                <td className="px-3 py-2"></td>
                <td className="px-3 py-2 text-gray-800">{totalAssetCost.toLocaleString()} AED</td>
                <td className="px-3 py-2"></td>
                <td className="px-3 py-2 text-gray-800">{totalRemovalCost.toLocaleString()} AED</td>
                <td></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

          {assets.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No assets added yet. Click "Add Asset" to get started or use "Upload BOQ" to import from Excel.
            </div>
          )}

          {showImportModal && (
            <BOQImportModal
              type="assets"
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
