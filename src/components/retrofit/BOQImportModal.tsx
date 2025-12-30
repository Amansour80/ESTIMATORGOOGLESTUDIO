import { X, AlertCircle, CheckCircle } from 'lucide-react';
import type { Asset, MaterialItem } from '../../types/retrofit';

interface BOQImportModalProps {
  type: 'assets' | 'materials';
  data: Asset[] | MaterialItem[];
  errors: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

export default function BOQImportModal({ type, data, errors, onConfirm, onCancel }: BOQImportModalProps) {
  const hasErrors = errors.length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">
            {hasErrors ? 'Import Failed' : 'Confirm Import'}
          </h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {hasErrors ? (
            <div>
              <div className="flex items-center gap-3 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-red-900">
                    {errors.length} Error{errors.length > 1 ? 's' : ''} Found
                  </h3>
                  <p className="text-sm text-red-700">
                    Please fix the errors in your file and try again.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {errors.map((error, index) => (
                  <div
                    key={index}
                    className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800"
                  >
                    {error}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3 mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-green-900">
                    Ready to Import {data.length} {type === 'assets' ? 'Asset' : 'Material'}
                    {data.length > 1 ? 's' : ''}
                  </h3>
                  <p className="text-sm text-green-700">
                    Review the data below and click "Confirm Import" to proceed.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                {type === 'assets' ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Asset Name</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Description</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Quantity</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Unit Cost</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Removal Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data as Asset[]).map((asset, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 py-2">{asset.name}</td>
                          <td className="px-3 py-2">{asset.description || '-'}</td>
                          <td className="px-3 py-2">{asset.quantity}</td>
                          <td className="px-3 py-2">{asset.unitCost.toFixed(2)}</td>
                          <td className="px-3 py-2">{asset.removalCostPerUnit.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Category</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Item</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Unit</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Unit Rate</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Quantity</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data as MaterialItem[]).map((material, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 py-2">{material.category}</td>
                          <td className="px-3 py-2">{material.item}</td>
                          <td className="px-3 py-2">{material.unit}</td>
                          <td className="px-3 py-2">{material.unitRate.toFixed(2)}</td>
                          <td className="px-3 py-2">{material.estimatedQty}</td>
                          <td className="px-3 py-2">{material.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {hasErrors ? 'Close' : 'Cancel'}
          </button>
          {!hasErrors && (
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Confirm Import
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
