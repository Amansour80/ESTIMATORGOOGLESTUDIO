import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { AssetInventory, AssetType, ResponsibilityType, SpecializedService } from '../../types/fm';

interface Props {
  inventory: AssetInventory[];
  assetTypes: AssetType[];
  onChange: (inventory: AssetInventory[]) => void;
  specializedServices: SpecializedService[];
  onCreateSpecializedService: (assetTypeId: string) => void;
  readOnly?: boolean;
}

export default function AssetInventoryComponent({ inventory, assetTypes, onChange, specializedServices, onCreateSpecializedService, readOnly = false }: Props) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleAdd = () => {
    const newItem: AssetInventory = {
      id: `inv-${Date.now()}`,
      assetTypeId: assetTypes[0]?.id || '',
      quantity: 0,
      notes: '',
    };
    onChange([...inventory, newItem]);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this inventory item?')) {
      onChange(inventory.filter((i) => i.id !== id));
    }
  };

  const handleUpdate = (id: string, updates: Partial<AssetInventory>) => {
    onChange(
      inventory.map((i) => {
        if (i.id !== id) return i;
        return { ...i, ...updates };
      })
    );
  };

  const getAssetTypeName = (assetTypeId: string) => {
    const asset = assetTypes.find((a) => a.id === assetTypeId);
    return asset ? `${asset.category} - ${asset.assetName}` : 'Unknown Asset';
  };

  const getLinkedService = (assetTypeId: string): SpecializedService | undefined => {
    return specializedServices.find(s => s.linkedAssetTypeIds?.includes(assetTypeId));
  };

  const getAssetTypeResponsibility = (assetTypeId: string): ResponsibilityType => {
    const asset = assetTypes.find((a) => a.id === assetTypeId);
    return asset?.responsibility || 'in_house';
  };

  const getSubcontractedAssets = () => {
    return inventory.filter(item => getAssetTypeResponsibility(item.assetTypeId) === 'subcontract');
  };

  const getUnlinkedSubcontractCount = () => {
    return getSubcontractedAssets().filter(item => !getLinkedService(item.assetTypeId)).length;
  };


  return (
    <div className="border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors rounded-t-lg">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1 flex items-center justify-between pointer-events-auto"
          disabled={false}
        >
          <h2 className="text-xl font-semibold text-gray-800">Asset Inventory</h2>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="p-4">
          {!readOnly && (
            <div className="flex justify-end mb-4">
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
          )}
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-2 text-left font-medium text-gray-700">Asset Type</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Quantity</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Responsibility</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Status</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Notes</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item, index) => (
              <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-3 py-2">
                  <select
                    value={item.assetTypeId}
                    onChange={(e) => handleUpdate(item.id, { assetTypeId: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-yellow-50"
                  >
                    {assetTypes.length === 0 ? (
                      <option value="">-- No Assets Available --</option>
                    ) : (
                      assetTypes.map((asset) => (
                        <option key={asset.id} value={asset.id}>
                          {asset.category} - {asset.assetName}
                        </option>
                      ))
                    )}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleUpdate(item.id, { quantity: Number(e.target.value) })}
                    className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-yellow-50"
                    min="0"
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                      getAssetTypeResponsibility(item.assetTypeId) === 'subcontract'
                        ? 'bg-gray-200 text-gray-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {getAssetTypeResponsibility(item.assetTypeId) === 'subcontract' ? 'Subcontract' : 'In-House'}
                    </span>
                    <span className="text-xs text-gray-500">(from library)</span>
                  </div>
                </td>
                <td className="px-3 py-2">
                  {getAssetTypeResponsibility(item.assetTypeId) === 'subcontract' ? (
                    <>
                      {getLinkedService(item.assetTypeId) ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                            <CheckCircle2 className="w-3 h-3" />
                            Covered by: {getLinkedService(item.assetTypeId)?.serviceName}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium">
                            <AlertTriangle className="w-3 h-3" />
                            Subcontracted
                          </span>
                          {!readOnly && (
                            <button
                              onClick={() => onCreateSpecializedService(item.assetTypeId)}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                              title="Add to Specialized Services"
                            >
                              <ArrowRight className="w-3 h-3" />
                              Add Service
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-500 text-xs">In-house</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={item.notes}
                    onChange={(e) => handleUpdate(item.id, { notes: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-yellow-50"
                  />
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        {inventory.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No inventory items. Click "Add" to specify asset quantities.
          </div>
        )}

        {assetTypes.length === 0 && (
          <div className="text-center py-4 px-4 bg-amber-50 border border-amber-200 rounded text-sm text-amber-700">
            Please define asset types in the Asset Library first.
          </div>
        )}

        {getUnlinkedSubcontractCount() > 0 && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-300 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900">
                  {getUnlinkedSubcontractCount()} subcontracted asset{getUnlinkedSubcontractCount() > 1 ? 's' : ''} need{getUnlinkedSubcontractCount() === 1 ? 's' : ''} specialized service entries
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Click "Add Service" next to each subcontracted asset to define their costs in Additional Specialized Services.
                </p>
              </div>
            </div>
          </div>
        )}
        </div>
      )}

    </div>
  );
}
