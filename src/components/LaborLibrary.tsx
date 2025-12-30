import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
import { useOrganization } from '../contexts/OrganizationContext';
import { usePermissions } from '../hooks/usePermissions';
import { TechnicianModal, RetrofitLaborModal, CleanerModal } from './TechnicianModal';
import { getSkillTagColor, SKILL_TAG_CATEGORIES } from '../utils/skillTags';
import { ViewOnlyBadge } from './ViewOnlyBadge';
import {
  loadFMTechnicians,
  saveFMTechnician,
  updateFMTechnician,
  deleteFMTechnician,
  loadRetrofitLabor,
  saveRetrofitLabor,
  updateRetrofitLabor,
  deleteRetrofitLabor,
  loadCleaners,
  saveCleaner,
  updateCleaner,
  deleteCleaner,
  type OrgFMTechnician,
  type OrgRetrofitLabor,
  type OrgCleaner,
} from '../utils/laborLibraryDatabase';

type TabType = 'fm' | 'retrofit' | 'cleaners';

export const LaborLibrary: React.FC = () => {
  const { currentOrganization } = useOrganization();
  const { canEditModule, isModuleViewOnly } = usePermissions();
  const canEdit = canEditModule('labor_library');
  const isViewOnly = isModuleViewOnly('labor_library');
  const [activeTab, setActiveTab] = useState<TabType>('fm');
  const [loading, setLoading] = useState(false);

  const [fmTechnicians, setFmTechnicians] = useState<OrgFMTechnician[]>([]);
  const [retrofitLabor, setRetrofitLabor] = useState<OrgRetrofitLabor[]>([]);
  const [cleaners, setCleaners] = useState<OrgCleaner[]>([]);

  const [showFMModal, setShowFMModal] = useState(false);
  const [showRetrofitModal, setShowRetrofitModal] = useState(false);
  const [showCleanerModal, setShowCleanerModal] = useState(false);
  const [editingTech, setEditingTech] = useState<OrgFMTechnician | null>(null);
  const [editingLabor, setEditingLabor] = useState<OrgRetrofitLabor | null>(null);
  const [editingCleanerData, setEditingCleanerData] = useState<OrgCleaner | null>(null);

  useEffect(() => {
    if (currentOrganization) {
      loadData();
    }
  }, [currentOrganization]);

  const loadData = async () => {
    if (!currentOrganization) return;
    setLoading(true);
    try {
      const [fm, retrofit, clean] = await Promise.all([
        loadFMTechnicians(currentOrganization.id),
        loadRetrofitLabor(currentOrganization.id),
        loadCleaners(currentOrganization.id),
      ]);
      setFmTechnicians(fm);
      setRetrofitLabor(retrofit);
      setCleaners(clean);
    } catch (error) {
      console.error('Failed to load labor library:', error);
      alert('Failed to load labor library');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFM = () => {
    setEditingTech(null);
    setShowFMModal(true);
  };

  const handleSaveFM = async (techData: Partial<OrgFMTechnician>) => {
    if (!currentOrganization) return;
    try {
      if (editingTech) {
        const updated = await updateFMTechnician(editingTech.id, techData);
        setFmTechnicians(fmTechnicians.map(t => t.id === editingTech.id ? updated : t));
      } else {
        const newTech = await saveFMTechnician({
          ...techData,
          organization_id: currentOrganization.id,
          is_active: true,
        } as Omit<OrgFMTechnician, 'id'>);
        setFmTechnicians([...fmTechnicians, newTech]);
      }
    } catch (error) {
      console.error('Failed to save FM technician:', error);
      alert('Failed to save FM technician');
    }
  };

  const handleEditFM = (tech: OrgFMTechnician) => {
    setEditingTech(tech);
    setShowFMModal(true);
  };

  const handleDeleteFM = async (id: string) => {
    if (!confirm('Delete this technician?')) return;
    try {
      await deleteFMTechnician(id);
      setFmTechnicians(fmTechnicians.filter((t) => t.id !== id));
    } catch (error) {
      console.error('Failed to delete FM technician:', error);
      alert('Failed to delete FM technician');
    }
  };

  const handleAddRetrofit = () => {
    setEditingLabor(null);
    setShowRetrofitModal(true);
  };

  const handleSaveRetrofit = async (laborData: Partial<OrgRetrofitLabor>) => {
    if (!currentOrganization) return;
    try {
      if (editingLabor) {
        const updated = await updateRetrofitLabor(editingLabor.id, laborData);
        setRetrofitLabor(retrofitLabor.map(l => l.id === editingLabor.id ? updated : l));
      } else {
        const newLabor = await saveRetrofitLabor({
          ...laborData,
          organization_id: currentOrganization.id,
          is_active: true,
        } as Omit<OrgRetrofitLabor, 'id'>);
        setRetrofitLabor([...retrofitLabor, newLabor]);
      }
    } catch (error) {
      console.error('Failed to save retrofit labor:', error);
      alert('Failed to save retrofit labor');
    }
  };

  const handleEditRetrofit = (labor: OrgRetrofitLabor) => {
    setEditingLabor(labor);
    setShowRetrofitModal(true);
  };

  const handleDeleteRetrofit = async (id: string) => {
    if (!confirm('Delete this labor?')) return;
    try {
      await deleteRetrofitLabor(id);
      setRetrofitLabor(retrofitLabor.filter((l) => l.id !== id));
    } catch (error) {
      console.error('Failed to delete retrofit labor:', error);
      alert('Failed to delete retrofit labor');
    }
  };

  const handleAddCleaner = () => {
    setEditingCleanerData(null);
    setShowCleanerModal(true);
  };

  const handleSaveCleaner = async (cleanerData: Partial<OrgCleaner>) => {
    if (!currentOrganization) return;
    try {
      if (editingCleanerData) {
        const updated = await updateCleaner(editingCleanerData.id, cleanerData);
        setCleaners(cleaners.map(c => c.id === editingCleanerData.id ? updated : c));
      } else {
        const newCleaner = await saveCleaner({
          ...cleanerData,
          organization_id: currentOrganization.id,
          is_active: true,
        } as Omit<OrgCleaner, 'id'>);
        setCleaners([...cleaners, newCleaner]);
      }
    } catch (error) {
      console.error('Failed to save cleaner:', error);
      alert('Failed to save cleaner');
    }
  };

  const handleEditCleaner = (cleaner: OrgCleaner) => {
    setEditingCleanerData(cleaner);
    setShowCleanerModal(true);
  };

  const handleDeleteCleaner = async (id: string) => {
    if (!confirm('Delete this cleaner?')) return;
    try {
      await deleteCleaner(id);
      setCleaners(cleaners.filter((c) => c.id !== id));
    } catch (error) {
      console.error('Failed to delete cleaner:', error);
      alert('Failed to delete cleaner');
    }
  };

  if (!currentOrganization) {
    return <div className="text-gray-600">No organization selected</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-3">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('fm')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'fm'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              FM Technicians
            </button>
            <button
              onClick={() => setActiveTab('retrofit')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'retrofit'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Retrofit Labor
            </button>
            <button
              onClick={() => setActiveTab('cleaners')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'cleaners'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Cleaners (HK)
            </button>
          </nav>
          {isViewOnly && <ViewOnlyBadge />}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <div className="p-6">
          {activeTab === 'fm' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">FM Technicians</h3>
                {canEdit && (
                  <button
                    onClick={handleAddFM}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Technician
                  </button>
                )}
              </div>
              {fmTechnicians.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No FM technicians yet. Click "Add Technician" to create one.
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3 text-left font-medium text-gray-700">Type</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-700">Skills</th>
                        <th className="px-3 py-3 text-right font-medium text-gray-700">Salary (AED)</th>
                        <th className="px-3 py-3 text-right font-medium text-gray-700">Additional Cost (AED)</th>
                        <th className="px-3 py-3 text-right font-medium text-gray-700">Hourly Rate (AED)</th>
                        <th className="px-3 py-3 text-center font-medium text-gray-700">OT Hrs/Mo</th>
                        <th className="px-3 py-3 text-center font-medium text-gray-700">Supervisor</th>
                        <th className="px-3 py-3 text-center font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fmTechnicians.map((tech, idx) => (
                        <tr key={tech.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 py-2">
                            <span className="font-medium text-gray-900">{tech.name}</span>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap gap-1">
                              {(tech.skill_tags || []).length === 0 ? (
                                <span className="text-xs text-gray-400 italic">No skills set</span>
                              ) : (
                                <>
                                  {(tech.skill_tags || []).slice(0, 3).map((tagId) => {
                                    const tag = SKILL_TAG_CATEGORIES
                                      .flatMap(c => c.tags)
                                      .find(t => t.id === tagId);
                                    if (!tag) return null;
                                    return (
                                      <span
                                        key={tagId}
                                        className={`text-xs px-2 py-0.5 rounded-full ${getSkillTagColor(tagId)}`}
                                      >
                                        {tag.label}
                                      </span>
                                    );
                                  })}
                                  {(tech.skill_tags || []).length > 3 && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                      +{(tech.skill_tags || []).length - 3}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right">
                            {tech.monthly_salary.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {tech.additional_cost.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {((tech.monthly_salary + tech.additional_cost) / 208).toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {tech.expected_overtime_hours_per_month}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {tech.can_supervise ? (
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Yes</span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {canEdit ? (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleEditFM(tech)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteFM(tech.id)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">View Only</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'retrofit' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Retrofit Labor</h3>
                {canEdit && (
                  <button
                    onClick={handleAddRetrofit}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Labor
                  </button>
                )}
              </div>
              {retrofitLabor.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No retrofit labor yet. Click "Add Labor" to create one.
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3 text-left font-medium text-gray-700">Type</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-700">Role</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-700">Skills</th>
                        <th className="px-3 py-3 text-right font-medium text-gray-700">Salary (AED)</th>
                        <th className="px-3 py-3 text-right font-medium text-gray-700">Additional Cost (AED)</th>
                        <th className="px-3 py-3 text-center font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {retrofitLabor.map((labor, idx) => (
                        <tr key={labor.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 py-2">
                            <span className="font-medium text-gray-900">{labor.name}</span>
                          </td>
                          <td className="px-3 py-2 text-gray-700">{labor.role}</td>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap gap-1">
                              {(labor.skill_tags || []).length === 0 ? (
                                <span className="text-xs text-gray-400 italic">No skills set</span>
                              ) : (
                                <>
                                  {(labor.skill_tags || []).slice(0, 3).map((tagId) => {
                                    const tag = SKILL_TAG_CATEGORIES
                                      .flatMap(c => c.tags)
                                      .find(t => t.id === tagId);
                                    if (!tag) return null;
                                    return (
                                      <span
                                        key={tagId}
                                        className={`text-xs px-2 py-0.5 rounded-full ${getSkillTagColor(tagId)}`}
                                      >
                                        {tag.label}
                                      </span>
                                    );
                                  })}
                                  {(labor.skill_tags || []).length > 3 && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                      +{(labor.skill_tags || []).length - 3}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right">{labor.monthly_salary.toLocaleString()}</td>
                          <td className="px-3 py-2 text-right">{labor.additional_cost.toLocaleString()}</td>
                          <td className="px-3 py-2">
                            {canEdit ? (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleEditRetrofit(labor)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRetrofit(labor.id)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">View Only</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'cleaners' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Cleaners (HK)</h3>
                {canEdit && (
                  <button
                    onClick={handleAddCleaner}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Cleaner
                  </button>
                )}
              </div>
              {cleaners.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No cleaners yet. Click "Add Cleaner" to create one.
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3 text-left font-medium text-gray-700">Type</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-700">Skills</th>
                        <th className="px-3 py-3 text-right font-medium text-gray-700">Salary (AED)</th>
                        <th className="px-3 py-3 text-right font-medium text-gray-700">Additional Cost (AED)</th>
                        <th className="px-3 py-3 text-center font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cleaners.map((cleaner, idx) => (
                        <tr key={cleaner.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 py-2">
                            <span className="font-medium text-gray-900">{cleaner.name}</span>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap gap-1">
                              {(cleaner.skill_tags || []).length === 0 ? (
                                <span className="text-xs text-gray-400 italic">No skills set</span>
                              ) : (
                                <>
                                  {(cleaner.skill_tags || []).slice(0, 3).map((tagId) => {
                                    const tag = SKILL_TAG_CATEGORIES
                                      .flatMap(c => c.tags)
                                      .find(t => t.id === tagId);
                                    if (!tag) return null;
                                    return (
                                      <span
                                        key={tagId}
                                        className={`text-xs px-2 py-0.5 rounded-full ${getSkillTagColor(tagId)}`}
                                      >
                                        {tag.label}
                                      </span>
                                    );
                                  })}
                                  {(cleaner.skill_tags || []).length > 3 && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                      +{(cleaner.skill_tags || []).length - 3}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right">{cleaner.monthly_salary.toLocaleString()}</td>
                          <td className="px-3 py-2 text-right">{cleaner.additional_cost.toLocaleString()}</td>
                          <td className="px-3 py-2">
                            {canEdit ? (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleEditCleaner(cleaner)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCleaner(cleaner.id)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">View Only</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showFMModal && (
        <TechnicianModal
          onClose={() => setShowFMModal(false)}
          onSave={handleSaveFM}
          technician={editingTech}
        />
      )}

      {showRetrofitModal && (
        <RetrofitLaborModal
          onClose={() => setShowRetrofitModal(false)}
          onSave={handleSaveRetrofit}
          labor={editingLabor}
        />
      )}

      {showCleanerModal && (
        <CleanerModal
          onClose={() => setShowCleanerModal(false)}
          onSave={handleSaveCleaner}
          cleaner={editingCleanerData}
        />
      )}
    </div>
  );
};
