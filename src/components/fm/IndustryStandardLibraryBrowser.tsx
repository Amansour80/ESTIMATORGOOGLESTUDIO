import { useState, useEffect } from 'react';
import { Search, Plus, X, Loader2 } from 'lucide-react';
import { fetchIndustryStandardAssets, fetchIndustryStandardCategories, fetchIndustryStandardAssetWithTasks, convertIndustryStandardToAssetType, calculateAnnualHoursFromIndustryStandardTasks } from '../../utils/industryStandardDatabase';
import type { IndustryStandardAssetLibraryItem, IndustryStandardAssetWithTasks, AssetType } from '../../types/fm';

interface Props {
  existingAssets: AssetType[];
  technicians: { id: string; name: string }[];
  onImport: (asset: AssetType) => void;
  onClose: () => void;
}

export default function IndustryStandardLibraryBrowser({ existingAssets, technicians, onImport, onClose }: Props) {
  const [assets, setAssets] = useState<IndustryStandardAssetLibraryItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<IndustryStandardAssetWithTasks | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [assetsData, categoriesData] = await Promise.all([
      fetchIndustryStandardAssets(),
      fetchIndustryStandardCategories()
    ]);
    setAssets(assetsData);
    setCategories(['All', ...categoriesData]);
    setLoading(false);
  }

  const existingStandardCodes = new Set(
    existingAssets
      .filter(asset => asset.standardCode)
      .map(asset => asset.standardCode)
  );

  const filteredAssets = assets.filter(asset => {
    const matchesCategory = selectedCategory === 'All' || asset.category === selectedCategory;
    const matchesSearch = asset.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          asset.standard_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          asset.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  function isAssetAlreadyImported(standardCode: string): boolean {
    return existingStandardCodes.has(standardCode);
  }

  async function handleAssetClick(asset: IndustryStandardAssetLibraryItem) {
    setLoadingTasks(true);
    const assetWithTasks = await fetchIndustryStandardAssetWithTasks(asset.id);
    setSelectedAsset(assetWithTasks);
    setLoadingTasks(false);
  }

  function handleImport() {
    if (selectedAsset && !isAssetAlreadyImported(selectedAsset.standard_code)) {
      const assetType = convertIndustryStandardToAssetType(selectedAsset);

      const defaultTechId = technicians.length > 0 ? technicians[0].id : '';

      assetType.ppmTasks = assetType.ppmTasks.map(task => ({
        ...task,
        technicianTypeId: task.technicianTypeId || defaultTechId
      }));

      assetType.reactive.technicianTypeId = assetType.reactive.technicianTypeId || defaultTechId;
      assetType.reactive.isMonthlyRate = true;

      onImport(assetType);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-green-50 to-blue-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Industry Standard Library</h2>
            <p className="text-sm text-gray-600 mt-1">Import assets with standard PPM specifications</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="border-b bg-gray-50">
          <div className="px-6 pt-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search assets by name, code, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>
          </div>

          <div className="px-6">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide -mb-px">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                    selectedCategory === category
                      ? 'border-blue-600 text-blue-600 bg-white'
                      : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex">
          <div className="w-1/2 border-r overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No assets found matching your criteria</p>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {filteredAssets.map(asset => {
                  const alreadyImported = isAssetAlreadyImported(asset.standard_code);
                  return (
                    <div
                      key={asset.id}
                      onClick={() => !alreadyImported && handleAssetClick(asset)}
                      className={`p-4 rounded-lg border transition-all ${
                        alreadyImported
                          ? 'bg-gray-100 border-gray-300 opacity-60 cursor-not-allowed'
                          : selectedAsset?.id === asset.id
                          ? 'bg-blue-50 border-blue-300 shadow-md cursor-pointer'
                          : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold text-gray-800">{asset.asset_name}</div>
                            {alreadyImported && (
                              <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded font-semibold">
                                IMPORTED
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            <span className="bg-gray-100 px-2 py-0.5 rounded">{asset.standard_code}</span>
                            <span className="ml-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{asset.category}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{asset.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="w-1/2 overflow-y-auto bg-gray-50">
            {loadingTasks ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : selectedAsset ? (
              <div className="p-6">
                <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{selectedAsset.asset_name}</h3>
                  <div className="flex gap-2 mb-4">
                    <span className="bg-gray-100 px-3 py-1 rounded text-sm font-medium">{selectedAsset.standard_code}</span>
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm font-medium">{selectedAsset.category}</span>
                  </div>
                  <p className="text-gray-600 text-sm">{selectedAsset.description}</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">
                    PPM Tasks ({selectedAsset.tasks.length})
                  </h4>

                  {selectedAsset.tasks.length === 0 ? (
                    <p className="text-gray-500 text-sm">No PPM tasks defined for this asset</p>
                  ) : (
                    <>
                      <div className="space-y-3 mb-4">
                        {selectedAsset.tasks.map(task => (
                          <div key={task.id} className="border border-gray-200 rounded-lg p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="font-medium text-gray-800 text-sm">{task.task_name}</div>
                              </div>
                            </div>
                            <div className="flex gap-3 text-xs">
                              <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                                {task.frequency}
                              </span>
                              <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">
                                {task.hours_per_task} hrs/task
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="text-sm text-gray-700">
                          <div className="flex justify-between font-semibold">
                            <span>Estimated Annual PPM Hours:</span>
                            <span className="text-blue-600">
                              {calculateAnnualHoursFromIndustryStandardTasks(selectedAsset.tasks).toFixed(1)} hrs/unit
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {isAssetAlreadyImported(selectedAsset.standard_code) ? (
                  <div className="w-full mt-6 bg-green-100 border-2 border-green-600 text-green-800 py-3 rounded-lg font-semibold flex items-center justify-center gap-2">
                    <span className="text-xl">✓</span>
                    Already Imported to Your Library
                  </div>
                ) : (
                  <button
                    onClick={handleImport}
                    className="w-full mt-6 bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Import This Asset to Library
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Select an asset to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
