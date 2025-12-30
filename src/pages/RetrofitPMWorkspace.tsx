import { useState, useEffect } from 'react';
import { useOrganization } from '../contexts/OrganizationContext';
import { usePermissions } from '../hooks/usePermissions';
import { ArrowLeft, LayoutDashboard, Calendar, FileText, AlertCircle, Settings, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ViewOnlyBadge } from '../components/ViewOnlyBadge';
import ActivitiesManager from '../components/pm/ActivitiesManager';
import DocumentsManager from '../components/pm/DocumentsManager';
import IssuesManager from '../components/pm/IssuesManager';
import ProjectSettings from '../components/pm/ProjectSettings';
import { BudgetTab } from '../components/pm/BudgetTab';

interface RetrofitPMWorkspaceProps {
  projectId: string;
}

type Tab = 'overview' | 'activities' | 'budget' | 'documents' | 'issues' | 'settings';

export default function RetrofitPMWorkspace({ projectId }: RetrofitPMWorkspaceProps) {
  const { currentOrganization } = useOrganization();
  const { isModuleViewOnly } = usePermissions();
  const isModuleReadOnly = isModuleViewOnly('retrofit_pm');
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [project, setProject] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProject();
    loadActivities();

    const channel = supabase
      .channel(`project-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'retrofit_projects',
          filter: `id=eq.${projectId}`,
        },
        (payload) => {
          setProject(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_activities',
          filter: `retrofit_project_id=eq.${projectId}`,
        },
        () => {
          loadActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  async function loadProject() {
    try {
      const { data, error } = await supabase
        .from('retrofit_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error('Error loading project:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadActivities() {
    try {
      const { data, error } = await supabase
        .from('project_activities')
        .select('id, name, progress_percent, status')
        .eq('retrofit_project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  }

  const tabs = [
    { id: 'overview' as Tab, label: 'Overview', icon: LayoutDashboard },
    { id: 'activities' as Tab, label: 'Activities', icon: Calendar },
    { id: 'budget' as Tab, label: 'Budget', icon: DollarSign },
    { id: 'documents' as Tab, label: 'Documents', icon: FileText },
    { id: 'issues' as Tab, label: 'Issues', icon: AlertCircle },
    { id: 'settings' as Tab, label: 'Settings', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600">Project not found</p>
          <a href="#/retrofit-pm" className="mt-4 text-blue-600 hover:text-blue-700">
            Back to Projects
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <a
              href="#/retrofit-pm"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Projects</span>
            </a>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.project_name}</h1>
              {project.client_name && (
                <p className="text-gray-600 mt-1">{project.client_name}</p>
              )}
            </div>

            <div className="flex items-center gap-4">
              {isModuleReadOnly && <ViewOnlyBadge />}
              <span
                className={`px-4 py-2 text-sm font-medium rounded-full ${
                  project.pm_status === 'Active'
                    ? 'bg-green-100 text-green-800'
                    : project.pm_status === 'Draft'
                    ? 'bg-gray-100 text-gray-800'
                    : project.pm_status === 'On Hold'
                    ? 'bg-yellow-100 text-yellow-800'
                    : project.pm_status === 'Completed'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {project.pm_status || 'Draft'}
              </span>
            </div>
          </div>
        </div>

        <div className="px-6">
          <div className="flex gap-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-blue-600'
                      : 'text-gray-600 border-transparent hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {activeTab === 'overview' && <OverviewTab project={project} />}
        {activeTab === 'activities' && (
          <div className="p-6 max-w-7xl mx-auto">
            <ActivitiesManager projectId={projectId} organizationId={currentOrganization!.id} isReadOnly={isModuleReadOnly} />
          </div>
        )}
        {activeTab === 'budget' && (
          <div className="p-6 max-w-7xl mx-auto">
            <BudgetTab
              projectId={projectId}
              organizationId={currentOrganization!.id}
              activities={activities}
              isReadOnly={isModuleReadOnly}
            />
          </div>
        )}
        {activeTab === 'documents' && (
          <div className="p-6 max-w-7xl mx-auto">
            <DocumentsManager projectId={projectId} organizationId={currentOrganization!.id} isReadOnly={isModuleReadOnly} />
          </div>
        )}
        {activeTab === 'issues' && (
          <div className="p-6 max-w-7xl mx-auto">
            <IssuesManager projectId={projectId} organizationId={currentOrganization!.id} isReadOnly={isModuleReadOnly} />
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="p-6 max-w-7xl mx-auto">
            <ProjectSettings projectId={projectId} organizationId={currentOrganization!.id} project={project} isReadOnly={isModuleReadOnly} />
          </div>
        )}
      </div>
    </div>
  );
}

function OverviewTab({ project }: { project: any }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [project.id]);

  async function loadStats() {
    try {
      const [activitiesRes, documentsRes, issuesRes] = await Promise.all([
        supabase.from('project_activities').select('status, progress_percent').eq('retrofit_project_id', project.id),
        supabase.from('project_documents').select('workflow_status').eq('retrofit_project_id', project.id),
        supabase.from('project_issues').select('status, priority').eq('retrofit_project_id', project.id)
      ]);

      const activityStats = {
        total: activitiesRes.data?.length || 0,
        pending: activitiesRes.data?.filter(a => a.status === 'Pending').length || 0,
        inProgress: activitiesRes.data?.filter(a => a.status === 'Work in Progress').length || 0,
        readyForInspection: activitiesRes.data?.filter(a => a.status === 'Ready for Inspection').length || 0,
        closed: activitiesRes.data?.filter(a => a.status === 'Closed').length || 0
      };

      const documentStats = {
        total: documentsRes.data?.length || 0,
        draft: documentsRes.data?.filter(d => d.workflow_status === 'Draft').length || 0,
        underReview: documentsRes.data?.filter(d => d.workflow_status === 'Under Review').length || 0,
        approved: documentsRes.data?.filter(d => d.workflow_status === 'Approved').length || 0,
        rejected: documentsRes.data?.filter(d => d.workflow_status === 'Rejected').length || 0
      };

      const issueStats = {
        total: issuesRes.data?.length || 0,
        open: issuesRes.data?.filter(i => i.status === 'Open').length || 0,
        inProgress: issuesRes.data?.filter(i => i.status === 'In Progress').length || 0,
        critical: issuesRes.data?.filter(i => i.priority === 'Critical').length || 0,
        high: issuesRes.data?.filter(i => i.priority === 'High').length || 0
      };

      setStats({ activities: activityStats, documents: documentStats, issues: issueStats });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Overall Progress</h3>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {project.overall_progress || 0}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${project.overall_progress || 0}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Forecast End Date</h3>
          <div className="text-xl font-bold text-gray-900">
            {project.forecast_end_date
              ? new Date(project.forecast_end_date).toLocaleDateString()
              : 'Not set'}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Estimated Value</h3>
          <div className="text-xl font-bold text-gray-900">
            {project.calculated_value
              ? new Intl.NumberFormat('en-AE', {
                  style: 'currency',
                  currency: 'AED',
                  minimumFractionDigits: 0,
                }).format(project.calculated_value)
              : 'N/A'}
          </div>
        </div>
      </div>

      {stats && (
        <>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Activities</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.activities.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-500">{stats.activities.pending}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.activities.inProgress}</div>
                <div className="text-sm text-gray-600">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.activities.readyForInspection}</div>
                <div className="text-sm text-gray-600">Ready</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.activities.closed}</div>
                <div className="text-sm text-gray-600">Closed</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Documents</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.documents.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-500">{stats.documents.draft}</div>
                <div className="text-sm text-gray-600">Draft</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.documents.underReview}</div>
                <div className="text-sm text-gray-600">Under Review</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.documents.approved}</div>
                <div className="text-sm text-gray-600">Approved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.documents.rejected}</div>
                <div className="text-sm text-gray-600">Rejected</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Issues & RFIs</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.issues.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.issues.open}</div>
                <div className="text-sm text-gray-600">Open</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.issues.critical}</div>
                <div className="text-sm text-gray-600">Critical</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.issues.high}</div>
                <div className="text-sm text-gray-600">High Priority</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

