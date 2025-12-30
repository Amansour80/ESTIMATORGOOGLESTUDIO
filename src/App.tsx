import { useState, useEffect } from 'react';
import { FileSpreadsheet, FileText, RotateCcw, Save, FolderOpen, Plus, Trash2, X, CreditCard as Edit, RefreshCw, Search } from 'lucide-react';
import ProjectInfo from './components/ProjectInfo';
import SiteConfig from './components/SiteConfig';
import ProductivityConfig from './components/ProductivityConfig';
import AreasTable from './components/AreasTable';
import CostsConfig from './components/CostsConfig';
import MachinesList from './components/MachinesList';
import HKSummary from './components/HKSummary';
import { getDefaultState } from './utils/defaults';
import { exportToExcel } from './utils/exportExcel';
import { exportToPDF } from './utils/exportPDF';
import { saveHKProject, updateHKProject, listHKProjects, deleteHKProject, SavedHKProject } from './utils/hkDatabase';
import type { EstimatorState } from './types';
import type { ProjectStatus } from './types/projectStatus';
import { usePermissions } from './hooks/usePermissions';
import FMEstimator from './pages/FMEstimator';
import { RetrofitEstimator } from './pages/RetrofitEstimator';
import RetrofitPM from './pages/RetrofitPM';
import RetrofitPMWorkspace from './pages/RetrofitPMWorkspace';
import Settings from './pages/Settings';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import UserProfile from './pages/UserProfile';
import { Inquiries } from './pages/Inquiries';
import Approvals from './pages/Approvals';
import Notifications from './pages/Notifications';
import AssetLibraryManager from './pages/AssetLibraryManager';
import LaborLibraryManager from './pages/LaborLibraryManager';
import Sidebar from './components/Sidebar';
import ApprovalSubmitButton from './components/ApprovalSubmitButton';
import NotificationBell from './components/NotificationBell';
import GlobalSearch from './components/GlobalSearch';
import type { User } from '@supabase/supabase-js';
import { markInquiryAsConverted, clearInquiryConversion } from './utils/inquiryDatabase';
import { UnsavedChangesProvider, useUnsavedChanges } from './contexts/UnsavedChangesContext';
import type { Inquiry } from './types/inquiry';
import { UpgradePromptBanner } from './components/UpgradePromptBanner';

type TabType = 'home' | 'dashboard' | 'hk' | 'fm' | 'retrofit' | 'retrofit-pm' | 'inquiries' | 'approvals' | 'notifications' | 'asset-library' | 'labor-library' | 'settings' | 'profile';

interface AppProps {
  user: User;
  onLogout: () => Promise<void>;
}

