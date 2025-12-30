import { useState, useEffect, useRef, useCallback, startTransition } from 'react';
import { FileSpreadsheet, FileText, RotateCcw, Save, FolderOpen, GitCompare, Plus, Trash2, X, CreditCard as Edit, RefreshCw, Copy } from 'lucide-react';
import ProjectInfo from '../components/fm/ProjectInfo';
import GlobalAssumptions from '../components/fm/GlobalAssumptions';
import DeployedTechnicians from '../components/fm/DeployedTechnicians';
import AssetLibrary from '../components/fm/AssetLibrary';
import AssetInventory from '../components/fm/AssetInventory';
import ContractModelConfig from '../components/fm/ContractModelConfig';
import CostConfigFM from '../components/fm/CostConfigFM';
import MaterialsCatalog from '../components/fm/MaterialsCatalog';
import ConsumablesCatalog from '../components/fm/ConsumablesCatalog';
import SpecializedServices from '../components/fm/SpecializedServices';
import SupervisoryConfig from '../components/fm/SupervisoryConfig';
import FloatingSummary from '../components/fm/FloatingSummary';
import { ProjectComparison } from '../components/fm/ProjectComparison';
import ApprovalSubmitButton from '../components/ApprovalSubmitButton';
import { ViewOnlyBadge } from '../components/ViewOnlyBadge';
import { getDefaultFMState } from '../utils/fmDefaults';
import { calculateFMResults } from '../utils/fmCalculations';
import { exportFMToExcel } from '../utils/exportFMExcel';
import { exportFMToPDF } from '../utils/exportFMPDF';
import { saveProject, updateProject, loadProjects, deleteProject, type SavedProject } from '../utils/fmDatabase';
import { loadFMTechnicians, type OrgFMTechnician } from '../utils/laborLibraryDatabase';
import { useOrganization } from '../contexts/OrganizationContext';
import { useUnsavedChanges } from '../contexts/UnsavedChangesContext';
import { usePermissions } from '../hooks/usePermissions';
import type { FMEstimatorState, TechnicianType } from '../types/fm';
import type { ProjectStatus } from '../types/projectStatus';
import type { Inquiry } from '../types/inquiry';
import { markInquiryAsConverted, clearInquiryConversion } from '../utils/inquiryDatabase';

interface FMEstimatorProps {
  isSidebarCollapsed: boolean;
  initialProjectId?: string;
  inquiryData?: Inquiry;
  onInquiryDataUsed?: () => void;
  convertingInquiryId?: string | null;
  onInquiryConverted?: () => void;
}

