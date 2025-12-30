import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, X, Link as LinkIcon } from 'lucide-react';
import type { SpecializedService, Frequency, PricingMode, AssetType, AssetInventory } from '../../types/fm';

interface Props {
  services: SpecializedService[];
  onChange: (services: SpecializedService[]) => void;
  assetTypes: AssetType[];
  inventory: AssetInventory[];
  readOnly?: boolean;
}

const frequencies: { value: Frequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'semiannual', label: 'Semi-annual' },
  { value: 'annual', label: 'Annual' },
];

export default function SpecializedServices({ services, onChange, assetTypes, inventory, readOnly = false }: Props) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [linkingServiceId, setLinkingServiceId] = useState<string | null>(null);
  const handleAdd = () => {
    const newService: SpecializedService = {
      id: `service-${Date.now()}`,
      serviceName: '',
      type: '',
      pricingMode: 'per_asset',
      qty: 0,
      frequency: 'monthly',
      linkedAssetTypeIds: [],
      notes: '',
    };
    onChange([...services, newService]);
  };

  const handleUnlinkAsset = (serviceId: string, assetTypeId: string) => {
    onChange(
      services.map((s) =>
        s.id === serviceId
          ? { ...s, linkedAssetTypeIds: s.linkedAssetTypeIds.filter(id => id !== assetTypeId) }
          : s
      )
    );
  };

  const getAssetName = (assetTypeId: string) => {
    const asset = assetTypes.find(a => a.id === assetTypeId);
    return asset ? `${asset.category} - ${asset.assetName}` : 'Unknown Asset';
  };

  const getAvailableAssetsForLinking = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return [];

    const subcontractedInventory = inventory.filter(inv => inv.responsibility === 'subcontract');

    return subcontractedInventory
      .filter(inv => !service.linkedAssetTypeIds.includes(inv.assetTypeId))
      .map(inv => {
        const asset = assetTypes.find(a => a.id === inv.assetTypeId);
        return {
          assetTypeId: inv.assetTypeId,
          displayName: asset ? `${asset.category} - ${asset.assetName} (Qty: ${inv.quantity})` : 'Unknown',
        };
      });
  };

  const handleLinkAsset = (serviceId: string, assetTypeId: string) => {
    onChange(
      services.map((s) =>
        s.id === serviceId
          ? { ...s, linkedAssetTypeIds: [...s.linkedAssetTypeIds, assetTypeId] }
          : s
      )
    );
    setLinkingServiceId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this service?')) {
      onChange(services.filter((s) => s.id !== id));
    }
  };

  const handleUpdate = (id: string, updates: Partial<SpecializedService>) => {
    onChange(
      services.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      )
    );
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
          <h2 className="text-xl font-semibold text-gray-800">Additional Specialized Services</h2>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="p-4">
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900 font-medium">
              💡 Note: All costs below are <span className="font-bold">annual amounts</span>. The system will calculate monthly costs automatically.
            </p>
          </div>
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
              <th className="px-3 py-2 text-left font-medium text-gray-700">Service Name</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Type</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Pricing Mode</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Qty</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Frequency</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Cost</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Notes</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service, index) => (
              <React.Fragment key={service.id}>
              <tr className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={service.serviceName}
                    onChange={(e) => handleUpdate(service.id, { serviceName: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-yellow-50"
                  />
                  {service.linkedAssetTypeIds && service.linkedAssetTypeIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {service.linkedAssetTypeIds.map((assetId) => (
                        <span
                          key={assetId}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs"
                        >
                          <LinkIcon className="w-3 h-3" />
                          {getAssetName(assetId)}
                          {!readOnly && (
                            <button
                              onClick={() => handleUnlinkAsset(service.id, assetId)}
                              className="hover:bg-blue-200 rounded-full p-0.5"
                              title="Unlink asset"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </span>
                      ))}
                      {!readOnly && getAvailableAssetsForLinking(service.id).length > 0 && (
                        <div className="relative inline-block">
                          <button
                            onClick={() => setLinkingServiceId(linkingServiceId === service.id ? null : service.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            Link Asset
                          </button>
                          {linkingServiceId === service.id && (
                            <div className="absolute left-0 top-full mt-1 bg-white border border-gray-300 rounded shadow-lg z-10 min-w-64">
                              <div className="max-h-48 overflow-y-auto">
                                {getAvailableAssetsForLinking(service.id).map((asset) => (
                                  <button
                                    key={asset.assetTypeId}
                                    onClick={() => handleLinkAsset(service.id, asset.assetTypeId)}
                                    className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm text-gray-800 border-b border-gray-100 last:border-b-0"
                                  >
                                    {asset.displayName}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={service.type}
                    onChange={(e) => handleUpdate(service.id, { type: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-yellow-50"
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    value={service.pricingMode}
                    onChange={(e) => handleUpdate(service.id, { pricingMode: e.target.value as PricingMode })}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-yellow-50"
                  >
                    <option value="per_asset">Per-Asset</option>
                    <option value="lump_sum">Lump-Sum</option>
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={service.qty}
                    onChange={(e) => handleUpdate(service.id, { qty: Number(e.target.value) })}
                    className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-yellow-50"
                    min="0"
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    value={service.frequency}
                    onChange={(e) => handleUpdate(service.id, { frequency: e.target.value as Frequency })}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-yellow-50"
                  >
                    {frequencies.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  {service.pricingMode === 'per_asset' ? (
                    <input
                      type="number"
                      value={service.unitCost || 0}
                      onChange={(e) => handleUpdate(service.id, { unitCost: Number(e.target.value) })}
                      className="w-28 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-yellow-50"
                      placeholder="Unit Cost (AED)"
                      min="0"
                      step="0.01"
                    />
                  ) : (
                    <input
                      type="number"
                      value={service.annualCost || 0}
                      onChange={(e) => handleUpdate(service.id, { annualCost: Number(e.target.value) })}
                      className="w-28 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-yellow-50"
                      placeholder="Annual (AED)"
                      min="0"
                      step="0.01"
                    />
                  )}
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={service.notes}
                    onChange={(e) => handleUpdate(service.id, { notes: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-yellow-50"
                  />
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
          </div>

          {services.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No specialized services defined. Click "Add" to create one.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
