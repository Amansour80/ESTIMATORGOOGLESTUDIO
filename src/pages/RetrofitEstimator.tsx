import React, { useState, useEffect } from 'react';
import { Save, FolderOpen, Trash2, GitCompare, CreditCard as Edit, Plus, FileText, FileSpreadsheet, RefreshCw, Copy, Tag } from 'lucide-react';
import ApprovalSubmitButton from '../components/ApprovalSubmitButton';
import { ViewOnlyBadge } from '../components/ViewOnlyBadge';
import { RetrofitState } from '../types/retrofit';
import { getDefaultRetrofitState } from '../utils/retrofitDefaults';
import { calculateRetrofitResults } from '../utils/retrofitCalculations';
import {
  saveRetrofitProject,
  loadRetrofitProject,
  listRetrofitProjects,
  deleteRetrofitProject,
  SavedRetrofitProject,
} from '../utils/retrofitDatabase';
import { ProjectInfo } from '../components/retrofit/ProjectInfo';
import { ProjectPhases } from '../components/retrofit/ProjectPhases';
import { LaborLibrary } from '../components/retrofit/LaborLibrary';
import { ManpowerPlanning } from '../components/retrofit/ManpowerPlanning';
import { AssetsList } from '../components/retrofit/AssetsList';
import MaterialsCatalog from '../components/retrofit/MaterialsCatalog';
import { SubcontractorsConfig } from '../components/retrofit/SubcontractorsConfig';
import SupervisionConfig from '../components/retrofit/SupervisionConfig';
import { LogisticsItems } from '../components/retrofit/LogisticsItems';
import { CostConfig } from '../components/retrofit/CostConfig';
import { RetrofitSummary } from '../components/retrofit/RetrofitSummary';
import { exportRetrofitToPDF } from '../utils/exportRetrofitPDF';
import { exportRetrofitToExcel } from '../utils/exportRetrofitExcel';
import { exportClientBOQToPDF, exportClientBOQToExcel } from '../utils/exportClientBOQ';
import { ProjectComparison } from '../components/retrofit/ProjectComparison';
import { loadRetrofitLabor, loadCleaners, type OrgRetrofitLabor, type OrgCleaner } from '../utils/laborLibraryDatabase';
import { useOrganization } from '../contexts/OrganizationContext';
import { useUnsavedChanges } from '../contexts/UnsavedChangesContext';
import { StatusBadge } from '../components/StatusBadge';
import { StatusChangeModal } from '../components/StatusChangeModal';
import type { ProjectStatus } from '../types/projectStatus';
import { changeRetrofitProjectStatus } from '../utils/retrofitDatabase';
import { usePermissions } from '../hooks/usePermissions';
import { BOQModeView } from '../components/retrofit/BOQModeView';
import type { BOQLineItem } from '../types/boq';
import type { Inquiry } from '../types/inquiry';
import { markInquiryAsConverted, clearInquiryConversion } from '../utils/inquiryDatabase';

interface RetrofitEstimatorProps {
  isSidebarCollapsed: boolean;
  initialProjectId?: string;
  inquiryData?: Inquiry;
  onInquiryDataUsed?: () => void;
  convertingInquiryId?: string | null;
  onInquiryConverted?: () => void;
}

