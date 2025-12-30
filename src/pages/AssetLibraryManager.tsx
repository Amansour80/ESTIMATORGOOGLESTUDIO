import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, Save, X, BookOpen, ChevronDown, ChevronRight, FolderOpen, Folder, Copy, Download, AlertTriangle } from 'lucide-react';
import { fetchIndustryStandardAssets, fetchIndustryStandardCategories, fetchIndustryStandardTasks } from '../utils/industryStandardDatabase';
import { supabase } from '../lib/supabase';
import type { IndustryStandardAssetLibraryItem, IndustryStandardTask } from '../types/fm';
import { usePermissions } from '../hooks/usePermissions';
import AssetLibraryDownloadModal from '../components/fm/AssetLibraryDownloadModal';
import { exportAssetLibraryToCSV } from '../utils/exportAssetLibrary';
import AddAssetChoiceModal from '../components/fm/AddAssetChoiceModal';
import AssetLibraryImportModal from '../components/fm/AssetLibraryImportModal';
import { generateCSVTemplate } from '../utils/assetLibraryCSVTemplate';
import { findSimilarAssets } from '../utils/assetDuplicateDetection';

interface AssetWithTasks extends IndustryStandardAssetLibraryItem {
  tasks?: IndustryStandardTask[];
}

export default function AssetLibraryManager() {
  const { isSuperAdmin, canEditModule, isModuleViewOnly } = usePermissions();
  const canManageLibrary = isSuperAdmin || canEditModule('asset_library');
  const isViewOnly = isModuleViewOnly('asset_library');
  const [assets, setAssets] = useState<AssetWithTasks[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [expandedAssets, setExpandedAssets] = useState<Set<string>>(new Set());
  const [editingAsset, setEditingAsset] = useState<AssetWithTasks | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isAddChoiceModalOpen, setIsAddChoiceModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [assetsData, categoriesData] = await Promise.all([
        fetchIndustryStandardAssets(),
        fetchIndustryStandardCategories()
      ]);
      setAssets(assetsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading asset library:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAssetExpand = async (assetId: string) => {
    const newExpanded = new Set(expandedAssets);
    if (newExpanded.has(assetId)) {
      newExpanded.delete(assetId);
    } else {
      newExpanded.add(assetId);
      const asset = assets.find(a => a.id === assetId);
      if (asset && !asset.tasks) {
        const tasks = await fetchIndustryStandardTasks(assetId);
        setAssets(prev => prev.map(a => a.id === assetId ? { ...a, tasks } : a));
      }
    }
    setExpandedAssets(newExpanded);
  };

  const handleAddNew = () => {
    setIsAddChoiceModalOpen(true);
  };

  const handleAddManually = () => {
    setIsAddingNew(true);
    setEditingAsset({
      id: crypto.randomUUID(),
      standard_code: '',
      asset_name: '',
      category: categories[1] || 'HVAC',
      description: '',
      tasks: []
    });
  };

  const handleEdit = async (asset: AssetWithTasks) => {
    const tasks = await fetchIndustryStandardTasks(asset.id);
    setEditingAsset({ ...asset, tasks });
  };

  const handleDuplicate = async (asset: AssetWithTasks) => {
    const tasks = await fetchIndustryStandardTasks(asset.id);
    const duplicatedAsset: AssetWithTasks = {
      ...asset,
      id: crypto.randomUUID(),
      asset_name: `${asset.asset_name} (Copy)`,
      standard_code: asset.standard_code ? `${asset.standard_code}-COPY` : '',
      tasks: tasks.map(task => ({
        ...task,
        id: crypto.randomUUID()
      }))
    };
    setIsAddingNew(true);
    setEditingAsset(duplicatedAsset);
  };

  const handleSave = async () => {
    if (!editingAsset) return;

    try {
      if (isAddingNew) {
        const { error: assetError } = await supabase
          .from('industry_standard_asset_library')
          .insert({
            id: editingAsset.id,
            standard_code: editingAsset.standard_code,
            asset_name: editingAsset.asset_name,
            category: editingAsset.category,
            description: editingAsset.description
          });

        if (assetError) throw assetError;

        if (editingAsset.tasks && editingAsset.tasks.length > 0) {
          const { error: tasksError } = await supabase
            .from('industry_standard_ppm_tasks')
            .insert(
              editingAsset.tasks.map((task, index) => ({
                id: task.id || crypto.randomUUID(),
                asset_id: editingAsset.id,
                task_name: task.task_name,
                frequency: task.frequency,
                hours_per_task: task.hours_per_task,
                task_order: index + 1
              }))
            );

          if (tasksError) throw tasksError;
        }
      } else {
        const { error: updateError } = await supabase
          .from('industry_standard_asset_library')
          .update({
            standard_code: editingAsset.standard_code,
            asset_name: editingAsset.asset_name,
            category: editingAsset.category,
            description: editingAsset.description
          })
          .eq('id', editingAsset.id);

        if (updateError) throw updateError;

        await supabase
          .from('industry_standard_ppm_tasks')
          .delete()
          .eq('asset_id', editingAsset.id);

        if (editingAsset.tasks && editingAsset.tasks.length > 0) {
          const { error: tasksError } = await supabase
            .from('industry_standard_ppm_tasks')
            .insert(
              editingAsset.tasks.map((task, index) => ({
                id: task.id || crypto.randomUUID(),
                asset_id: editingAsset.id,
                task_name: task.task_name,
                frequency: task.frequency,
                hours_per_task: task.hours_per_task,
                task_order: index + 1
              }))
            );

          if (tasksError) throw tasksError;
        }
      }

      await loadData();
      setEditingAsset(null);
      setIsAddingNew(false);
    } catch (error) {
      console.error('Error saving asset:', error);
      alert('Failed to save asset. Please try again.');
    }
  };

  const handleDelete = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset? This will also delete all associated PPM tasks.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('industry_standard_asset_library')
        .delete()
        .eq('id', assetId);

      if (error) throw error;

      await loadData();
    } catch (error) {
      console.error('Error deleting asset:', error);
      alert('Failed to delete asset. Please try again.');
    }
  };

  const handleAddTask = () => {
    if (!editingAsset) return;
    const newTask: IndustryStandardTask = {
      id: crypto.randomUUID(),
      task_name: 'New Task',
      frequency: 'Monthly',
      hours_per_task: 1,
      task_order: (editingAsset.tasks?.length || 0) + 1
    };
    setEditingAsset({
      ...editingAsset,
      tasks: [...(editingAsset.tasks || []), newTask]
    });
  };

  const handleRemoveTask = (taskId: string) => {
    if (!editingAsset) return;
    setEditingAsset({
      ...editingAsset,
      tasks: editingAsset.tasks?.filter(t => t.id !== taskId)
    });
  };

  const getCategoryColor = (category: string): string => {
    const colorMap: Record<string, string> = {
      'HVAC': '#3B82F6',
      'Electrical': '#F59E0B',
      'Plumbing': '#14B8A6',
      'Fire & Life Safety': '#EF4444',
      'ELV Systems': '#A855F7',
      'Building Fabric': '#64748B',
      'Landscaping': '#10B981',
      'Lift & Escalator': '#EC4899',
      'Swimming Pool': '#06B6D4',
    };

    if (colorMap[category]) return colorMap[category];

    let hash = 0;
    for (let i = 0; i < category.length; i++) {
      hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 65%, 50%)`;
  };

  const selectCategory = (category: string) => {
    setSelectedCategory(selectedCategory === category ? '' : category);
  };

  const calculateAnnualHours = (tasks?: IndustryStandardTask[]): number => {
    if (!tasks || tasks.length === 0) return 0;

    const frequencyMultipliers: Record<string, number> = {
      'Daily': 365,
      'Weekly': 52,
      'Monthly': 12,
      'Quarterly': 4,
      'Semi-annual': 2,
      'Annual': 1,
    };

    return tasks.reduce((total, task) => {
      const multiplier = frequencyMultipliers[task.frequency] || 12;
      return total + (task.hours_per_task * multiplier);
    }, 0);
  };

  const assetsByCategory = categories.reduce((acc, category) => {
    acc[category] = assets.filter(a => a.category === category);
    return acc;
  }, {} as Record<string, AssetWithTasks[]>);

  const searchMatches = (asset: AssetWithTasks): boolean => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return asset.asset_name.toLowerCase().includes(query) ||
           asset.category.toLowerCase().includes(query) ||
           asset.standard_code?.toLowerCase().includes(query) ||
           asset.description?.toLowerCase().includes(query);
  };

  const similarAssets = useMemo(() => {
    if (!editingAsset || !editingAsset.asset_name || !editingAsset.category) {
      return [];
    }

    const allExisting = assets.filter(a => a.id !== editingAsset.id);
    return findSimilarAssets(editingAsset.asset_name, editingAsset.category, allExisting, 70);
  }, [editingAsset?.asset_name, editingAsset?.category, editingAsset?.id, assets]);

  const getCategoryStats = (category: string) => {
    const categoryAssets = assetsByCategory[category] || [];
    const matchingAssets = categoryAssets.filter(searchMatches);
    const totalHours = categoryAssets.reduce((sum, asset) => sum + calculateAnnualHours(asset.tasks), 0);
    return {
      total: categoryAssets.length,
      matches: matchingAssets.length,
      totalHours
    };
  };

  useEffect(() => {
    if (searchQuery && categories.length > 0) {
      const matchingCategory = categories.find(category => {
        const categoryAssets = assetsByCategory[category] || [];
        return categoryAssets.some(searchMatches);
      });
      if (matchingCategory) {
        setSelectedCategory(matchingCategory);
      }
    }
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading asset library...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Industry Standard Asset Library</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Manage standardized assets with PPM tasks and maintenance schedules
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsDownloadModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="w-5 h-5" />
                Download
              </button>
              {canManageLibrary && (
                <button
                  onClick={handleAddNew}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-5 h-5" />
                  Add Asset
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assets by name, category, or code..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="border-b border-gray-200">
          {categories.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No categories found. {canManageLibrary && 'Click "Add Asset" to create one.'}
            </div>
          ) : (
            <div className="flex overflow-x-auto">
              {categories.map(category => {
                const stats = getCategoryStats(category);
                const isSelected = selectedCategory === category;
                const categoryColor = getCategoryColor(category);
                const hasMatches = stats.matches > 0;

                if (searchQuery && !hasMatches) return null;

                return (
                  <button
                    key={category}
                    onClick={() => selectCategory(category)}
                    className={`relative flex-shrink-0 px-6 py-4 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${
                      isSelected
                        ? 'text-gray-900'
                        : 'text-gray-600 hover:text-gray-900 border-transparent'
                    }`}
                    style={{
                      borderBottomColor: isSelected ? categoryColor : undefined,
                      backgroundColor: isSelected ? `${categoryColor}08` : undefined,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span>{category}</span>
                      <span
                        className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: categoryColor }}
                      >
                        {searchQuery ? `${stats.matches}/${stats.total}` : stats.total}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6">
          {!selectedCategory ? (
            <div className="py-20 text-center text-gray-400">
              <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">Select a category to view assets</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(() => {
                const categoryAssets = assetsByCategory[selectedCategory] || [];
                const matchingAssets = categoryAssets.filter(searchMatches);

                if (matchingAssets.length === 0) {
                  return (
                    <div className="py-12 text-center text-gray-400">
                      No assets found in this category
                    </div>
                  );
                }

                return matchingAssets.map(asset => (
                  <div
                    key={asset.id}
                    className="bg-white border border-gray-200 rounded-lg px-4 py-3 hover:bg-gray-50 hover:border-gray-300 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleAssetExpand(asset.id)}
                            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                          >
                            {expandedAssets.has(asset.id) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-gray-900">
                                {asset.asset_name}
                              </h4>
                              {asset.standard_code && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                  {asset.standard_code}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {expandedAssets.has(asset.id) && asset.tasks && (
                          <div className="ml-7 mt-3 bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <h5 className="text-sm font-semibold text-gray-700 mb-3">PPM Tasks</h5>
                            {asset.tasks.length === 0 ? (
                              <p className="text-sm text-gray-500">No tasks defined</p>
                            ) : (
                              <div className="space-y-2">
                                {asset.tasks.map(task => (
                                  <div key={task.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-200 last:border-0">
                                    <span className="text-gray-900 font-medium">{task.task_name}</span>
                                    <div className="flex items-center gap-3">
                                      <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded font-medium text-xs">
                                        {task.frequency}
                                      </span>
                                      <span className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded font-medium text-xs">
                                        {task.hours_per_task}h
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {canManageLibrary && (
                        <div className="flex items-center gap-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleDuplicate(asset)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded"
                            title="Duplicate asset"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(asset)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit asset"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(asset.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                            title="Delete asset"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>
      </div>

      {editingAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {isAddingNew ? 'Add New Asset' : 'Edit Asset'}
              </h2>
              <button
                onClick={() => {
                  setEditingAsset(null);
                  setIsAddingNew(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Asset Name *
                    </label>
                    <input
                      type="text"
                      value={editingAsset.asset_name}
                      onChange={(e) => setEditingAsset({ ...editingAsset, asset_name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category * <span className="text-xs text-gray-500">(Select existing or type new)</span>
                    </label>
                    <input
                      type="text"
                      list="categories-list"
                      value={editingAsset.category}
                      onChange={(e) => setEditingAsset({ ...editingAsset, category: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Select or type category name"
                    />
                    <datalist id="categories-list">
                      {categories.filter(c => c !== 'All').map(cat => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Standard Code
                  </label>
                  <input
                    type="text"
                    value={editingAsset.standard_code}
                    onChange={(e) => setEditingAsset({ ...editingAsset, standard_code: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editingAsset.description || ''}
                    onChange={(e) => setEditingAsset({ ...editingAsset, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {similarAssets.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-yellow-900 mb-2">
                          Similar Assets Found
                        </h4>
                        <p className="text-sm text-yellow-800 mb-3">
                          These assets are similar to what you're entering. Consider using an existing asset to avoid duplicates.
                        </p>
                        <div className="space-y-2">
                          {similarAssets.slice(0, 3).map(({ asset, similarity }) => (
                            <div
                              key={asset.id}
                              className="bg-white rounded-lg p-3 border border-yellow-300"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-gray-900">{asset.asset_name}</span>
                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-medium">
                                      {similarity}% match
                                    </span>
                                  </div>
                                  {asset.standard_code && (
                                    <div className="text-xs text-gray-600">
                                      Code: {asset.standard_code}
                                    </div>
                                  )}
                                  {asset.description && (
                                    <div className="text-xs text-gray-600 mt-1">
                                      {asset.description.substring(0, 100)}
                                      {asset.description.length > 100 ? '...' : ''}
                                    </div>
                                  )}
                                </div>
                                <button
                                  onClick={async () => {
                                    const tasks = await fetchIndustryStandardTasks(asset.id);
                                    setEditingAsset({ ...asset, tasks });
                                  }}
                                  className="ml-3 text-xs text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  Use This
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      PPM Tasks
                    </label>
                    <button
                      onClick={handleAddTask}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <Plus className="w-4 h-4" />
                      Add Task
                    </button>
                  </div>

                  {editingAsset.tasks && editingAsset.tasks.length > 0 ? (
                    <div className="space-y-3">
                      {editingAsset.tasks.map((task, index) => (
                        <div key={task.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1 grid grid-cols-3 gap-3">
                            <input
                              type="text"
                              value={task.task_name}
                              onChange={(e) => {
                                const updatedTasks = [...(editingAsset.tasks || [])];
                                updatedTasks[index] = { ...task, task_name: e.target.value };
                                setEditingAsset({ ...editingAsset, tasks: updatedTasks });
                              }}
                              placeholder="Task name"
                              className="px-3 py-2 border rounded text-sm"
                            />
                            <select
                              value={task.frequency}
                              onChange={(e) => {
                                const updatedTasks = [...(editingAsset.tasks || [])];
                                updatedTasks[index] = { ...task, frequency: e.target.value };
                                setEditingAsset({ ...editingAsset, tasks: updatedTasks });
                              }}
                              className="px-3 py-2 border rounded text-sm"
                            >
                              <option value="Daily">Daily</option>
                              <option value="Weekly">Weekly</option>
                              <option value="Monthly">Monthly</option>
                              <option value="Quarterly">Quarterly</option>
                              <option value="Semi-annual">Semi-annual</option>
                              <option value="Annual">Annual</option>
                            </select>
                            <input
                              type="number"
                              value={task.hours_per_task}
                              onChange={(e) => {
                                const updatedTasks = [...(editingAsset.tasks || [])];
                                updatedTasks[index] = { ...task, hours_per_task: parseFloat(e.target.value) || 0 };
                                setEditingAsset({ ...editingAsset, tasks: updatedTasks });
                              }}
                              placeholder="Hours"
                              step="0.5"
                              className="px-3 py-2 border rounded text-sm"
                            />
                          </div>
                          <button
                            onClick={() => handleRemoveTask(task.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 py-4">No tasks added yet</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => {
                  setEditingAsset(null);
                  setIsAddingNew(false);
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!editingAsset.asset_name || !editingAsset.category}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                Save Asset
              </button>
            </div>
          </div>
        </div>
      )}

      <AssetLibraryDownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        categories={categories}
        onDownload={exportAssetLibraryToCSV}
      />

      <AddAssetChoiceModal
        isOpen={isAddChoiceModalOpen}
        onClose={() => setIsAddChoiceModalOpen(false)}
        onAddManually={handleAddManually}
        onImportCSV={() => setIsImportModalOpen(true)}
        onDownloadTemplate={generateCSVTemplate}
      />

      <AssetLibraryImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={loadData}
      />
    </div>
  );
}
