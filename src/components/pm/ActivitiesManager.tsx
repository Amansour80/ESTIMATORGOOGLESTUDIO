import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, Users, GitBranch, Save, X, List, BarChart3, AlertCircle, Clock, FileText, MessageSquare, Layout, Maximize2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useProjectMembers } from '../../hooks/useProjectMembers';
import { getActivityStatusColor, getActivityStatusBarColor } from '../../utils/statusColors';
import TimeTrackingSection from './TimeTrackingSection';
import CommentsSection from './CommentsSection';
import EnhancedGanttChart from './EnhancedGanttChart';
import ActivityTemplatesManager from './ActivityTemplatesManager';
import GanttChartModal from './GanttChartModal';

interface Activity {
  id: string;
  name: string;
  description: string;
  duration_days: number;
  start_date: string | null;
  end_date: string | null;
  is_date_override: boolean;
  override_warning: string | null;
  progress_percent: number;
  status: string;
  assignee_type: string | null;
  assignee_user_id: string | null;
  created_at: string;
}

interface Dependency {
  id: string;
  predecessor_activity_id: string;
  successor_activity_id: string;
  type: string;
  lag_days: number;
}

interface DependencyInput {
  predecessor_activity_id: string;
  type: string;
  lag_days: number;
}

interface ActivityFormData {
  name: string;
  description: string;
  duration_days: number;
  start_date: string;
  end_date: string;
  is_date_override: boolean;
  progress_percent: number;
  status: string;
  assignee_type: string;
  assignee_user_id: string;
  dependencies: DependencyInput[];
}

interface ActivitiesManagerProps {
  projectId: string;
  organizationId: string;
  isReadOnly?: boolean;
}


const ACTIVITY_STATUSES = [
  'Pending',
  'Work in Progress',
  'Ready for Inspection',
  'Awaiting Client Approval',
  'Inspected',
  'Closed'
];

const ASSIGNEE_TYPES = [
  { value: '', label: 'Unassigned' },
  { value: 'employee', label: 'Employee' },
  { value: 'client_rep', label: 'Client Representative' },
  { value: 'consultant', label: 'Consultant' }
];

const DEPENDENCY_TYPES = [
  { value: 'FS', label: 'Finish-to-Start', description: 'Must finish before this starts' },
  { value: 'SS', label: 'Start-to-Start', description: 'Must start before this starts' },
  { value: 'FF', label: 'Finish-to-Finish', description: 'Must finish before this finishes' },
  { value: 'SF', label: 'Start-to-Finish', description: 'Must start before this finishes' }
];