function AppContent({ user, onLogout }: AppProps) {
  const { setUnsavedChanges, checkUnsavedBeforeNavigation } = useUnsavedChanges();
  const { canEditProjectWithStatus } = usePermissions();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [state, setState] = useState<EstimatorState>(getDefaultState());
  const [hkProjects, setHKProjects] = useState<SavedHKProject[]>([]);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentProjectName, setCurrentProjectName] = useState('Untitled Project');
  const [currentProjectStatus, setCurrentProjectStatus] = useState<ProjectStatus>('DRAFT');
  const [saveLoading, setSaveLoading] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [initialStateSnapshot, setInitialStateSnapshot] = useState<string>('');
  const [fmProjectIdToLoad, setFmProjectIdToLoad] = useState<string | undefined>(undefined);
  const [retrofitProjectIdToLoad, setRetrofitProjectIdToLoad] = useState<string | undefined>(undefined);
  const [inquiryDataForConversion, setInquiryDataForConversion] = useState<Inquiry | null>(null);
  const [convertingInquiryId, setConvertingInquiryId] = useState<string | null>(null);
  const [retrofitPMProjectId, setRetrofitPMProjectId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    if (activeTab === 'hk') {
      refreshHKProjects();
      if (!initialStateSnapshot) {
        setInitialStateSnapshot(JSON.stringify(state));
      }
      if (inquiryDataForConversion && inquiryDataForConversion.project_type === 'hk') {
        setState(prev => ({
          ...prev,
          projectInfo: {
            ...prev.projectInfo,
            clientName: inquiryDataForConversion.client_name,
            projectName: inquiryDataForConversion.project_name,
            projectLocation: inquiryDataForConversion.project_location || prev.projectInfo.projectLocation,
            projectType: prev.projectInfo.projectType
          }
        }));
        setCurrentProjectName(inquiryDataForConversion.project_name);
        setInquiryDataForConversion(null);
      }
    }
    if (activeTab === 'fm' && fmProjectIdToLoad) {
      setTimeout(() => setFmProjectIdToLoad(undefined), 100);
    }
    if (activeTab === 'retrofit' && retrofitProjectIdToLoad) {
      setTimeout(() => setRetrofitProjectIdToLoad(undefined), 100);
    }
  }, [activeTab]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/retrofit-pm/')) {
        const projectId = hash.replace('#/retrofit-pm/', '');
        setRetrofitPMProjectId(projectId);
        setActiveTab('retrofit-pm');
      } else if (hash === '#/retrofit-pm') {
        setRetrofitPMProjectId(null);
        setActiveTab('retrofit-pm');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (initialStateSnapshot && activeTab === 'hk') {
      const currentSnapshot = JSON.stringify(state);
      const hasChanges = currentSnapshot !== initialStateSnapshot;
      setUnsavedChanges('hk', hasChanges);
    }
  }, [state, initialStateSnapshot, activeTab, setUnsavedChanges]);

  const refreshHKProjects = async () => {
    const projects = await listHKProjects();
    setHKProjects(projects);
  };

  const handleNavigateToProject = async (tab: 'hk' | 'fm' | 'retrofit', projectId?: string) => {
    console.log('handleNavigateToProject called:', { tab, projectId });

    if (!checkUnsavedBeforeNavigation(tab)) {
      console.log('Navigation blocked by unsaved changes check');
      return;
    }

    if (projectId) {
      if (tab === 'hk') {
        console.log('Loading HK project:', projectId);
        const projects = await listHKProjects();
        const project = projects.find(p => p.id === projectId);
        if (project) {
          const status = project.status || 'DRAFT';
          setState(project.project_data);
          setCurrentProjectId(project.id);
          setCurrentProjectName(project.project_name);
          setCurrentProjectStatus(status);

          // Always load in readonly mode - user must click Edit to make changes
          setIsReadOnly(true);

          setInitialStateSnapshot(JSON.stringify(project.project_data));
          setUnsavedChanges('hk', false);
          console.log('HK project loaded successfully');
        } else {
          console.error('HK project not found:', projectId);
        }
      } else if (tab === 'fm') {
        console.log('Setting FM project to load:', projectId);
        setFmProjectIdToLoad(projectId);
      } else if (tab === 'retrofit') {
        console.log('Setting Retrofit project to load:', projectId);
        setRetrofitProjectIdToLoad(projectId);
      }
    }

    console.log('Setting active tab to:', tab);
    setActiveTab(tab);
  };

  const handleRecalculate = () => {
    setState({ ...state });
    alert('Project recalculated successfully based on current data!');
  };

  const handleReset = () => {
    if (!checkUnsavedBeforeNavigation('dashboard')) {
      return;
    }
    if (confirm('Are you sure you want to reset all inputs to defaults?')) {
      const defaultState = getDefaultState();
      setState(defaultState);
      setCurrentProjectId(null);
      setCurrentProjectName('Untitled Project');
      setCurrentProjectStatus('DRAFT');
      setInitialStateSnapshot(JSON.stringify(defaultState));
      setUnsavedChanges('hk', false);
    }
  };

  const handleNewProject = () => {
    if (!checkUnsavedBeforeNavigation('dashboard')) {
      return;
    }
    if (confirm('Create a new project?')) {
      const defaultState = getDefaultState();
      setState(defaultState);
      setCurrentProjectId(null);
      setCurrentProjectName('Untitled Project');
      setCurrentProjectStatus('DRAFT');
      setIsReadOnly(false);
      setInitialStateSnapshot(JSON.stringify(defaultState));
      setUnsavedChanges('hk', false);
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
      result = await updateHKProject(currentProjectId, projectNameToSave, state);
    } else {
      result = await saveHKProject(projectNameToSave, state);
      if (result.success && result.projectId) {
        setCurrentProjectId(result.projectId);
      }
    }

    if (result.success) {
      alert(currentProjectId ? 'Project updated successfully!' : 'Project saved successfully!');
      setCurrentProjectName(projectNameToSave);
      setInitialStateSnapshot(JSON.stringify(state));
      setUnsavedChanges('hk', false);
      await refreshHKProjects();

      if (convertingInquiryId) {
        try {
          const projectIdToUse = result.projectId || currentProjectId;
          if (projectIdToUse) {
            await markInquiryAsConverted(convertingInquiryId, projectIdToUse, 'hk');
            setConvertingInquiryId(null);
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

  const handleLoad = (project: SavedHKProject) => {
    if (!checkUnsavedBeforeNavigation('dashboard')) {
      return;
    }
    if (confirm(`Load project "${project.project_name}"?`)) {
      const status = project.status || 'DRAFT';
      setState(project.project_data);
      setInitialStateSnapshot(JSON.stringify(project.project_data));
      setUnsavedChanges('hk', false);
      setCurrentProjectId(project.id);
      setCurrentProjectName(project.project_name);
      setCurrentProjectStatus(status);
      setShowLoadModal(false);

      // Always load in readonly mode - user must click Edit to make changes
      setIsReadOnly(true);
    }
  };

  const handleEdit = () => {
    if (!canEditProjectWithStatus(currentProjectStatus)) {
      alert('You do not have permission to edit this project. Only admins can edit projects that are not in DRAFT status.');
      return;
    }

    if (confirm('Enable editing? You can modify project data after confirming.')) {
      setIsReadOnly(false);
    }
  };

  const handleDelete = async (projectId: string, projectName: string) => {
    if (confirm(`Delete project "${projectName}"? This cannot be undone.`)) {
      const result = await deleteHKProject(projectId);
      if (result.success) {
        alert('Project deleted successfully!');

        try {
          await clearInquiryConversion(projectId);
        } catch (error) {
          console.error('Error clearing inquiry conversion:', error);
        }

        await refreshHKProjects();
        if (currentProjectId === projectId) {
          setState(getDefaultState());
          setCurrentProjectId(null);
          setCurrentProjectName('Untitled Project');
          setCurrentProjectStatus('DRAFT');
        }
      } else {
        alert(`Failed to delete project: ${result.error}`);
      }
    }
  };

  const handleOpenLoad = async () => {
    await refreshHKProjects();
    setShowLoadModal(true);
  };

  const handleExcelExport = async () => {
    try {
      await exportToExcel(state);
    } catch (error) {
      console.error('Failed to export Excel:', error);
      alert('Failed to export Excel file. Please try again.');
    }
  };

  const handlePDFExport = () => {
    try {
      exportToPDF(state);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to export PDF file. Please try again.');
    }
  };

  const handleTabChange = (newTab: TabType) => {
    if (!checkUnsavedBeforeNavigation(newTab)) {
      return;
    }
    setActiveTab(newTab);
    if (newTab !== 'hk') {
      setUnsavedChanges(null, false);
      setInitialStateSnapshot('');
    }
  };

  const handleHomeNavigation = (tab: 'hk' | 'fm' | 'retrofit' | 'inquiries' | 'retrofit-pm' | 'dashboard', projectId?: string) => {
    if (projectId && (tab === 'hk' || tab === 'fm' || tab === 'retrofit')) {
      handleNavigateToProject(tab, projectId);
    } else {
      handleTabChange(tab as TabType);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        user={user}
        onLogout={onLogout}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <GlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(type, projectId) => {
          if (type === 'inquiries') {
            handleTabChange('inquiries');
          } else {
            handleNavigateToProject(type, projectId);
          }
        }}
      />

      <UpgradePromptBanner />

      <div className="fixed top-4 right-4 z-30 flex items-center gap-2">
        <button
          onClick={() => setIsSearchOpen(true)}
          className="relative p-3 bg-white text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 group"
          title="Search (⌘K)"
        >
          <Search className="w-6 h-6" />
          <span className="absolute -bottom-8 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            ⌘K
          </span>
        </button>
        <NotificationBell onClick={() => {
          if (checkUnsavedBeforeNavigation('notifications')) {
            setActiveTab('notifications');
          }
        }} />
      </div>

      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
        {activeTab === 'home' ? (
          <Home user={user} onNavigate={handleHomeNavigation} />
        ) : activeTab === 'dashboard' ? (
          <Dashboard user={user} onNavigate={handleNavigateToProject} />
        ) : activeTab === 'inquiries' ? (
          <div className="container mx-auto px-4 py-8">
            <Inquiries
              onConvertToEstimation={(inquiry: Inquiry) => {
                setInquiryDataForConversion(inquiry);
                setConvertingInquiryId(inquiry.id);
                if (inquiry.project_type === 'hk') setActiveTab('hk');
                else if (inquiry.project_type === 'fm') setActiveTab('fm');
                else if (inquiry.project_type === 'retrofit') setActiveTab('retrofit');
              }}
              onNavigateToProject={(projectType, projectId) => {
                handleNavigateToProject(projectType, projectId);
              }}
            />
          </div>
        ) : activeTab === 'approvals' ? (
          <Approvals onNavigateToProject={handleNavigateToProject} />
        ) : activeTab === 'notifications' ? (
          <div className="container mx-auto px-4 py-8">
            <Notifications
              onNavigate={(tab, projectId) => {
                if (tab === 'hk' || tab === 'fm' || tab === 'retrofit') {
                  handleNavigateToProject(tab, projectId);
                } else {
                  setActiveTab(tab as TabType);
                }
              }}
            />
          </div>
        ) : activeTab === 'asset-library' ? (
          <div className="container mx-auto px-4 py-8">
            <AssetLibraryManager />
          </div>
        ) : activeTab === 'labor-library' ? (
          <LaborLibraryManager isSidebarCollapsed={isSidebarCollapsed} />
        ) : activeTab === 'settings' ? (
          <Settings />
        ) : activeTab === 'profile' ? (
          <UserProfile />
        ) : activeTab === 'retrofit-pm' ? (
          retrofitPMProjectId ? (
            <RetrofitPMWorkspace projectId={retrofitPMProjectId} />
          ) : (
            <RetrofitPM />
          )
        ) : activeTab === 'retrofit' ? (
          <RetrofitEstimator
            isSidebarCollapsed={isSidebarCollapsed}
            initialProjectId={retrofitProjectIdToLoad}
            inquiryData={inquiryDataForConversion?.project_type === 'retrofit' ? inquiryDataForConversion : undefined}
            onInquiryDataUsed={() => setInquiryDataForConversion(null)}
            convertingInquiryId={convertingInquiryId}
            onInquiryConverted={() => setConvertingInquiryId(null)}
          />
        ) : activeTab === 'fm' ? (
          <FMEstimator
            isSidebarCollapsed={isSidebarCollapsed}
            initialProjectId={fmProjectIdToLoad}
            inquiryData={inquiryDataForConversion?.project_type === 'fm' ? inquiryDataForConversion : undefined}
            onInquiryDataUsed={() => setInquiryDataForConversion(null)}
            convertingInquiryId={convertingInquiryId}
            onInquiryConverted={() => setConvertingInquiryId(null)}
          />
        ) : activeTab === 'hk' ? (
          <div className="container mx-auto px-4 py-8">
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg shadow-lg p-6 mb-6">
              <h1 className="text-3xl font-bold mb-2">Housekeeping Estimator</h1>
              <p className="text-green-100">Comprehensive Manpower & Pricing Calculator</p>
            </div>

            <div className="flex gap-2 mb-6 flex-wrap items-center">
              <button
                onClick={handleNewProject}
                className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:scale-105 transition-all shadow-sm hover:shadow-md"
                title="New Project"
                aria-label="New Project"
              >
                <Plus size={20} />
              </button>
              <button
                onClick={handleSave}
                disabled={saveLoading || isReadOnly}
                className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 hover:scale-105 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                title={saveLoading ? 'Saving...' : currentProjectId ? 'Update Project' : 'Save Project'}
                aria-label={saveLoading ? 'Saving...' : currentProjectId ? 'Update Project' : 'Save Project'}
              >
                <Save size={20} />
              </button>
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
                  projectType="hk"
                  onSubmitted={() => {
                    refreshHKProjects();
                  }}
                />
              )}
              {isReadOnly && (
                <button
                  onClick={handleEdit}
                  className="p-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 hover:scale-105 transition-all shadow-sm hover:shadow-md"
                  title="Edit Project"
                  aria-label="Edit Project"
                >
                  <Edit size={20} />
                </button>
              )}

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

              <button
                onClick={handleReset}
                className="p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 hover:scale-105 transition-all shadow-sm hover:shadow-md"
                title="Reset to Default"
                aria-label="Reset to Default"
              >
                <RotateCcw size={20} />
              </button>
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

        <div className="space-y-6">
          <fieldset disabled={isReadOnly}>
              <ProjectInfo
                projectInfo={state.projectInfo}
                onChange={(projectInfo) => setState({ ...state, projectInfo })}
              />

              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <SiteConfig
                  site={state.site}
                  onChange={(site) => setState({ ...state, site })}
                />
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <ProductivityConfig
                  productivity={state.productivity}
                  onChange={(productivity) => setState({ ...state, productivity })}
                />
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <MachinesList
                  machines={state.machines}
                  onChange={(machines) => setState({ ...state, machines })}
                />
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <AreasTable
                  areas={state.areas}
                  machines={state.machines}
                  onChange={(areas) => setState({ ...state, areas })}
                />
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <CostsConfig costs={state.costs} onChange={(costs) => setState({ ...state, costs})} />
              </div>
            </fieldset>
        </div>

        <HKSummary state={state} isSidebarCollapsed={isSidebarCollapsed} />

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
                    {hkProjects.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No saved projects yet. Save your first project to get started!
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {hkProjects.map((project) => (
                          <div
                            key={project.id}
                            className="flex items-center justify-between p-4 border-2 rounded-lg border-gray-200 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-800">{project.project_name}</h3>
                              <div className="flex gap-4 text-sm text-gray-500 mt-1">
                                {project.project_data.projectInfo?.projectName && (
                                  <span>{project.project_data.projectInfo.projectName}</span>
                                )}
                                {project.project_data.projectInfo?.clientName && (
                                  <span>{project.project_data.projectInfo.clientName}</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 mt-1">
                                Updated: {new Date(project.updated_at).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleLoad(project)}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                              >
                                Load
                              </button>
                              <button
                                onClick={() => handleDelete(project.id, project.project_name)}
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
          </div>
        ) : (
          <div className="container mx-auto px-4 py-8">
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    Invalid page. Please use the navigation to select a valid page.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function App({ user, onLogout }: AppProps) {
  return (
    <UnsavedChangesProvider>
      <AppContent user={user} onLogout={onLogout} />
    </UnsavedChangesProvider>
  );
}

export default App;