export function RetrofitEstimator({ isSidebarCollapsed, initialProjectId, inquiryData, onInquiryDataUsed, convertingInquiryId, onInquiryConverted }: RetrofitEstimatorProps) {
  const { currentOrganization } = useOrganization();
  const { setUnsavedChanges, checkUnsavedBeforeNavigation } = useUnsavedChanges();
  const [state, setState] = useState<RetrofitState>(getDefaultRetrofitState());
  const [savedProjects, setSavedProjects] = useState<SavedRetrofitProject[]>([]);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [globalLaborLoaded, setGlobalLaborLoaded] = useState(false);
  const [initialStateSnapshot, setInitialStateSnapshot] = useState<string>('');
  const [currentProjectStatus, setCurrentProjectStatus] = useState<ProjectStatus>('DRAFT');
  const [statusChangeProject, setStatusChangeProject] = useState<SavedRetrofitProject | null>(null);
  const { isAdmin, canEditProjectWithStatus, canEditModule, isModuleViewOnly } = usePermissions();
  const isModuleReadOnly = isModuleViewOnly('retrofit_estimator');
  const [orgLaborLibrary, setOrgLaborLibrary] = useState<OrgRetrofitLabor[]>([]);
  const [isNewProject, setIsNewProject] = useState(true);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  const results = calculateRetrofitResults(state, orgLaborLibrary);

  useEffect(() => {
    loadProjectsList();
    loadGlobalLabor();
  }, [currentOrganization]);

  useEffect(() => {
    if (initialProjectId) {
      loadProjectById(initialProjectId);
    }
  }, [initialProjectId]);

  useEffect(() => {
    if (inquiryData) {
      setState(prev => ({
        ...prev,
        projectInfo: {
          ...prev.projectInfo,
          clientName: inquiryData.client_name,
          projectName: inquiryData.project_name,
          projectLocation: inquiryData.project_location || prev.projectInfo.projectLocation,
          projectDescription: inquiryData.description || prev.projectInfo.projectDescription
        }
      }));
      if (onInquiryDataUsed) {
        onInquiryDataUsed();
      }
    }
  }, [inquiryData]);

  const loadProjectById = async (projectId: string) => {
    const projects = await listRetrofitProjects();
    const project = projects.find(p => p.id === projectId);
    if (project && project.project_data) {
      const status = project.status || 'DRAFT';
      setState(project.project_data);
      setCurrentProjectStatus(status);
      setIsNewProject(false);
      setCurrentProjectId(projectId);

      // Always load in readonly mode - user must click Edit to make changes
      setIsReadOnly(true);

      setInitialStateSnapshot(JSON.stringify(project.project_data));
      setUnsavedChanges('retrofit', false);
      await loadGlobalLabor(true);
    }
  };

  useEffect(() => {
    if (initialStateSnapshot) {
      const currentSnapshot = JSON.stringify(state);
      const hasChanges = currentSnapshot !== initialStateSnapshot;
      setUnsavedChanges('retrofit', hasChanges);
    }
  }, [state, initialStateSnapshot, setUnsavedChanges]);

  const loadProjectsList = async () => {
    try {
      const projects = await listRetrofitProjects();
      setSavedProjects(projects);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadGlobalLabor = async (forceReload: boolean = false) => {
    if (!currentOrganization || (globalLaborLoaded && !forceReload)) return;

    try {
      const [orgLabor, orgCleaners] = await Promise.all([
        loadRetrofitLabor(currentOrganization.id),
        loadCleaners(currentOrganization.id),
      ]);

      setOrgLaborLibrary(orgLabor);

      const workingHoursPerMonth = 173;

      const laborLibrary = [
        ...orgLabor.map((labor) => ({
          id: labor.id,
          name: labor.name,
          role: labor.role,
          monthlySalary: labor.monthly_salary,
          additionalCost: labor.additional_cost,
          hourlyRate: labor.hourly_rate || (labor.monthly_salary + labor.additional_cost) / workingHoursPerMonth,
          notes: '',
        })),
        ...orgCleaners.map((cleaner) => ({
          id: cleaner.id,
          name: cleaner.name,
          role: 'Cleaner',
          monthlySalary: cleaner.monthly_salary,
          additionalCost: cleaner.additional_cost,
          hourlyRate: cleaner.hourly_rate || (cleaner.monthly_salary + cleaner.additional_cost) / workingHoursPerMonth,
          notes: '',
        })),
      ];

      if (laborLibrary.length > 0) {
        setState((prev) => ({
          ...prev,
          laborLibrary,
        }));
        setGlobalLaborLoaded(true);

        setState((currentState) => {
          const snapshot = JSON.stringify(currentState);
          setInitialStateSnapshot(snapshot);
          return currentState;
        });
      }
    } catch (error) {
      console.error('Failed to load global labor library:', error);
    }
  };

  const handleSave = async () => {
    if (!state.projectInfo.projectName.trim()) {
      alert('Please enter a project name before saving.');
      return;
    }

    if (!state.projectInfo.estimationMode) {
      setState((prev) => ({
        ...prev,
        projectInfo: { ...prev.projectInfo, estimationMode: 'standard' }
      }));
    }

    setIsSaving(true);
    try {
      const result = await saveRetrofitProject(state.projectInfo.projectName, state, currentOrganization?.id);
      alert('Project saved successfully!');
      setIsNewProject(false);
      setCurrentProjectId(result.projectId);
      setInitialStateSnapshot(JSON.stringify(state));
      setUnsavedChanges('retrofit', false);
      await loadProjectsList();

      if (convertingInquiryId && result.projectId) {
        try {
          await markInquiryAsConverted(convertingInquiryId, result.projectId, 'retrofit');
          if (onInquiryConverted) {
            onInquiryConverted();
          }
        } catch (error) {
          console.error('Error marking inquiry as converted:', error);
        }
      }
    } catch (error: any) {
      console.error('Error saving project:', error);
      alert('Failed to save project: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRecalculate = () => {
    setState({ ...state });
    alert('Project recalculated successfully based on current data!');
  };

  const handleLoad = async (projectName: string) => {
    if (!checkUnsavedBeforeNavigation('dashboard')) {
      return;
    }
    try {
      const projectData = await loadRetrofitProject(projectName);
      const project = savedProjects.find(p => p.project_name === projectName);
      const status = project?.status || 'DRAFT';

      if (projectData) {
        setState(projectData);
        setCurrentProjectStatus(status);
        setIsNewProject(false);
        setCurrentProjectId(project?.id || null);
        setShowLoadDialog(false);

        // Always load in readonly mode - user must click Edit to make changes
        setIsReadOnly(true);

        setInitialStateSnapshot(JSON.stringify(projectData));
        setUnsavedChanges('retrofit', false);
        await loadGlobalLabor(true);
        alert('Project loaded successfully! Click Edit to make changes.');
      }
    } catch (error: any) {
      console.error('Error loading project:', error);
      alert('Failed to load project: ' + error.message);
    }
  };

  const handleDelete = async (projectName: string, projectId: string) => {
    if (!confirm(`Are you sure you want to delete project "${projectName}"?`)) {
      return;
    }

    try {
      await deleteRetrofitProject(projectName);
      alert('Project deleted successfully!');

      try {
        await clearInquiryConversion(projectId);
      } catch (error) {
        console.error('Error clearing inquiry conversion:', error);
      }

      await loadProjectsList();
    } catch (error: any) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project: ' + error.message);
    }
  };

  const handleNewProject = () => {
    if (isModuleReadOnly) {
      alert('You have view-only access to this module. Contact your administrator to request edit permissions.');
      return;
    }

    if (!checkUnsavedBeforeNavigation('dashboard')) {
      return;
    }
    if (confirm('Create a new project?')) {
      const defaultState = getDefaultRetrofitState();
      setState(defaultState);
      setCurrentProjectStatus('DRAFT');
      setCurrentProjectId(null);
      setIsNewProject(true);
      setGlobalLaborLoaded(false);
      setInitialStateSnapshot(JSON.stringify(defaultState));
      setUnsavedChanges('retrofit', false);
      setTimeout(() => loadGlobalLabor(), 100);
      setIsReadOnly(false);
    }
  };

  const handleEdit = () => {
    if (isModuleReadOnly) {
      alert('You have view-only access to this module. Contact your administrator to request edit permissions.');
      return;
    }

    if (!canEditProjectWithStatus(currentProjectStatus)) {
      alert('You do not have permission to edit this project. Only admins can edit projects that are not in DRAFT status.');
      return;
    }

    if (confirm('Enable editing? You can modify project data after confirming.')) {
      setIsReadOnly(false);
    }
  };

  const handleDuplicate = async () => {
    const baseName = state.projectInfo?.projectName?.trim() || 'Untitled Project';
    const newName = prompt(`Enter name for duplicated project:`, `${baseName} (Copy)`);

    if (!newName || !newName.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      const duplicatedState = {
        ...state,
        projectInfo: {
          ...state.projectInfo,
          projectName: newName.trim(),
        },
      };

      const result = await saveRetrofitProject(newName.trim(), duplicatedState);
      setCurrentProjectId(result.projectId);
      alert(`Project duplicated successfully as "${newName.trim()}"!`);
      await loadProjectsList();
    } catch (error: any) {
      console.error('Error duplicating project:', error);
      alert('Failed to duplicate project: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Retrofit Projects Estimator</h1>
              <p className="text-orange-100">Estimate costs for HVAC asset replacement and retrofit projects</p>
            </div>
            {isModuleReadOnly && <ViewOnlyBadge />}
          </div>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap items-center">
          {!isModuleReadOnly && (
            <button
              onClick={handleNewProject}
              className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:scale-105 transition-all shadow-sm hover:shadow-md"
              title="New Project"
              aria-label="New Project"
            >
              <Plus size={20} />
            </button>
          )}
          {!isModuleReadOnly && (
            <button
              onClick={handleSave}
              disabled={isSaving || isReadOnly}
              className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 hover:scale-105 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              title={isSaving ? 'Saving...' : 'Save Project'}
              aria-label={isSaving ? 'Saving...' : 'Save Project'}
            >
              <Save size={20} />
            </button>
          )}
          {!isModuleReadOnly && (
            <button
              onClick={handleDuplicate}
              disabled={isSaving}
              className="p-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 hover:scale-105 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              title="Duplicate Project"
              aria-label="Duplicate Project"
            >
              <Copy size={20} />
            </button>
          )}
          <button
            onClick={() => setShowLoadDialog(!showLoadDialog)}
            className="p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 hover:scale-105 transition-all shadow-sm hover:shadow-md"
            title="Load Project"
            aria-label="Load Project"
          >
            <FolderOpen size={20} />
          </button>

          <div className="w-px h-8 bg-gray-300 mx-1"></div>

          {currentProjectId && (
            <ApprovalSubmitButton
              projectId={currentProjectId}
              projectType="retrofit"
              onSubmitted={() => {
                loadProjectsList();
              }}
            />
          )}
          {isReadOnly && !isModuleReadOnly && (
            <button
              onClick={handleEdit}
              className="p-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 hover:scale-105 transition-all shadow-sm hover:shadow-md"
              title="Edit Project"
              aria-label="Edit Project"
            >
              <Edit size={20} />
            </button>
          )}
          <button
            onClick={async () => {
              await loadProjectsList();
              setShowComparison(true);
            }}
            className="p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 hover:scale-105 transition-all shadow-sm hover:shadow-md"
            title="Compare Projects"
            aria-label="Compare Projects"
          >
            <GitCompare size={20} />
          </button>

          <div className="w-px h-8 bg-gray-300 mx-1"></div>

          <button
            onClick={() => {
              try {
                exportRetrofitToExcel(state, results);
              } catch (error) {
                console.error('Error exporting Excel:', error);
                alert('Failed to export Excel. Please try again.');
              }
            }}
            className="p-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 hover:scale-105 transition-all shadow-sm hover:shadow-md"
            title="Export Excel"
            aria-label="Export Excel"
          >
            <FileSpreadsheet size={20} />
          </button>
          <button
            onClick={() => {
              try {
                exportRetrofitToPDF(state, results, orgLaborLibrary, currentOrganization?.currency || 'AED');
              } catch (error) {
                console.error('Error exporting PDF:', error);
                alert('Failed to export PDF. Please try again.');
              }
            }}
            className="p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 hover:scale-105 transition-all shadow-sm hover:shadow-md"
            title="Export PDF"
            aria-label="Export PDF"
          >
            <FileText size={20} />
          </button>
          {state.projectInfo.estimationMode === 'boq' && state.boqLineItems && state.boqLineItems.length > 0 && (
            <>
              <button
                onClick={async () => {
                  try {
                    const info = {
                      location: state.projectInfo.projectLocation,
                      client: state.projectInfo.clientName,
                      description: state.projectInfo.projectDescription
                    };
                    await exportClientBOQToExcel(
                      state.projectInfo.projectName,
                      info,
                      state.boqLineItems || [],
                      orgLaborLibrary,
                      state.costConfig,
                      currentOrganization?.currency || 'AED'
                    );
                  } catch (error) {
                    console.error('Error exporting Client BOQ Excel:', error);
                    alert('Failed to export Client BOQ Excel. Please try again.');
                  }
                }}
                className="p-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 hover:scale-105 transition-all shadow-sm hover:shadow-md"
                title="Export Client BOQ Excel"
                aria-label="Export Client BOQ Excel"
              >
                <FileSpreadsheet size={20} />
              </button>
              <button
                onClick={() => {
                  try {
                    const info = {
                      location: state.projectInfo.projectLocation,
                      client: state.projectInfo.clientName,
                      description: state.projectInfo.projectDescription
                    };
                    exportClientBOQToPDF(
                      state.projectInfo.projectName,
                      info,
                      state.boqLineItems || [],
                      orgLaborLibrary,
                      state.costConfig,
                      currentOrganization?.currency || 'AED'
                    );
                  } catch (error) {
                    console.error('Error exporting Client BOQ PDF:', error);
                    alert('Failed to export Client BOQ PDF. Please try again.');
                  }
                }}
                className="p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 hover:scale-105 transition-all shadow-sm hover:shadow-md"
                title="Export Client BOQ PDF"
                aria-label="Export Client BOQ PDF"
              >
                <FileText size={20} />
              </button>
            </>
          )}

          <div className="w-px h-8 bg-gray-300 mx-1"></div>

          <button
            onClick={handleRecalculate}
            className="p-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 hover:scale-105 transition-all shadow-sm hover:shadow-md"
            title="Recalculate"
            aria-label="Recalculate"
          >
            <RefreshCw size={20} />
          </button>
        </div>

        {isReadOnly && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Read-only mode:</strong> This project is currently view-only. Click <strong>Edit Project</strong> to make changes.
                </p>
              </div>
            </div>
          </div>
        )}

        {showLoadDialog && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Saved Projects</h2>
            {savedProjects.length === 0 ? (
              <p className="text-gray-500">No saved projects found.</p>
            ) : (
              <div className="space-y-2">
                {savedProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-800">{project.project_name}</p>
                        <StatusBadge status={project.status} />
                      </div>
                      <p className="text-sm text-gray-500">
                        Last updated: {new Date(project.updated_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setStatusChangeProject(project)}
                        className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                        title="Change Status"
                      >
                        <Tag size={16} />
                      </button>
                      <button
                        onClick={() => handleLoad(project.project_name)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleDelete(project.project_name, project.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-1"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="space-y-6">
          <fieldset disabled={isReadOnly}>
            <ProjectInfo
              projectInfo={state.projectInfo}
              onChange={(projectInfo) => setState({ ...state, projectInfo })}
              showModeSelector={true}
              isModeLocked={!isNewProject}
            />

            {state.projectInfo.estimationMode === 'boq' ? (
              <BOQModeView
                projectName={state.projectInfo.projectName}
                projectInfo={{
                  location: state.projectInfo.projectLocation,
                  client: state.projectInfo.clientName,
                  description: state.projectInfo.projectDescription
                }}
                lineItems={state.boqLineItems || []}
                laborLibrary={orgLaborLibrary}
                currency={currentOrganization?.currency || 'AED'}
                costConfig={state.costConfig}
                onLineItemsChange={(boqLineItems) => setState({ ...state, boqLineItems })}
              />
            ) : (
              <>
                <ProjectPhases
                  phases={state.projectPhases}
                  onChange={(projectPhases) => setState({ ...state, projectPhases })}
                />

                <LaborLibrary
                  laborTypes={state.laborLibrary}
                  onChange={(laborLibrary) => setState({ ...state, laborLibrary })}
                />

                <ManpowerPlanning
                  manpowerItems={state.manpowerItems}
                  laborLibrary={state.laborLibrary}
                  onChange={(manpowerItems) => setState({ ...state, manpowerItems })}
                />

                <AssetsList
                  assets={state.assets}
                  onChange={(assets) => setState({ ...state, assets })}
                  currency={currentOrganization?.currency || 'AED'}
                />

                <MaterialsCatalog
                  materials={state.materialsCatalog}
                  onUpdate={(materialsCatalog) => setState({ ...state, materialsCatalog })}
                  readOnly={isReadOnly || isModuleReadOnly}
                  currency={currentOrganization?.currency || 'AED'}
                />

                <SubcontractorsConfig
                  subcontractors={state.subcontractors}
                  onChange={(subcontractors) => setState({ ...state, subcontractors })}
                />

                <SupervisionConfig
                  supervisionRoles={state.supervisionRoles}
                  laborLibrary={state.laborLibrary}
                  onUpdate={(supervisionRoles) => setState({ ...state, supervisionRoles })}
                  readOnly={isReadOnly || isModuleReadOnly}
                />

                <LogisticsItems
                  items={state.logisticsItems}
                  onChange={(logisticsItems) => setState({ ...state, logisticsItems })}
                />
              </>
            )}

            <CostConfig config={state.costConfig} onChange={(costConfig) => setState({ ...state, costConfig })} />
          </fieldset>
        </div>

        <RetrofitSummary results={results} state={state} isSidebarCollapsed={isSidebarCollapsed} />

        {showComparison && (
          <ProjectComparison projects={savedProjects} onClose={() => setShowComparison(false)} />
        )}

        {statusChangeProject && (
          <StatusChangeModal
            projectName={statusChangeProject.project_name}
            currentStatus={statusChangeProject.status}
            statusHistory={statusChangeProject.status_history || []}
            isAdmin={isAdmin}
            onClose={() => setStatusChangeProject(null)}
            onStatusChange={async (newStatus: ProjectStatus) => {
              const result = await changeRetrofitProjectStatus(statusChangeProject.id, newStatus);
              if (result.success) {
                await loadProjectsList();
                setStatusChangeProject(null);
              } else {
                throw new Error(result.error || 'Failed to change status');
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
