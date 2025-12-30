import { supabase } from '../lib/supabase';

function getEmptyMetrics(): PMMetrics {
  return {
    totalActiveProjects: 0,
    projectsByPhase: [],
    projectsByHealth: [],
    totalBudget: 0,
    totalActualCost: 0,
    budgetVariance: 0,
    budgetVariancePercentage: 0,
    projectsOverBudget: 0,
    projectsOnBudget: 0,
    projectsUnderBudget: 0,
    projectsOnSchedule: 0,
    projectsDelayed: 0,
    averageCompletion: 0,
    pendingCostApprovals: 0,
    totalPendingCostValue: 0,
    openIssuesCount: 0,
    criticalIssuesCount: 0,
    overdueTasksCount: 0,
    costBreakdown: [],
    budgetUtilizationByProject: [],
    schedulePerformanceByProject: [],
    recentActivities: [],
    documentStatus: {
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0
    }
  };
}

export interface PMMetrics {
  totalActiveProjects: number;
  projectsByPhase: Array<{ phase: string; count: number }>;
  projectsByHealth: Array<{ health: string; count: number; color: string }>;
  totalBudget: number;
  totalActualCost: number;
  budgetVariance: number;
  budgetVariancePercentage: number;
  projectsOverBudget: number;
  projectsOnBudget: number;
  projectsUnderBudget: number;
  projectsOnSchedule: number;
  projectsDelayed: number;
  averageCompletion: number;
  pendingCostApprovals: number;
  totalPendingCostValue: number;
  openIssuesCount: number;
  criticalIssuesCount: number;
  overdueTasksCount: number;
  costBreakdown: Array<{ type: string; amount: number; percentage: number }>;
  budgetUtilizationByProject: Array<{
    projectId: string;
    projectName: string;
    budget: number;
    actual: number;
    utilization: number;
    variance: number;
  }>;
  schedulePerformanceByProject: Array<{
    projectId: string;
    projectName: string;
    completion: number;
    health: string;
    daysElapsed: number;
  }>;
  recentActivities: Array<{
    projectId: string;
    projectName: string;
    activityName: string;
    status: string;
    dueDate?: string;
  }>;
  documentStatus: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  };
}