export default function ActivitiesManager({ projectId, organizationId }: ActivitiesManagerProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const { members: projectMembers } = useProjectMembers(projectId, organizationId);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingActivity, setViewingActivity] = useState<Activity | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'gantt'>('table');
  const [validationError, setValidationError] = useState<string>('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showGanttModal, setShowGanttModal] = useState(false);
  const [formData, setFormData] = useState<ActivityFormData>({
    name: '',
    description: '',
    duration_days: 1,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    is_date_override: false,
    progress_percent: 0,
    status: 'Pending',
    assignee_type: '',
    assignee_user_id: '',
    dependencies: []
  });
  const [projectStartDate, setProjectStartDate] = useState<string | null>(null);
  const [calculatedStartDate, setCalculatedStartDate] = useState<string>('');

  useEffect(() => {
    loadActivities();
    loadDependencies();
    loadProjectStartDate();

    const activitiesChannel = supabase
      .channel(`activities-${projectId}`)
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

    const dependenciesChannel = supabase
      .channel(`dependencies-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_dependencies',
          filter: `retrofit_project_id=eq.${projectId}`,
        },
        () => {
          loadDependencies();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(activitiesChannel);
      supabase.removeChannel(dependenciesChannel);
    };
  }, [projectId]);

  useEffect(() => {
    if (showForm && !editingId) {
      calculateStartDate();
    }
  }, [formData.dependencies, formData.duration_days, projectStartDate]);

  useEffect(() => {
    if (formData.start_date && formData.duration_days > 0) {
      const start = new Date(formData.start_date);
      start.setDate(start.getDate() + formData.duration_days);
      setFormData(prev => ({ ...prev, end_date: start.toISOString().split('T')[0] }));
    }
  }, [formData.start_date, formData.duration_days]);

  useEffect(() => {
    if (showForm) {
      validateDependencies();
    }
  }, [formData.start_date, formData.end_date, formData.dependencies]);

  async function loadActivities() {
    try {
      const { data, error } = await supabase
        .from('project_activities')
        .select('*')
        .eq('retrofit_project_id', projectId)
        .order('start_date', { ascending: true });

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadDependencies() {
    try {
      const { data, error } = await supabase
        .from('activity_dependencies')
        .select('*')
        .eq('retrofit_project_id', projectId);

      if (error) throw error;
      setDependencies(data || []);
    } catch (error) {
      console.error('Error loading dependencies:', error);
    }
  }

  async function loadProjectStartDate() {
    try {
      const { data, error } = await supabase
        .from('retrofit_projects')
        .select('planned_start_date')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      setProjectStartDate(data?.planned_start_date || new Date().toISOString().split('T')[0]);
    } catch (error) {
      console.error('Error loading project start date:', error);
      setProjectStartDate(new Date().toISOString().split('T')[0]);
    }
  }

  function calculateStartDate() {
    if (!projectStartDate) return;

    let latestDate = new Date(projectStartDate);

    for (const dep of formData.dependencies) {
      const predecessor = activities.find(a => a.id === dep.predecessor_activity_id);
      if (!predecessor || !predecessor.end_date || !predecessor.start_date) continue;

      const lagDays = dep.lag_days || 0;

      switch (dep.type) {
        case 'FS':
          const fsDate = new Date(predecessor.end_date);
          fsDate.setDate(fsDate.getDate() + lagDays + 1);
          if (fsDate > latestDate) latestDate = fsDate;
          break;
        case 'SS':
          const ssDate = new Date(predecessor.start_date);
          ssDate.setDate(ssDate.getDate() + lagDays);
          if (ssDate > latestDate) latestDate = ssDate;
          break;
      }
    }

    const calculatedDate = latestDate.toISOString().split('T')[0];
    setCalculatedStartDate(calculatedDate);

    if (!formData.is_date_override) {
      setFormData(prev => ({ ...prev, start_date: calculatedDate }));
    }
  }


  function openAddForm() {
    setEditingId(null);
    setValidationError('');
    const startDate = projectStartDate || new Date().toISOString().split('T')[0];
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    setFormData({
      name: '',
      description: '',
      duration_days: 1,
      start_date: startDate,
      end_date: endDate.toISOString().split('T')[0],
      is_date_override: false,
      progress_percent: 0,
      status: 'Pending',
      assignee_type: '',
      assignee_user_id: '',
      dependencies: []
    });
    setCalculatedStartDate(startDate);
    setShowForm(true);
  }

  function openEditForm(activity: Activity) {
    setEditingId(activity.id);
    setValidationError('');

    const activityDeps = dependencies
      .filter(d => d.successor_activity_id === activity.id)
      .map(d => ({
        predecessor_activity_id: d.predecessor_activity_id,
        type: d.type,
        lag_days: d.lag_days ?? 0
      }));

    setFormData({
      name: activity.name,
      description: activity.description || '',
      duration_days: activity.duration_days,
      start_date: activity.start_date || projectStartDate || new Date().toISOString().split('T')[0],
      end_date: activity.end_date || new Date().toISOString().split('T')[0],
      is_date_override: activity.is_date_override,
      progress_percent: activity.progress_percent,
      status: activity.status,
      assignee_type: activity.assignee_type || '',
      assignee_user_id: activity.assignee_user_id || '',
      dependencies: activityDeps
    });
    setCalculatedStartDate(activity.start_date || '');
    setShowForm(true);
  }

  function validateDependencies(): boolean {
    if (formData.dependencies.length === 0) {
      setValidationError('');
      return true;
    }

    const activityStart = new Date(formData.start_date);
    const activityEnd = new Date(formData.end_date);

    for (const dep of formData.dependencies) {
      const predecessor = activities.find(a => a.id === dep.predecessor_activity_id);
      if (!predecessor) continue;

      const lagDays = dep.lag_days ?? 0;
      const predStart = new Date(predecessor.start_date);
      const predEnd = new Date(predecessor.end_date);

      let errorMsg = '';
      let requiredDate: Date;

      switch (dep.type) {
        case 'FS': // Finish-to-Start: Successor can't start until predecessor finishes + lag
          requiredDate = new Date(predEnd);
          requiredDate.setDate(requiredDate.getDate() + lagDays + 1); // +1 because it finishes on that day
          if (activityStart < requiredDate) {
            const lagText = lagDays !== 0 ? ` + ${lagDays} day(s) lag` : '';
            errorMsg = `Cannot start before "${predecessor.name}" finishes${lagText} (earliest: ${requiredDate.toLocaleDateString()})`;
          }
          break;
        case 'SS': // Start-to-Start: Successor can't start until predecessor starts + lag
          requiredDate = new Date(predStart);
          requiredDate.setDate(requiredDate.getDate() + lagDays);
          if (activityStart < requiredDate) {
            const lagText = lagDays !== 0 ? ` + ${lagDays} day(s) lag` : '';
            errorMsg = `Cannot start before "${predecessor.name}" starts${lagText} (earliest: ${requiredDate.toLocaleDateString()})`;
          }
          break;
        case 'FF': // Finish-to-Finish: Successor can't finish until predecessor finishes + lag
          requiredDate = new Date(predEnd);
          requiredDate.setDate(requiredDate.getDate() + lagDays);
          if (activityEnd < requiredDate) {
            const lagText = lagDays !== 0 ? ` + ${lagDays} day(s) lag` : '';
            errorMsg = `Cannot finish before "${predecessor.name}" finishes${lagText} (earliest: ${requiredDate.toLocaleDateString()})`;
          }
          break;
        case 'SF': // Start-to-Finish: Successor can't finish until predecessor starts + lag
          requiredDate = new Date(predStart);
          requiredDate.setDate(requiredDate.getDate() + lagDays);
          if (activityEnd < requiredDate) {
            const lagText = lagDays !== 0 ? ` + ${lagDays} day(s) lag` : '';
            errorMsg = `Cannot finish before "${predecessor.name}" starts${lagText} (earliest: ${requiredDate.toLocaleDateString()})`;
          }
          break;
      }

      if (errorMsg) {
        setValidationError(errorMsg);
        return false;
      }
    }

    setValidationError('');
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateDependencies()) {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (editingId) {
        const updateData = {
          name: formData.name,
          description: formData.description,
          duration_days: formData.duration_days,
          start_date: formData.start_date,
          is_date_override: formData.is_date_override,
          progress_percent: formData.progress_percent,
          status: formData.status,
          assignee_type: formData.assignee_type || null,
          assignee_user_id: formData.assignee_user_id || null
        };

        const { error } = await supabase
          .from('project_activities')
          .update(updateData)
          .eq('id', editingId);

        if (error) throw error;

        await updateDependencies(editingId);
      } else {
        const insertData = {
          name: formData.name,
          description: formData.description,
          duration_days: formData.duration_days,
          start_date: formData.start_date,
          is_date_override: formData.is_date_override,
          progress_percent: formData.progress_percent,
          status: formData.status,
          assignee_type: formData.assignee_type || null,
          assignee_user_id: formData.assignee_user_id || null,
          retrofit_project_id: projectId,
          organization_id: organizationId,
          created_by: user.id
        };

        const { data, error } = await supabase
          .from('project_activities')
          .insert([insertData])
          .select()
          .single();

        if (error) throw error;

        if (data && formData.dependencies.length > 0) {
          await updateDependencies(data.id);
        }
      }

      setShowForm(false);
      loadActivities();
      loadDependencies();
    } catch (error: any) {
      console.error('Error saving activity:', error);
      alert(`Failed to save activity: ${error.message || 'Please try again.'}`);
    }
  }

  async function updateDependencies(activityId: string) {
    const existingDeps = dependencies.filter(d => d.successor_activity_id === activityId);

    const toRemove = existingDeps.filter(existing =>
      !formData.dependencies.some(
        dep => dep.predecessor_activity_id === existing.predecessor_activity_id &&
               dep.type === existing.type &&
               (dep.lag_days ?? 0) === (existing.lag_days ?? 0)
      )
    );

    const toAdd = formData.dependencies.filter(dep =>
      !existingDeps.some(
        existing => existing.predecessor_activity_id === dep.predecessor_activity_id &&
                   existing.type === dep.type &&
                   (existing.lag_days ?? 0) === (dep.lag_days ?? 0)
      )
    );

    if (toRemove.length > 0) {
      const { error } = await supabase
        .from('activity_dependencies')
        .delete()
        .in('id', toRemove.map(d => d.id));

      if (error) throw error;
    }

    if (toAdd.length > 0) {
      const newDeps = toAdd.map(dep => ({
        organization_id: organizationId,
        retrofit_project_id: projectId,
        predecessor_activity_id: dep.predecessor_activity_id,
        successor_activity_id: activityId,
        type: dep.type,
        lag_days: dep.lag_days ?? 0
      }));

      const { error } = await supabase
        .from('activity_dependencies')
        .insert(newDeps);

      if (error) throw error;
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this activity?')) return;

    try {
      const { error } = await supabase
        .from('project_activities')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadActivities();
      loadDependencies();
    } catch (error) {
      console.error('Error deleting activity:', error);
      alert('Failed to delete activity. Please try again.');
    }
  }

  async function handleApplyTemplate(templateId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: member, error: memberError } = await supabase
        .from('project_members')
        .select('role')
        .eq('retrofit_project_id', projectId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (memberError) {
        console.error('Error checking membership:', memberError);
        throw new Error('Failed to verify project membership');
      }

      if (!member) {
        throw new Error('You must be added as a project member before applying templates. Please check the Settings tab to add yourself as a member, or make sure the project is approved.');
      }

      const { data: templateItems, error: itemsError } = await supabase
        .from('activity_template_items')
        .select('*')
        .eq('template_id', templateId)
        .order('sequence_order', { ascending: true });

      if (itemsError) throw itemsError;
      if (!templateItems || templateItems.length === 0) {
        alert('This template has no activities to import');
        return;
      }

      const today = new Date();
      const activityIdMap = new Map();

      for (const item of templateItems) {
        const startDate = new Date(projectStartDate || today);

        const { data: newActivity, error: activityError } = await supabase
          .from('project_activities')
          .insert([{
            retrofit_project_id: projectId,
            organization_id: organizationId,
            name: item.name,
            description: item.description,
            duration_days: item.duration_days,
            start_date: startDate.toISOString().split('T')[0],
            progress_percent: 0,
            status: 'Pending',
            assignee_type: item.assignee_type,
            created_by: user.id
          }])
          .select()
          .single();

        if (activityError) {
          console.error('Error creating activity:', activityError);
          throw new Error(`Failed to create activity "${item.name}": ${activityError.message}`);
        }
        activityIdMap.set(item.sequence_order, newActivity.id);
      }

      for (const item of templateItems) {
        if (item.depends_on_sequence && item.dependency_type) {
          const predecessorId = activityIdMap.get(item.depends_on_sequence);
          const successorId = activityIdMap.get(item.sequence_order);

          if (predecessorId && successorId) {
            const { error: depError } = await supabase
              .from('activity_dependencies')
              .insert([{
                retrofit_project_id: projectId,
                organization_id: organizationId,
                predecessor_activity_id: predecessorId,
                successor_activity_id: successorId,
                type: item.dependency_type
              }]);

            if (depError) {
              console.error('Error creating dependency:', depError);
            }
          }
        }
      }

      setShowTemplates(false);
      loadActivities();
      loadDependencies();
      alert(`Successfully imported ${templateItems.length} activities from template`);
    } catch (error: any) {
      console.error('Error applying template:', error);
      alert(`Failed to apply template: ${error.message || 'Please try again.'}`);
    }
  }

  function getDependencyNames(activityId: string): string {
    const deps = dependencies
      .filter(d => d.successor_activity_id === activityId)
      .map(d => {
        const predecessor = activities.find(a => a.id === d.predecessor_activity_id);
        const typeLabel = DEPENDENCY_TYPES.find(t => t.value === d.type)?.value || d.type;
        return predecessor ? `${predecessor.name} (${typeLabel})` : 'Unknown';
      });

    return deps.length > 0 ? deps.join(', ') : 'None';
  }

  function getAssigneeName(activity: Activity): string {
    if (!activity.assignee_type) return 'Unassigned';

    if (activity.assignee_type === 'employee' && activity.assignee_user_id) {
      const member = projectMembers.find(m => m.user_id === activity.assignee_user_id);
      return member?.email || 'Unknown';
    }

    const type = ASSIGNEE_TYPES.find(t => t.value === activity.assignee_type);
    return type?.label || activity.assignee_type;
  }

  function toggleDependency(activityId: string) {
    const existingIndex = formData.dependencies.findIndex(d => d.predecessor_activity_id === activityId);

    if (existingIndex >= 0) {
      setFormData({
        ...formData,
        dependencies: formData.dependencies.filter((_, i) => i !== existingIndex)
      });
    } else {
      setFormData({
        ...formData,
        dependencies: [...formData.dependencies, { predecessor_activity_id: activityId, type: 'FS', lag_days: 0 }]
      });
    }
  }

  function updateDependencyType(activityId: string, type: string) {
    setFormData({
      ...formData,
      dependencies: formData.dependencies.map(dep =>
        dep.predecessor_activity_id === activityId ? { ...dep, type } : dep
      )
    });
  }

  function updateDependencyLag(activityId: string, lag_days: number) {
    setFormData({
      ...formData,
      dependencies: formData.dependencies.map(dep =>
        dep.predecessor_activity_id === activityId ? { ...dep, lag_days } : dep
      )
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading activities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Activities & Schedule</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage project activities, track progress, and set dependencies
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
              Table
            </button>
            <button
              onClick={() => setViewMode('gantt')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
                viewMode === 'gantt'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Gantt
            </button>
          </div>
          <div className="flex items-center gap-3">
            {viewMode === 'gantt' && activities.length > 0 && (
              <button
                onClick={() => setShowGanttModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
                title="Open Gantt in Fullscreen"
              >
                <Maximize2 className="w-5 h-5" />
                Fullscreen
              </button>
            )}
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showTemplates
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Layout className="w-5 h-5" />
              {showTemplates ? 'Hide Templates' : 'Templates'}
            </button>
            <button
              onClick={openAddForm}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Add Activity
            </button>
          </div>
        </div>
      </div>

      {showTemplates && (
        <div className="mb-6">
          <ActivityTemplatesManager
            organizationId={organizationId}
            onApplyTemplate={handleApplyTemplate}
          />
        </div>
      )}

      {activities.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No activities yet</h3>
          <p className="text-gray-600 mb-6">
            Start by adding your first activity to begin tracking project progress
          </p>
          <button
            onClick={openAddForm}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Add First Activity
          </button>
        </div>
      ) : viewMode === 'gantt' ? (
        <EnhancedGanttChart activities={activities} dependencies={dependencies} onEdit={openEditForm} />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dependencies
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{activity.name}</div>
                      {activity.description && (
                        <div className="text-sm text-gray-500 mt-1">{activity.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{getAssigneeName(activity)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActivityStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {activity.start_date ? new Date(activity.start_date).toLocaleDateString() : 'Not set'}
                      </div>
                      {activity.is_date_override && (
                        <span className="text-xs text-amber-600">Override</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {activity.end_date ? new Date(activity.end_date).toLocaleDateString() : 'Not set'}
                      </div>
                      <div className="text-xs text-gray-500">
                        ({activity.duration_days} days)
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${activity.progress_percent}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-12 text-right">
                          {activity.progress_percent}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <GitBranch className="w-4 h-4" />
                        <span className="truncate">{getDependencyNames(activity.id)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => setViewingActivity(activity)}
                        className="text-gray-600 hover:text-blue-900 mr-3"
                        title="View details"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditForm(activity)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(activity.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Edit Activity' : 'Add New Activity'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {validationError && (
                <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-900">Date Conflict</h4>
                    <p className="text-sm text-red-700 mt-1">{validationError}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Activity Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Site preparation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional details about this activity..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Duration (Days) *
                  </div>
                </label>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={formData.duration_days}
                  onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) || 1 })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Number of days"
                />
                <p className="text-xs text-gray-500 mt-1">
                  How long this activity will take to complete
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center gap-2">
                      Start Date
                      {formData.is_date_override && calculatedStartDate !== formData.start_date && (
                        <span className="text-xs text-amber-600">(Manual Override)</span>
                      )}
                    </div>
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        start_date: e.target.value,
                        is_date_override: e.target.value !== calculatedStartDate
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {calculatedStartDate && formData.start_date !== calculatedStartDate && (
                    <p className="text-xs text-blue-600 mt-1">
                      Suggested: {new Date(calculatedStartDate).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date (Calculated)
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Auto-calculated from start + duration
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {ACTIVITY_STATUSES.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Progress (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.progress_percent}
                    onChange={(e) => setFormData({ ...formData, progress_percent: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Assignee Type
                    </div>
                  </label>
                  <select
                    value={formData.assignee_type}
                    onChange={(e) => {
                      setFormData({ ...formData, assignee_type: e.target.value, assignee_user_id: '' });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {ASSIGNEE_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                {formData.assignee_type === 'employee' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assign to Project Member
                    </label>
                    <select
                      value={formData.assignee_user_id}
                      onChange={(e) => setFormData({ ...formData, assignee_user_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select member...</option>
                      {projectMembers.map(member => (
                        <option key={member.id} value={member.user_id}>
                          {member.email || member.user_id} ({member.role})
                        </option>
                      ))}
                    </select>
                    {projectMembers.length === 0 && (
                      <p className="mt-1 text-xs text-amber-600">
                        No project members yet. Add members in Settings tab.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4" />
                    Dependencies (Predecessor Activities)
                  </div>
                </label>
                <div className="mt-2 space-y-2 max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-3">
                  {activities
                    .filter(a => a.id !== editingId)
                    .map(activity => {
                      const dep = formData.dependencies.find(d => d.predecessor_activity_id === activity.id);
                      const isSelected = !!dep;

                      return (
                        <div key={activity.id} className={`border rounded-lg p-3 transition-colors ${
                          isSelected ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                        }`}>
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleDependency(activity.id)}
                              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-gray-900">{activity.name}</div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {activity.start_date ? new Date(activity.start_date).toLocaleDateString() : 'Not set'} - {activity.end_date ? new Date(activity.end_date).toLocaleDateString() : 'Not set'} ({activity.duration_days} days)
                              </div>
                              {isSelected && (
                                <div className="mt-3 pt-3 border-t border-blue-200 space-y-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                      Dependency Type:
                                    </label>
                                    <select
                                      value={dep?.type || 'FS'}
                                      onChange={(e) => updateDependencyType(activity.id, e.target.value)}
                                      className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                    >
                                      {DEPENDENCY_TYPES.map(type => (
                                        <option key={type.value} value={type.value}>
                                          {type.label} - {type.description}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                      Lag Time (days):
                                    </label>
                                    <input
                                      type="number"
                                      value={dep?.lag_days ?? 0}
                                      onChange={(e) => updateDependencyLag(activity.id, parseInt(e.target.value) || 0)}
                                      min="-365"
                                      max="365"
                                      className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                      Positive values add delay, negative values add advance time
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  {activities.filter(a => a.id !== editingId).length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-2">No other activities available</p>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Select activities that must be completed before this one can start or finish
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={!!validationError}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg ${
                    validationError
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <Save className="w-5 h-5" />
                  {editingId ? 'Update Activity' : 'Create Activity'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{viewingActivity.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{viewingActivity.description}</p>
              </div>
              <button
                onClick={() => setViewingActivity(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Status & Progress</h4>
                <div className="flex items-center gap-4">
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getActivityStatusColor(viewingActivity.status)}`}>
                    {viewingActivity.status}
                  </span>
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${viewingActivity.progress_percent}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{viewingActivity.progress_percent}%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Duration</h4>
                  <p className="text-sm text-gray-900">{viewingActivity.duration_days} days</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Start Date</h4>
                  <p className="text-sm text-gray-900">
                    {viewingActivity.start_date ? new Date(viewingActivity.start_date).toLocaleDateString() : 'Not set'}
                  </p>
                  {viewingActivity.is_date_override && (
                    <span className="text-xs text-amber-600">Manual Override</span>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">End Date</h4>
                  <p className="text-sm text-gray-900">
                    {viewingActivity.end_date ? new Date(viewingActivity.end_date).toLocaleDateString() : 'Not set'}
                  </p>
                </div>
              </div>

              {viewingActivity.override_warning && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">{viewingActivity.override_warning}</div>
                </div>
              )}

              <div className="border-t border-gray-200 pt-6">
                <TimeTrackingSection activityId={viewingActivity.id} organizationId={organizationId} />
              </div>

              <div className="border-t border-gray-200 pt-6">
                <CommentsSection
                  entityType="activity"
                  entityId={viewingActivity.id}
                  organizationId={organizationId}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <GanttChartModal
        isOpen={showGanttModal}
        onClose={() => setShowGanttModal(false)}
        activities={activities}
        dependencies={dependencies}
        onEdit={openEditForm}
        onAddActivity={openAddForm}
      />
    </div>
  );
}

function GanttView_Legacy({ activities, onEdit }: { activities: Activity[]; onEdit: (activity: Activity) => void }) {
  const getDateRange = () => {
    if (activities.length === 0) return { start: new Date(), end: new Date() };

    const dates = activities.flatMap(a => [
      new Date(a.start_date),
      new Date(a.end_date)
    ]);

    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 7);

    return { start: minDate, end: maxDate };
  };

  const { start: rangeStart, end: rangeEnd } = getDateRange();
  const totalDays = Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24));

  const months: { name: string; days: number; offset: number }[] = [];
  let currentDate = new Date(rangeStart);
  let dayOffset = 0;

  while (currentDate <= rangeEnd) {
    const monthStart = new Date(currentDate);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const endDate = monthEnd > rangeEnd ? rangeEnd : monthEnd;
    const daysInMonth = Math.ceil((endDate.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    months.push({
      name: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      days: daysInMonth,
      offset: dayOffset
    });

    dayOffset += daysInMonth;
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  }

  const getBarPosition = (activity: Activity) => {
    const start = new Date(activity.start_date);
    const end = new Date(activity.end_date);

    const leftOffset = Math.max(0, (start.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return {
      left: (leftOffset / totalDays) * 100,
      width: (duration / totalDays) * 100
    };
  };


  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[1200px]">
          <div className="flex border-b border-gray-200">
            <div className="w-64 flex-shrink-0 bg-gray-50 px-4 py-3 font-medium text-sm text-gray-700 border-r border-gray-200">
              Activity
            </div>
            <div className="flex-1 flex">
              {months.map((month, idx) => (
                <div
                  key={idx}
                  className="border-r border-gray-200 px-2 py-3 text-center text-sm font-medium text-gray-700"
                  style={{ width: `${(month.days / totalDays) * 100}%` }}
                >
                  {month.name}
                </div>
              ))}
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {activities.map((activity) => {
              const position = getBarPosition(activity);
              return (
                <div key={activity.id} className="flex hover:bg-gray-50">
                  <div className="w-64 flex-shrink-0 px-4 py-4 border-r border-gray-200">
                    <button
                      onClick={() => onEdit(activity)}
                      className="text-left hover:text-blue-600 transition-colors"
                    >
                      <div className="font-medium text-sm text-gray-900">{activity.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {activity.progress_percent}% complete
                      </div>
                    </button>
                  </div>
                  <div className="flex-1 py-4 px-2 relative">
                    <div className="absolute inset-y-0" style={{ left: `${position.left}%`, width: `${position.width}%` }}>
                      <div className={`h-8 rounded ${getActivityStatusBarColor(activity.status)} relative overflow-hidden`}>
                        <div
                          className="absolute inset-y-0 left-0 bg-white bg-opacity-30"
                          style={{ width: `${activity.progress_percent}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center px-2">
                          <span className="text-xs font-medium text-white truncate">
                            {activity.name}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 text-center">
                        {new Date(activity.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(activity.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-400"></div>
            <span className="text-gray-600">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500"></div>
            <span className="text-gray-600">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500"></div>
            <span className="text-gray-600">Ready for Inspection</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span className="text-gray-600">Inspected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-slate-400"></div>
            <span className="text-gray-600">Closed</span>
          </div>
        </div>
      </div>

    </div>
  );
}