export default function FMEstimator({ isSidebarCollapsed, initialProjectId, inquiryData, onInquiryDataUsed, convertingInquiryId, onInquiryConverted }: FMEstimatorProps) {
  const { currentOrganization } = useOrganization();
  const { setUnsavedChanges, checkUnsavedBeforeNavigation } = useUnsavedChanges();
  const { canEditProjectWithStatus, canEditModule, isModuleViewOnly } = usePermissions();
  const isModuleReadOnly = isModuleViewOnly('fm_estimator');
  const [state, setState] = useState<FMEstimatorState>(() => {
    const defaultState = getDefaultFMState();
    defaultState.technicianLibrary = [];
    return defaultState;
  });
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentProjectName, setCurrentProjectName] = useState('Untitled Project');
  const [currentProjectStatus, setCurrentProjectStatus] = useState<ProjectStatus>('DRAFT');
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [globalLaborLoaded, setGlobalLaborLoaded] = useState(false);
  const [initialStateSnapshot, setInitialStateSnapshot] = useState<string>('');
  const specializedServicesRef = useRef<HTMLDivElement>(null);

  const results = calculateFMResults(state);

  const handleCreateSpecializedService = (assetTypeId: string) => {
    const asset = state.assetTypes.find(a => a.id === assetTypeId);
    if (!asset) return;

    const newService = {
      id: `service-${Date.now()}`,
      serviceName: `Subcontract - ${asset.category} - ${asset.assetName}`,
      type: 'Subcontract',
      pricingMode: 'lump_sum' as const,
      qty: 1,
      frequency: 'monthly' as const,
      annualCost: 0,
      linkedAssetTypeIds: [assetTypeId],
      notes: 'Auto-created from Asset Inventory',
    };

    setState(prev => ({
      ...prev,
      specializedServices: [...prev.specializedServices, newService],
    }));
  };

  const handleAssetTypesChange = (newAssetTypes: typeof state.assetTypes) => {
    const addedCount = newAssetTypes.length - state.assetTypes.length;
    if (addedCount > 5) {
      isProcessingImport.current = true;
      setTimeout(() => { isProcessingImport.current = false; }, 2000);
    }

    const deletedAssetIds = state.assetTypes
      .filter(oldAsset => !newAssetTypes.find(newAsset => newAsset.id === oldAsset.id))
      .map(asset => asset.id);

    if (deletedAssetIds.length > 0) {
      const cleanedServices = state.specializedServices.map(service => ({
        ...service,
        linkedAssetTypeIds: service.linkedAssetTypeIds.filter(id => !deletedAssetIds.includes(id)),
      }));

      setState(prev => ({
        ...prev,
        assetTypes: newAssetTypes,
        specializedServices: cleanedServices,
      }));
    } else {
      setState(prev => ({ ...prev, assetTypes: newAssetTypes }));
    }
  };

  useEffect(() => {
    refreshProjects();
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
          projectType: prev.projectInfo.projectType
        }
      }));
      setCurrentProjectName(inquiryData.project_name);
      if (onInquiryDataUsed) {
        onInquiryDataUsed();
      }
    }
  }, [inquiryData]);

  const loadProjectById = async (projectId: string) => {
    const result = await loadProjects();
    if (result.success && result.projects) {
      const project = result.projects.find(p => p.id === projectId);
      if (project && project.project_data) {
        await handleLoadProject(project.project_data, project.id, project.project_name, project.status);
      }
    }
  };

  const isProcessingImport = useRef(false);

  useEffect(() => {
    if (!initialStateSnapshot || isProcessingImport.current) return;

    const timeoutId = setTimeout(() => {
      const currentSnapshot = JSON.stringify(state);
      const hasChanges = currentSnapshot !== initialStateSnapshot;
      setUnsavedChanges('fm', hasChanges);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [state, initialStateSnapshot, setUnsavedChanges]);

  const refreshProjects = async () => {
    const result = await loadProjects();
    if (result.success && result.projects) {
      setProjects(result.projects);
    }
  };

  const loadGlobalLabor = async (forceReload: boolean = false) => {
    if (!currentOrganization || (globalLaborLoaded && !forceReload)) return;

    try {
      const orgTechnicians = await loadFMTechnicians(currentOrganization.id);

      if (orgTechnicians.length > 0) {
        setState((prev) => {
          const existingProjectTechs = prev.technicianLibrary || [];
          const existingTechMap = new Map(existingProjectTechs.map(t => [t.id, t]));

          const technicianLibrary: TechnicianType[] = orgTechnicians.map((tech) => {
            const existingTech = existingTechMap.get(tech.id);
            return {
              id: tech.id,
              name: tech.name,
              skillTags: tech.skill_tags || [],
              monthlySalary: tech.monthly_salary,
              additionalCost: tech.additional_cost,
              hourlyRate: tech.hourly_rate,
              expectedOvertimeHoursPerMonth: tech.expected_overtime_hours_per_month,
              inputBaseCount: existingTech?.inputBaseCount ?? tech.input_base_count ?? 0,
              notes: existingTech?.notes ?? tech.notes ?? '',
              canSupervise: tech.can_supervise ?? false,
            };
          });

          const orgTechIds = new Set(technicianLibrary.map(t => t.id));
          const projectOnlyTechs = existingProjectTechs.filter(t => !orgTechIds.has(t.id));

          const mergedTechnicianLibrary = [...technicianLibrary, ...projectOnlyTechs];

          return {
            ...prev,
            technicianLibrary: mergedTechnicianLibrary,
          };
        });
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

  const handleReset = async () => {
    if (!checkUnsavedBeforeNavigation('dashboard')) {
      return;
    }
    if (confirm('Are you sure you want to reset all inputs to defaults?')) {
      const defaultState = getDefaultFMState();
      defaultState.technicianLibrary = [];
      setState(defaultState);
      setCurrentProjectId(null);
      setCurrentProjectName('Untitled Project');
      setCurrentProjectStatus('DRAFT');
      setGlobalLaborLoaded(false);
      setInitialStateSnapshot(JSON.stringify(defaultState));
      setUnsavedChanges('fm', false);
      await loadGlobalLabor();
    }
  };

  const handleRecalculate = () => {
    setState({ ...state });
    alert('Project recalculated successfully based on current data!');
  };

  const handleNewProject = async () => {
    if (isModuleReadOnly) {
      alert('You have view-only access to this module. Contact your administrator to request edit permissions.');
      return;
    }

    if (!checkUnsavedBeforeNavigation('dashboard')) {
      return;
    }
    if (confirm('Create a new project?')) {
      const defaultState = getDefaultFMState();
      defaultState.technicianLibrary = [];
      setState(defaultState);
      setCurrentProjectId(null);
      setCurrentProjectName('Untitled Project');
      setCurrentProjectStatus('DRAFT');
      setIsReadOnly(false);
      setGlobalLaborLoaded(false);
      setInitialStateSnapshot(JSON.stringify(defaultState));
      setUnsavedChanges('fm', false);
      await loadGlobalLabor();
    }
  };

  const handleSave = async () => {
    const projectNameToSave = state.projectInfo?.projectName?.trim() || '';

    if (!projectNameToSave) {
      alert('Please enter a project name in the Project Information section');
      return;
    }

    setSaveLoading(true);
    let result;

    if (currentProjectId) {
      result = await updateProject(currentProjectId, projectNameToSave, state);
    } else {
      result = await saveProject(projectNameToSave, state);
      if (result.success && result.projectId) {
        setCurrentProjectId(result.projectId);
      }
    }

    if (result.success) {
      alert(currentProjectId ? 'Project updated successfully!' : 'Project saved successfully!');
      setCurrentProjectName(projectNameToSave);
      setInitialStateSnapshot(JSON.stringify(state));
      setUnsavedChanges('fm', false);
      await refreshProjects();

      if (convertingInquiryId && result.projectId) {
        try {
          await markInquiryAsConverted(convertingInquiryId, result.projectId, 'fm');
          if (onInquiryConverted) {
            onInquiryConverted();
          }
        } catch (error) {
          console.error('Error marking inquiry as converted:', error);
        }
      }
    } else {
      alert(`Failed to save project: ${result.error}`);
    }
    setSaveLoading(false);
  };

  const handleLoadProject = async (loadedState: FMEstimatorState, projectId: string | null, projectName: string, projectStatus?: ProjectStatus) => {
    try {
      if (!checkUnsavedBeforeNavigation('dashboard')) {
        return;
      }

      const status = projectStatus || 'DRAFT';
      setState(loadedState);
      setCurrentProjectId(projectId);
      setCurrentProjectName(projectName);
      setCurrentProjectStatus(status);
      setShowLoadModal(false);

      // Always load in readonly mode - user must click Edit to make changes
      setIsReadOnly(true);

      setInitialStateSnapshot(JSON.stringify(loadedState));
      setUnsavedChanges('fm', false);
    } catch (error) {
      console.error('Error loading project:', error);
      alert('Failed to load project. The project data may be corrupted. Please try another project or create a new one.');
    }
  };

  const handleEdit = async () => {
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
      await loadGlobalLabor(true);
    }
  };

  const handleOpenLoad = async () => {
    await refreshProjects();
    setShowLoadModal(true);
  };

  const handleOpenCompare = async () => {
    await refreshProjects();
    setShowComparison(true);
  };

  const handleExcelExport = async () => {
    try {
      await exportFMToExcel(state);
    } catch (error) {
      console.error('Excel export failed:', error);
      alert('Failed to export to Excel. Please try again.');
    }
  };

  const handlePDFExport = () => {
    try {
      exportFMToPDF(state);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Failed to export to PDF. Please try again.');
    }
  };

  const handleDuplicate = async () => {
    const baseName = state.projectInfo?.projectName?.trim() || 'Untitled Project';
    const newName = prompt(`Enter name for duplicated project:`, `${baseName} (Copy)`);

    if (!newName || !newName.trim()) {
      return;
    }

    setSaveLoading(true);
    try {
      if (!state || Object.keys(state).length === 0) {
        alert('No project data to duplicate. Please create or load a project first.');
        return;
      }

      const duplicatedState = {
        ...state,
        projectInfo: {
          ...state.projectInfo,
          projectName: newName.trim(),
        },
      };

      const result = await saveProject(newName.trim(), duplicatedState);

      if (result.success) {
        alert(`Project duplicated successfully as "${newName.trim()}"!`);
        await refreshProjects();
      } else {
        alert(result.error || 'Failed to duplicate project');
      }
    } catch (error) {
      console.error('Error duplicating project:', error);
      alert('Failed to duplicate project. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <>
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">FM MEP Estimator – Hard Services</h1>
            <p className="text-blue-100">In-house MEP + Specialized/Subcontract Services</p>
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
            disabled={saveLoading || isReadOnly}
            className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 hover:scale-105 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            title={saveLoading ? 'Saving...' : currentProjectId ? 'Update Project' : 'Save Project'}
            aria-label={saveLoading ? 'Saving...' : currentProjectId ? 'Update Project' : 'Save Project'}
          >
            <Save size={20} />
          </button>
        )}
        {!isModuleReadOnly && (
          <button
            onClick={handleDuplicate}
            disabled={saveLoading}
            className="p-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 hover:scale-105 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            title="Duplicate Project"
            aria-label="Duplicate Project"
          >
            <Copy size={20} />
          </button>
        )}
        <button
          onClick={handleOpenLoad}
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
            projectType="fm"
            onSubmitted={() => {
              refreshProjects();
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
          onClick={handleOpenCompare}
          className="p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 hover:scale-105 transition-all shadow-sm hover:shadow-md"
          title="Compare Projects"
          aria-label="Compare Projects"
        >
          <GitCompare size={20} />
        </button>

        <div className="w-px h-8 bg-gray-300 mx-1"></div>

        <button
          onClick={handleExcelExport}
          className="p-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 hover:scale-105 transition-all shadow-sm hover:shadow-md"
          title="Export Excel"
          aria-label="Export Excel"
        >
          <FileSpreadsheet size={20} />
        </button>
        <button
          onClick={handlePDFExport}
          className="p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 hover:scale-105 transition-all shadow-sm hover:shadow-md"
          title="Export PDF"
          aria-label="Export PDF"
        >
          <FileText size={20} />
        </button>

        <div className="w-px h-8 bg-gray-300 mx-1"></div>

        {!isModuleReadOnly && (
          <button
            onClick={handleReset}
            className="p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 hover:scale-105 transition-all shadow-sm hover:shadow-md"
            title="Reset to Default"
            aria-label="Reset to Default"
          >
            <RotateCcw size={20} />
          </button>
        )}
        <button
          onClick={handleRecalculate}
          className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:scale-105 transition-all shadow-sm hover:shadow-md"
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

      <div className="space-y-6 pb-24 lg:pb-6">
        <div className={(isReadOnly || isModuleReadOnly) ? 'pointer-events-none' : ''}>
          <ProjectInfo
            projectInfo={state.projectInfo}
            onChange={(projectInfo) => setState(prev => ({ ...prev, projectInfo }))}
          />

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <GlobalAssumptions
              assumptions={state.globalAssumptions}
              onChange={(globalAssumptions) => setState(prev => ({ ...prev, globalAssumptions }))}
            />
          </div>

          {state.globalAssumptions.contractMode === 'input_base' && (
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <DeployedTechnicians
                deployedTechnicians={state.deployedTechnicians}
                technicianLibrary={state.technicianLibrary}
                currency={currentOrganization?.currency || 'AED'}
                onChange={(deployedTechnicians) => setState(prev => ({ ...prev, deployedTechnicians }))}
              />
            </div>
          )}

          {(state.globalAssumptions.contractMode === 'output_base' ||
            (state.globalAssumptions.contractMode === 'input_base' && state.globalAssumptions.useAssetLibrary)) && (
            <>
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <AssetLibrary
                  assets={state.assetTypes}
                  technicians={state.technicianLibrary}
                  useIndustryStandard={state.globalAssumptions.useIndustryStandard}
                  currency={currentOrganization?.currency || 'AED'}
                  onChange={handleAssetTypesChange}
                  inventory={state.assetInventory}
                  onInventoryChange={(assetInventory) => setState(prev => ({ ...prev, assetInventory }))}
                />
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <AssetInventory
                  inventory={state.assetInventory}
                  assetTypes={state.assetTypes}
                  onChange={(assetInventory) => setState(prev => ({ ...prev, assetInventory }))}
                  specializedServices={state.specializedServices}
                  onCreateSpecializedService={handleCreateSpecializedService}
                  readOnly={isReadOnly}
                />
              </div>
            </>
          )}

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <MaterialsCatalog
              materials={state.materialsCatalog}
              onChange={(materialsCatalog) => setState(prev => ({ ...prev, materialsCatalog }))}
            />
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <ConsumablesCatalog
              consumables={state.consumablesCatalog}
              onChange={(consumablesCatalog) => setState(prev => ({ ...prev, consumablesCatalog }))}
            />
          </div>

          <div ref={specializedServicesRef} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <SpecializedServices
              services={state.specializedServices}
              onChange={(specializedServices) => setState(prev => ({ ...prev, specializedServices }))}
              assetTypes={state.assetTypes}
              inventory={state.assetInventory}
              readOnly={isReadOnly}
            />
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <SupervisoryConfig
              config={state.supervisory}
              technicians={state.technicianLibrary}
              onChange={(supervisory) => setState(prev => ({ ...prev, supervisory }))}
            />
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <ContractModelConfig
              config={state.contractModel}
              onChange={(contractModel) => setState(prev => ({ ...prev, contractModel }))}
            />
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <CostConfigFM
              config={state.costConfig}
              onChange={(costConfig) => setState(prev => ({ ...prev, costConfig }))}
            />
          </div>
        </div>
      </div>

      <FloatingSummary results={results} isSidebarCollapsed={isSidebarCollapsed} />

      {showLoadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Load Project</h2>
              <button onClick={() => setShowLoadModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-150px)]">
              {projects.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No saved projects yet. Save your first project to get started!
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-4 border-2 rounded-lg border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{project.project_name}</h3>
                        <div className="flex gap-4 text-sm text-gray-500 mt-1">
                          {project.project_data.projectInfo?.projectLocation && (
                            <span>{project.project_data.projectInfo.projectLocation}</span>
                          )}
                          {project.project_data.projectInfo?.projectType && (
                            <span>{project.project_data.projectInfo.projectType}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Updated: {new Date(project.updated_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleLoadProject(project.project_data, project.id, project.project_name, project.status)}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          Load
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm(`Delete project "${project.project_name}"? This cannot be undone.`)) {
                              const result = await deleteProject(project.id);
                              if (result.success) {
                                alert('Project deleted successfully!');

                                try {
                                  await clearInquiryConversion(project.id);
                                } catch (error) {
                                  console.error('Error clearing inquiry conversion:', error);
                                }

                                await refreshProjects();
                                if (currentProjectId === project.id) {
                                  const defaultState = getDefaultFMState();
                                  defaultState.technicianLibrary = [];
                                  setState(defaultState);
                                  setCurrentProjectId(null);
                                  setCurrentProjectName('Untitled Project');
                                  setCurrentProjectStatus('DRAFT');
                                  setGlobalLaborLoaded(false);
                                  await loadGlobalLabor();
                                }
                              } else {
                                alert(`Failed to delete project: ${result.error}`);
                              }
                            }
                          }}
                          className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showComparison && (
        <ProjectComparison projects={projects} onClose={() => setShowComparison(false)} />
      )}
    </>
  );
}