export async function calculatePMMetrics(organizationId: string): Promise<PMMetrics> {
  const projectsResult = await supabase
    .from('retrofit_projects')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('status', 'AWARDED');

  const projects = projectsResult.data || [];
  const projectIds = projects.map(p => p.id);

  if (projectIds.length === 0) {
    return getEmptyMetrics();
  }

  const [activitiesResult, issuesResult, costsResult, documentsResult, budgetResult] = await Promise.all([
    supabase
      .from('project_activities')
      .select('*')
      .in('retrofit_project_id', projectIds),
    supabase
      .from('project_issues')
      .select('*')
      .in('retrofit_project_id', projectIds)
      .neq('status', 'resolved'),
    supabase
      .from('actual_costs')
      .select('*')
      .in('project_id', projectIds),
    supabase
      .from('project_documents')
      .select('*')
      .in('retrofit_project_id', projectIds),
    supabase
      .from('budget_baselines')
      .select('*')
      .in('project_id', projectIds)
      .eq('is_active', true)
  ]);

  const activities = activitiesResult.data || [];
  const issues = issuesResult.data || [];
  const allCosts = costsResult.data || [];
  const costs = allCosts.filter(c => c.status === 'approved');
  const documents = documentsResult.data || [];
  const budgetItems = budgetResult.data || [];

  const projectActivities = new Map<string, any[]>();
  activities.forEach(a => {
    const existing = projectActivities.get(a.retrofit_project_id) || [];
    existing.push(a);
    projectActivities.set(a.retrofit_project_id, existing);
  });

  const projectIssues = new Map<string, any[]>();
  issues.forEach(i => {
    const existing = projectIssues.get(i.retrofit_project_id) || [];
    existing.push(i);
    projectIssues.set(i.retrofit_project_id, existing);
  });

  const projectCosts = new Map<string, any[]>();
  costs.forEach(c => {
    const existing = projectCosts.get(c.project_id) || [];
    existing.push(c);
    projectCosts.set(c.project_id, existing);
  });

  const projectBudgets = new Map<string, any[]>();
  budgetItems.forEach(b => {
    const existing = projectBudgets.get(b.project_id) || [];
    existing.push(b);
    projectBudgets.set(b.project_id, existing);
  });

  const totalActiveProjects = projects.length;

  const phaseMap = new Map<string, number>();
  projects.forEach(p => {
    const phase = p.phase || 'Not Set';
    phaseMap.set(phase, (phaseMap.get(phase) || 0) + 1);
  });

  const projectsByPhase = Array.from(phaseMap.entries())
    .map(([phase, count]) => ({ phase, count }))
    .sort((a, b) => b.count - a.count);

  const healthMap = new Map<string, number>();
  projects.forEach(p => {
    const health = p.health_status || 'on_track';
    healthMap.set(health, (healthMap.get(health) || 0) + 1);
  });

  const healthColors: Record<string, string> = {
    on_track: '#10b981',
    at_risk: '#f59e0b',
    delayed: '#ef4444'
  };

  const projectsByHealth = Array.from(healthMap.entries())
    .map(([health, count]) => ({
      health: health.replace('_', ' ').charAt(0).toUpperCase() + health.replace('_', ' ').slice(1),
      count,
      color: healthColors[health] || '#6b7280'
    }));

  let totalBudget = 0;
  let totalActualCost = 0;

  projects.forEach(p => {
    const budget = projectBudgets.get(p.id) || [];
    const projectBudget = budget.reduce((sum, b) => sum + (b.baseline_cost || 0), 0);
    totalBudget += projectBudget;

    const projectCost = (projectCosts.get(p.id) || []).reduce((sum, c) => sum + (c.total_amount || 0), 0);
    totalActualCost += projectCost;
  });

  const budgetVariance = totalBudget - totalActualCost;
  const budgetVariancePercentage = totalBudget > 0
    ? ((totalActualCost - totalBudget) / totalBudget) * 100
    : 0;

  let projectsOverBudget = 0;
  let projectsOnBudget = 0;
  let projectsUnderBudget = 0;

  projects.forEach(p => {
    const budget = (projectBudgets.get(p.id) || []).reduce((sum, b) => sum + (b.baseline_cost || 0), 0);
    const actual = (projectCosts.get(p.id) || []).reduce((sum, c) => sum + (c.total_amount || 0), 0);

    if (budget === 0) return;

    const variance = ((actual - budget) / budget) * 100;
    if (variance > 5) projectsOverBudget++;
    else if (variance < -5) projectsUnderBudget++;
    else projectsOnBudget++;
  });

  const projectsOnSchedule = projects.filter(p => p.health_status === 'on_track').length;
  const projectsDelayed = projects.filter(p => p.health_status === 'delayed').length;

  const averageCompletion = projects.length > 0
    ? projects.reduce((sum, p) => sum + (p.completion_percentage || 0), 0) / projects.length
    : 0;

  const pendingCosts = allCosts.filter(c => c.status === 'pending_review');

  const pendingCostApprovals = pendingCosts.length;
  const totalPendingCostValue = pendingCosts.reduce((sum, c) => sum + (c.total_amount || 0), 0);

  const openIssuesCount = issues.length;
  const criticalIssuesCount = issues.filter(i => i.priority === 'critical').length;

  const now = new Date();
  const overdueTasksCount = activities.filter(a => {
    if (a.status === 'completed') return false;
    if (!a.end_date) return false;
    return new Date(a.end_date) < now;
  }).length;

  const costTypeMap = new Map<string, number>();
  costs.forEach(c => {
    const type = c.cost_type || 'other';
    costTypeMap.set(type, (costTypeMap.get(type) || 0) + (c.total_amount || 0));
  });

  const costBreakdown = Array.from(costTypeMap.entries())
    .map(([type, amount]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      amount,
      percentage: totalActualCost > 0 ? (amount / totalActualCost) * 100 : 0
    }))
    .sort((a, b) => b.amount - a.amount);

  const budgetUtilizationByProject = projects
    .map(p => {
      const budget = (projectBudgets.get(p.id) || []).reduce((sum, b) => sum + (b.baseline_cost || 0), 0);
      const actual = (projectCosts.get(p.id) || []).reduce((sum, c) => sum + (c.total_amount || 0), 0);
      const utilization = budget > 0 ? (actual / budget) * 100 : 0;
      const variance = actual - budget;

      return {
        projectId: p.id,
        projectName: p.project_name,
        budget,
        actual,
        utilization,
        variance
      };
    })
    .filter(p => p.budget > 0)
    .sort((a, b) => b.utilization - a.utilization)
    .slice(0, 10);

  const schedulePerformanceByProject = projects
    .map(p => {
      const daysElapsed = p.actual_start_date
        ? Math.floor((now.getTime() - new Date(p.actual_start_date).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        projectId: p.id,
        projectName: p.project_name,
        completion: p.completion_percentage || 0,
        health: p.health_status || 'on_track',
        daysElapsed
      };
    })
    .sort((a, b) => a.completion - b.completion)
    .slice(0, 10);

  const recentActivities = activities
    .filter(a => a.status !== 'completed')
    .sort((a, b) => {
      const dateA = new Date(a.end_date || a.updated_at);
      const dateB = new Date(b.end_date || b.updated_at);
      return dateA.getTime() - dateB.getTime();
    })
    .slice(0, 10)
    .map(a => {
      const project = projects.find(p => p.id === a.retrofit_project_id);
      return {
        projectId: a.retrofit_project_id,
        projectName: project?.project_name || 'Unknown',
        activityName: a.name,
        status: a.status,
        dueDate: a.end_date
      };
    });

  const documentStatus = {
    total: documents.length,
    approved: documents.filter(d => d.workflow_status === 'approved').length,
    pending: documents.filter(d => d.workflow_status === 'pending').length,
    rejected: documents.filter(d => d.workflow_status === 'rejected').length
  };

  return {
    totalActiveProjects,
    projectsByPhase,
    projectsByHealth,
    totalBudget,
    totalActualCost,
    budgetVariance,
    budgetVariancePercentage,
    projectsOverBudget,
    projectsOnBudget,
    projectsUnderBudget,
    projectsOnSchedule,
    projectsDelayed,
    averageCompletion,
    pendingCostApprovals,
    totalPendingCostValue,
    openIssuesCount,
    criticalIssuesCount,
    overdueTasksCount,
    costBreakdown,
    budgetUtilizationByProject,
    schedulePerformanceByProject,
    recentActivities,
    documentStatus
  };
}
