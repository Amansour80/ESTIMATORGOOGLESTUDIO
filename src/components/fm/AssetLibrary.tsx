import { useState, useMemo } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight, ChevronUp, Copy, BookOpen, Upload, Sparkles } from 'lucide-react';
import type { AssetType, PPMTask, TechnicianType, Frequency, AssetInventory } from '../../types/fm';
import IndustryStandardLibraryBrowser from './IndustryStandardLibraryBrowser';
import TechnicianSelect from './TechnicianSelect';
import AssetImportModal from './AssetImportModal';
import AIMatchingGuide from './AIMatchingGuide';
import { analyzeWorkloadBalance, suggestTechniciansForTask } from '../../utils/technicianMatcher';

interface Props {
  assets: AssetType[];
  technicians: TechnicianType[];
  useIndustryStandard: boolean;
  currency: string;
  onChange: (assets: AssetType[]) => void;
  inventory: AssetInventory[];
  onInventoryChange: (inventory: AssetInventory[]) => void;
}

const frequencies: { value: Frequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'semiannual', label: 'Semi-annual' },
  { value: 'annual', label: 'Annual' },
];

export default function AssetLibrary({ assets, technicians, useIndustryStandard, currency, onChange, inventory, onInventoryChange }: Props) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedAssets, setExpandedAssets] = useState<Set<string>>(new Set());
  const [showIndustryStandardBrowser, setShowIndustryStandardBrowser] = useState(false);

  const workloadAnalysis = useMemo(() => {
    return analyzeWorkloadBalance(assets, technicians);
  }, [assets, technicians]);

  const workloadMap = useMemo(() => {
    const map = new Map<string, number>();
    workloadAnalysis.forEach((workload, techId) => {
      map.set(techId, workload.estimatedHours);
    });
    return map;
  }, [workloadAnalysis]);
  const [showImportModal, setShowImportModal] = useState(false);

  const getBestTechnicianForTask = (
    asset: Partial<AssetType>,
    taskName: string = '',
    hoursPerVisit: number = 2,
    isReactive: boolean = false
  ): string => {
    if (technicians.length === 0) return '';

    const requirements = {
      assetCategory: asset.category || '',
      assetName: asset.assetName || '',
      taskName: taskName,
      hoursPerVisit: hoursPerVisit,
      isReactive: isReactive,
    };

    const matches = suggestTechniciansForTask(requirements, technicians, workloadMap);

    if (matches.length === 0 || matches[0].confidence < 40) {
      return technicians[0]?.id || '';
    }

    return matches[0].technicianId;
  };

  const autoAssignTechniciansToAsset = (asset: AssetType, forceReassign: boolean = false): AssetType => {
    return {
      ...asset,
      ppmTasks: asset.ppmTasks.map(task => {
        if (!forceReassign && task.technicianTypeId) {
          return task;
        }

        const bestTechId = getBestTechnicianForTask(
          asset,
          task.taskName,
          task.hoursPerVisit,
          false
        );

        return {
          ...task,
          technicianTypeId: bestTechId
        };
      }),
      reactive: {
        ...asset.reactive,
        technicianTypeId: (() => {
          if (!forceReassign && asset.reactive.technicianTypeId) {
            return asset.reactive.technicianTypeId;
          }

          return getBestTechnicianForTask(
            asset,
            'Reactive Maintenance',
            asset.reactive.avgHoursPerCall || 2,
            true
          );
        })()
      }
    };
  };

  const getPPMTechnicianTypes = (asset: AssetType): string => {
    if (asset.ppmTasks.length === 0) return 'None';

    const techTypeIds = asset.ppmTasks
      .map(task => task.technicianTypeId)
      .filter(id => id);

    if (techTypeIds.length === 0) return 'None';

    const uniqueTypeNames = [...new Set(
      techTypeIds.map(id => {
        const tech = technicians.find(t => t.id === id);
        return tech?.name || 'Unknown';
      })
    )];

    return uniqueTypeNames.join(', ');
  };

  const getCorrectiveTechnicianType = (asset: AssetType): string => {
    if (!asset.reactive.technicianTypeId) return 'None';

    const tech = technicians.find(t => t.id === asset.reactive.technicianTypeId);
    return tech?.name || 'None';
  };

  const toggleExpand = (assetId: string) => {
    const newExpanded = new Set(expandedAssets);
    if (newExpanded.has(assetId)) {
      newExpanded.delete(assetId);
    } else {
      newExpanded.add(assetId);
    }
    setExpandedAssets(newExpanded);
  };

  const handleAddAsset = () => {
    const newAsset: AssetType = {
      id: `asset-${Date.now()}`,
      category: 'HVAC',
      assetName: 'New Asset',
      ppmTasks: [],
      reactive: {
        reactiveCallsPercent: 0,
        avgHoursPerCall: 0,
        technicianTypeId: '',
        isMonthlyRate: true,
      },
      responsibility: 'in_house',
      notes: '',
    };
    const assignedAsset = autoAssignTechniciansToAsset(newAsset);
    onChange([...assets, assignedAsset]);
  };

  const handleDuplicateAsset = (asset: AssetType) => {
    const duplicated: AssetType = {
      ...asset,
      id: `asset-${Date.now()}`,
      assetName: `${asset.assetName} (Copy)`,
      ppmTasks: asset.ppmTasks.map((task) => ({
        ...task,
        id: `ppm-${Date.now()}-${Math.random()}`,
      })),
    };
    onChange([...assets, duplicated]);
  };

  const handleDeleteAsset = (id: string) => {
    if (confirm('Are you sure you want to delete this asset type?')) {
      onChange(assets.filter((a) => a.id !== id));
    }
  };

  const handleUpdateAsset = (id: string, updates: Partial<AssetType>) => {
    onChange(
      assets.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
  };

  const handleAddPPMTask = (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    const bestTechId = asset ? getBestTechnicianForAsset(asset) : technicians[0]?.id || '';

    const newTask: PPMTask = {
      id: `ppm-${Date.now()}`,
      taskName: 'New PPM Task',
      frequency: 'monthly',
      hoursPerVisit: 1,
      technicianTypeId: bestTechId,
    };
    onChange(
      assets.map((a) =>
        a.id === assetId ? { ...a, ppmTasks: [...a.ppmTasks, newTask] } : a
      )
    );
  };

  const handleDeletePPMTask = (assetId: string, taskId: string) => {
    onChange(
      assets.map((a) =>
        a.id === assetId
          ? { ...a, ppmTasks: a.ppmTasks.filter((t) => t.id !== taskId) }
          : a
      )
    );
  };

  const handleUpdatePPMTask = (assetId: string, taskId: string, updates: Partial<PPMTask>) => {
    onChange(
      assets.map((a) =>
        a.id === assetId
          ? {
              ...a,
              ppmTasks: a.ppmTasks.map((t) =>
                t.id === taskId ? { ...t, ...updates } : t
              ),
            }
          : a
      )
    );
  };

  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors rounded-t-lg pointer-events-auto"
        disabled={false}
      >
        <h2 className="text-xl font-semibold text-gray-800">Asset Library</h2>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-600" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4">
          {useIndustryStandard && (
            <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-lg">
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-800">Industry Standard Library Active</h3>
                  <p className="text-sm text-gray-700">You can now import assets with industry-standard PPM specifications</p>
                </div>
              </div>
            </div>
          )}

          {technicians.length > 0 && assets.length > 0 && (
            <AIMatchingGuide />
          )}

          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm text-gray-600">Define asset types with PPM and reactive maintenance</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (!useIndustryStandard) {
                    alert('Please enable "Use Industry Standard Library" in Global Assumptions to import assets from Excel.');
                    return;
                  }
                  setShowImportModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-md hover:from-purple-700 hover:to-pink-700 transition-colors text-sm shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!useIndustryStandard}
              >
                <Upload className="w-5 h-5" />
                Import from Excel
              </button>
          {useIndustryStandard && (
              <button
                onClick={() => setShowIndustryStandardBrowser(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-md hover:from-green-700 hover:to-blue-700 transition-colors text-sm shadow-lg font-semibold"
              >
                <BookOpen className="w-5 h-5" />
                Browse Industry Library
              </button>
          )}
          <button
            onClick={handleAddAsset}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Asset
          </button>
          {assets.length > 0 && technicians.length > 0 && (
            <button
              onClick={() => {
                const reassignedAssets = assets.map(asset => autoAssignTechniciansToAsset(asset, true));
                onChange(reassignedAssets);
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-md hover:from-green-700 hover:to-blue-700 transition-colors text-sm shadow-md"
              title="Auto-assign best technicians to all assets based on AI suggestions"
            >
              <Sparkles className="w-4 h-4" />
              Auto-assign All
            </button>
          )}
        </div>
      </div>

      {showIndustryStandardBrowser && (
        <IndustryStandardLibraryBrowser
          existingAssets={assets}
          technicians={technicians}
          onImport={(asset) => {
            const assignedAsset = autoAssignTechniciansToAsset(asset);
            onChange([...assets, assignedAsset]);
            setShowIndustryStandardBrowser(false);
          }}
          onClose={() => setShowIndustryStandardBrowser(false)}
        />
      )}

      <div className="space-y-3">
        {assets.map((asset) => (
          <div key={asset.id} className="border border-gray-300 rounded-lg bg-white">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => toggleExpand(asset.id)}
                  className="mt-1 text-gray-600 hover:text-gray-800"
                >
                  {expandedAssets.has(asset.id) ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </button>

                <div className="flex-1">
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                      <input
                        type="text"
                        value={asset.category}
                        onChange={(e) => handleUpdateAsset(asset.id, { category: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-yellow-50"
                      />
                    </div>

                    <div className="col-span-4">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Asset Name</label>
                      <input
                        type="text"
                        value={asset.assetName}
                        onChange={(e) => handleUpdateAsset(asset.id, { assetName: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-yellow-50"
                      />
                    </div>

                    <div className="col-span-5">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                      <input
                        type="text"
                        value={asset.notes}
                        onChange={(e) => handleUpdateAsset(asset.id, { notes: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-yellow-50"
                      />
                    </div>

                    <div className="col-span-1 flex gap-1 justify-end">
                      <button
                        onClick={() => handleDuplicateAsset(asset)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAsset(asset.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {!expandedAssets.has(asset.id) && (
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        {asset.responsibility === 'subcontract' ? (
                          <span className="font-medium text-gray-600">Subcontracted</span>
                        ) : (
                          <>
                            <span>PPM: {getPPMTechnicianTypes(asset)}</span>
                            <span className="mx-2">|</span>
                            <span>Corrective: {getCorrectiveTechnicianType(asset)}</span>
                            <span className="mx-2">|</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              asset.ppmTasks.some(task => task.isCritical)
                                ? 'bg-red-100 text-red-700 border border-red-300'
                                : 'bg-gray-100 text-gray-600 border border-gray-300'
                            }`}>
                              {asset.ppmTasks.some(task => task.isCritical) ? '⚠️ Critical' : 'Non-Critical'}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium transition-colors ${
                          asset.responsibility === 'subcontract' ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          Subcontract
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateAsset(asset.id, {
                              responsibility: asset.responsibility === 'in_house' ? 'subcontract' : 'in_house'
                            });
                          }}
                          className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                            asset.responsibility === 'in_house'
                              ? 'bg-blue-600 focus:ring-blue-500'
                              : 'bg-gray-300 focus:ring-gray-400'
                          }`}
                          title="Click to toggle responsibility"
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm ${
                              asset.responsibility === 'in_house' ? 'translate-x-6' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                        <span className={`text-xs font-medium transition-colors ${
                          asset.responsibility === 'in_house' ? 'text-blue-700' : 'text-gray-400'
                        }`}>
                          In-House
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {expandedAssets.has(asset.id) && (
                <div className="mt-4 ml-8 space-y-4 border-l-2 border-blue-200 pl-4">
                  <div className="bg-gradient-to-r from-blue-50 to-gray-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 p-3 bg-white rounded-lg border-2 border-gray-300">
                        <div className="flex-1">
                          <label className="block text-xs font-semibold text-gray-700 mb-2">
                            Responsibility
                          </label>
                          <div className="flex items-center gap-3">
                            <span className={`text-sm font-medium transition-colors ${
                              asset.responsibility === 'subcontract' ? 'text-gray-700' : 'text-gray-400'
                            }`}>
                              Subcontract
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateAsset(asset.id, {
                                responsibility: asset.responsibility === 'in_house' ? 'subcontract' : 'in_house'
                              })}
                              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                asset.responsibility === 'in_house'
                                  ? 'bg-blue-600 focus:ring-blue-500'
                                  : 'bg-gray-300 focus:ring-gray-400'
                              }`}
                            >
                              <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-md ${
                                  asset.responsibility === 'in_house' ? 'translate-x-8' : 'translate-x-1'
                                }`}
                              />
                            </button>
                            <span className={`text-sm font-medium transition-colors ${
                              asset.responsibility === 'in_house' ? 'text-blue-700' : 'text-gray-400'
                            }`}>
                              In-House
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 max-w-xs">
                          {asset.responsibility === 'subcontract' ? (
                            <span className="text-gray-600">This asset will be excluded from manpower calculations</span>
                          ) : (
                            <span className="text-blue-600">This asset requires in-house technicians</span>
                          )}
                        </div>
                      </div>
                      {asset.responsibility === 'in_house' && (
                      <>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            Default Technician (Apply to all tasks)
                          </label>
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <TechnicianSelect
                                technicians={technicians}
                                value=""
                                onChange={(techId) => {
                                  handleUpdateAsset(asset.id, {
                                    ppmTasks: asset.ppmTasks.map(task => ({ ...task, technicianTypeId: techId })),
                                    reactive: { ...asset.reactive, technicianTypeId: techId }
                                  });
                                }}
                                currency={currency}
                                placeholder="Select to apply to all..."
                                taskContext={{
                                  assetCategory: asset.category,
                                  assetName: asset.assetName,
                                  hoursPerVisit: 2,
                                  isReactive: false,
                                }}
                                existingWorkload={workloadMap}
                                showAISuggestions={true}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-white rounded border border-blue-200">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={asset.ppmTasks.length > 0 && asset.ppmTasks.every(task => task.isCritical)}
                            onChange={(e) => {
                              handleUpdateAsset(asset.id, {
                                ppmTasks: asset.ppmTasks.map(task => ({ ...task, isCritical: e.target.checked }))
                              });
                            }}
                            className="w-4 h-4 text-orange-600 rounded"
                            disabled={asset.responsibility === 'subcontract'}
                          />
                          <span className={`text-xs font-medium ${
                            asset.responsibility === 'subcontract' ? 'text-gray-400' : 'text-gray-700'
                          }`}>Critical System (Apply to all tasks)</span>
                        </label>
                        <span className={`text-xs ml-auto ${
                          asset.responsibility === 'subcontract' ? 'text-gray-400' : 'text-gray-500'
                        }`}>Requires resident tech even in output-based mode</span>
                      </div>
                      </>
                      )}
                    </div>
                  </div>

                  {asset.responsibility === 'subcontract' ? (
                    <div className="p-6 bg-gray-50 border-2 border-gray-300 rounded-lg text-center">
                      <p className="text-gray-600 font-medium mb-1">This asset is subcontracted</p>
                      <p className="text-sm text-gray-500">No task configuration or manpower calculations required</p>
                    </div>
                  ) : (
                    <>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-semibold text-gray-800">PPM Tasks</h4>
                      <button
                        onClick={() => handleAddPPMTask(asset.id)}
                        className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                      >
                        <Plus className="w-3 h-3" />
                        Add PPM
                      </button>
                    </div>

                    {asset.ppmTasks.length === 0 ? (
                      <div className="text-sm text-gray-500 italic">No PPM tasks defined</div>
                    ) : (
                      <div className="space-y-2">
                        {asset.ppmTasks.map((task) => (
                          <div key={task.id} className="grid grid-cols-12 gap-2 items-end bg-gray-50 p-2 rounded">
                            <div className="col-span-3">
                              <label className="block text-xs text-gray-600 mb-1">Task Name</label>
                              <input
                                type="text"
                                value={task.taskName}
                                onChange={(e) =>
                                  handleUpdatePPMTask(asset.id, task.id, { taskName: e.target.value })
                                }
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-yellow-50"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-xs text-gray-600 mb-1">Frequency</label>
                              <select
                                value={task.frequency}
                                onChange={(e) =>
                                  handleUpdatePPMTask(asset.id, task.id, { frequency: e.target.value as Frequency })
                                }
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-yellow-50"
                              >
                                {frequencies.map((f) => (
                                  <option key={f.value} value={f.value}>
                                    {f.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="col-span-1">
                              <label className="block text-xs text-gray-600 mb-1">Hours</label>
                              <input
                                type="number"
                                value={task.hoursPerVisit}
                                onChange={(e) =>
                                  handleUpdatePPMTask(asset.id, task.id, { hoursPerVisit: Number(e.target.value) })
                                }
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-yellow-50"
                                min="0"
                                step="0.1"
                              />
                            </div>
                            <div className="col-span-4">
                              <label className="block text-xs text-gray-600 mb-1">Tech Type</label>
                              <TechnicianSelect
                                technicians={technicians}
                                value={task.technicianTypeId}
                                onChange={(technicianId) =>
                                  handleUpdatePPMTask(asset.id, task.id, { technicianTypeId: technicianId })
                                }
                                currency={currency}
                                className="bg-yellow-50"
                                taskContext={{
                                  assetCategory: asset.category,
                                  assetName: asset.assetName,
                                  taskName: task.taskName,
                                  hoursPerVisit: task.hoursPerVisit,
                                  isReactive: false,
                                  frequency: task.frequency,
                                }}
                                existingWorkload={workloadMap}
                                showAISuggestions={true}
                              />
                            </div>
                            <div className="col-span-1 flex items-end justify-center">
                              <label className="flex items-center cursor-pointer" title="Critical System">
                                <input
                                  type="checkbox"
                                  checked={task.isCritical || false}
                                  onChange={(e) =>
                                    handleUpdatePPMTask(asset.id, task.id, { isCritical: e.target.checked })
                                  }
                                  className="w-4 h-4 text-orange-600 rounded"
                                />
                                <span className="ml-1 text-xs text-gray-600">Critical</span>
                              </label>
                            </div>
                            <div className="col-span-1 flex justify-end">
                              <button
                                onClick={() => handleDeletePPMTask(asset.id, task.id)}
                                className="p-1 text-red-600 hover:bg-red-100 rounded"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Reactive Maintenance</h4>
                    <div className="grid grid-cols-3 gap-3 bg-orange-50 p-3 rounded">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          {asset.reactive.isMonthlyRate ? 'Monthly Reactive Calls (% of Assets)' : 'Reactive Calls (% of Assets)'}
                        </label>
                        <input
                          type="number"
                          value={asset.reactive.reactiveCallsPercent}
                          onChange={(e) =>
                            handleUpdateAsset(asset.id, {
                              reactive: { ...asset.reactive, reactiveCallsPercent: Number(e.target.value) },
                            })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-yellow-50"
                          min="0"
                          max="100"
                          step="0.1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Avg Hours/Call</label>
                        <input
                          type="number"
                          value={asset.reactive.avgHoursPerCall}
                          onChange={(e) =>
                            handleUpdateAsset(asset.id, {
                              reactive: { ...asset.reactive, avgHoursPerCall: Number(e.target.value) },
                            })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-yellow-50"
                          min="0"
                          step="0.1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Tech Type</label>
                        <TechnicianSelect
                          technicians={technicians}
                          value={asset.reactive.technicianTypeId}
                          onChange={(technicianId) =>
                            handleUpdateAsset(asset.id, {
                              reactive: { ...asset.reactive, technicianTypeId: technicianId },
                            })
                          }
                          currency={currency}
                          className="bg-yellow-50"
                          taskContext={{
                            assetCategory: asset.category,
                            assetName: asset.assetName,
                            taskName: 'Reactive Maintenance',
                            hoursPerVisit: asset.reactive.avgHoursPerCall,
                            isReactive: true,
                          }}
                          existingWorkload={workloadMap}
                          showAISuggestions={true}
                        />
                      </div>
                    </div>
                  </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

          {assets.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No asset types defined. Click "Add Asset" to create one.
            </div>
          )}
        </div>
      )}

      {showImportModal && (
        <AssetImportModal
          onClose={() => setShowImportModal(false)}
          onImport={(newAssets, quantities) => {
            const assignedAssets = newAssets.map(asset => {
              const assigned = autoAssignTechniciansToAsset(asset);
              return assigned;
            });

            const updatedInventory = [...inventory];

            quantities.forEach((quantity, assetId) => {
              const existingItem = updatedInventory.find(item => item.assetTypeId === assetId);

              if (existingItem) {
                existingItem.quantity += quantity;
              } else {
                const newItem = {
                  id: crypto.randomUUID(),
                  assetTypeId: assetId,
                  quantity: quantity,
                  responsibility: 'in_house' as const,
                  notes: '',
                };
                updatedInventory.push(newItem);
              }
            });

            onChange([...assets, ...assignedAssets]);
            onInventoryChange(updatedInventory);
          }}
          existingAssets={assets}
          technicians={technicians}
        />
      )}
    </div>
  );
}
