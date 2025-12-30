import { supabase } from '../lib/supabase';

export interface EstimationMetrics {
  totalProjects: number;
  draftProjects: number;
  submittedProjects: number;
  pendingDecisionProjects: number;
  awardedProjects: number;
  lostProjects: number;
  overallWinRate: number;
  onTimeSubmissions: number;
  lateSubmissions: number;
  onTimeSubmissionRate: number;
  averageDaysInDraft: number;
  upcomingDeadlines: Array<{
    projectId: string;
    projectName: string;
    type: string;
    deadline: string;
    daysRemaining: number;
  }>;
  estimatorPerformance: Array<{
    estimatorId: string;
    estimatorName: string;
    totalSubmitted: number;
    totalAwarded: number;
    winRate: number;
    avgProjectValue: number;
    avgTurnaroundDays: number;
  }>;
  submissionTrend: Array<{ month: string; submitted: number; awarded: number }>;
  avgDealSizeByType: Array<{ type: string; avgValue: number; count: number }>;
  timeInStatus: Array<{ status: string; avgDays: number }>;
  avgClientDecisionTime: number;
  totalSubmissionValue: number;
  totalAwardedValue: number;
  pipelineValue: number;
}

interface Project {
  id: string;
  project_name: string;
  client_name?: string;
  status: string;
  created_at: string;
  updated_at: string;
  calculated_value?: number;
  created_by: string;
  submitted_date?: string;
  expected_submission_date?: string;
  is_on_time_submission?: boolean;
  status_history?: Array<{
    from_status: string;
    to_status: string;
    changed_at: string;
    changed_by: string;
  }>;
  submitted_at?: string;
  awarded_at?: string;
  lost_at?: string;
}

export async function calculateEstimationMetrics(organizationId: string): Promise<EstimationMetrics> {
  const [fmResult, retrofitResult, hkResult, profilesResult] = await Promise.all([
    supabase
      .from('fm_projects')
      .select('*')
      .eq('organization_id', organizationId),
    supabase
      .from('retrofit_projects')
      .select('*')
      .eq('organization_id', organizationId),
    supabase
      .from('hk_projects')
      .select('*')
      .eq('organization_id', organizationId),
    supabase
      .from('user_profiles')
      .select('id, full_name')
  ]);

  const fmProjects: Project[] = (fmResult.data || []).map(p => ({ ...p, type: 'FM' }));
  const retrofitProjects: Project[] = (retrofitResult.data || []).map(p => ({ ...p, type: 'Retrofit' }));
  const hkProjects: Project[] = (hkResult.data || []).map(p => ({ ...p, type: 'HK' }));
  const allProjects = [...fmProjects, ...retrofitProjects, ...hkProjects];

  const userProfiles = new Map(
    (profilesResult.data || []).map(p => [p.id, p.full_name || 'Unknown'])
  );

  const totalProjects = allProjects.length;
  const draftProjects = allProjects.filter(p => p.status === 'DRAFT').length;
  const submittedProjects = allProjects.filter(p => p.status === 'SUBMITTED').length;
  const pendingDecisionProjects = allProjects.filter(p => p.status === 'PENDING_CLIENT_DECISION').length;
  const awardedProjects = allProjects.filter(p => p.status === 'AWARDED').length;
  const lostProjects = allProjects.filter(p => p.status === 'LOST').length;

  const totalSubmittedOrPending = submittedProjects + pendingDecisionProjects + awardedProjects + lostProjects;
  const overallWinRate = totalSubmittedOrPending > 0
    ? (awardedProjects / totalSubmittedOrPending) * 100
    : 0;

  const submittedProjectsList = allProjects.filter(p =>
    ['SUBMITTED', 'PENDING_CLIENT_DECISION', 'AWARDED', 'LOST'].includes(p.status)
  );

  const onTimeSubmissions = submittedProjectsList.filter(p => p.is_on_time_submission === true).length;
  const lateSubmissions = submittedProjectsList.filter(p => p.is_on_time_submission === false).length;
  const onTimeSubmissionRate = submittedProjectsList.length > 0
    ? (onTimeSubmissions / submittedProjectsList.length) * 100
    : 0;

  const draftProjectsWithDates = allProjects.filter(p => p.status === 'DRAFT');
  const averageDaysInDraft = draftProjectsWithDates.length > 0
    ? draftProjectsWithDates.reduce((sum, p) => {
        const createdDate = new Date(p.created_at);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        return sum + diffDays;
      }, 0) / draftProjectsWithDates.length
    : 0;

  const now = new Date();
  const upcomingDeadlines = allProjects
    .filter(p => p.status === 'DRAFT' && p.expected_submission_date)
    .map(p => {
      const deadline = new Date(p.expected_submission_date!);
      const diffTime = deadline.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return {
        projectId: p.id,
        projectName: p.project_name,
        type: (p as any).type || 'Unknown',
        deadline: p.expected_submission_date!,
        daysRemaining
      };
    })
    .filter(d => d.daysRemaining >= 0 && d.daysRemaining <= 30)
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .slice(0, 10);

  const estimatorMap = new Map<string, {
    totalSubmitted: number;
    totalAwarded: number;
    totalValue: number;
    totalTurnaroundDays: number;
    projectCount: number;
  }>();

  submittedProjectsList.forEach(p => {
    const estimatorId = p.created_by;
    const existing = estimatorMap.get(estimatorId) || {
      totalSubmitted: 0,
      totalAwarded: 0,
      totalValue: 0,
      totalTurnaroundDays: 0,
      projectCount: 0
    };

    estimatorMap.set(estimatorId, {
      totalSubmitted: existing.totalSubmitted + 1,
      totalAwarded: existing.totalAwarded + (p.status === 'AWARDED' ? 1 : 0),
      totalValue: existing.totalValue + (p.calculated_value || 0),
      totalTurnaroundDays: existing.totalTurnaroundDays + (p.submitted_date ?
        Math.floor((new Date(p.submitted_date).getTime() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0),
      projectCount: existing.projectCount + (p.submitted_date ? 1 : 0)
    });
  });

  const estimatorPerformance = Array.from(estimatorMap.entries())
    .map(([estimatorId, data]) => ({
      estimatorId,
      estimatorName: userProfiles.get(estimatorId) || 'Unknown',
      totalSubmitted: data.totalSubmitted,
      totalAwarded: data.totalAwarded,
      winRate: data.totalSubmitted > 0 ? (data.totalAwarded / data.totalSubmitted) * 100 : 0,
      avgProjectValue: data.totalSubmitted > 0 ? data.totalValue / data.totalSubmitted : 0,
      avgTurnaroundDays: data.projectCount > 0 ? data.totalTurnaroundDays / data.projectCount : 0
    }))
    .sort((a, b) => b.totalSubmitted - a.totalSubmitted);

  const monthlyTrendMap = new Map<string, { submitted: number; awarded: number }>();
  submittedProjectsList.forEach(p => {
    const date = new Date(p.submitted_date || p.submitted_at || p.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const existing = monthlyTrendMap.get(monthKey) || { submitted: 0, awarded: 0 };
    monthlyTrendMap.set(monthKey, {
      submitted: existing.submitted + 1,
      awarded: existing.awarded + (p.status === 'AWARDED' ? 1 : 0)
    });
  });

  const submissionTrend = Array.from(monthlyTrendMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12)
    .map(([month, data]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      ...data
    }));

  const typeMap = new Map<string, { totalValue: number; count: number }>();
  allProjects.forEach(p => {
    const type = (p as any).type || 'Unknown';
    const existing = typeMap.get(type) || { totalValue: 0, count: 0 };
    typeMap.set(type, {
      totalValue: existing.totalValue + (p.calculated_value || 0),
      count: existing.count + 1
    });
  });

  const avgDealSizeByType = Array.from(typeMap.entries())
    .map(([type, data]) => ({
      type,
      avgValue: data.count > 0 ? data.totalValue / data.count : 0,
      count: data.count
    }));

  const statusTimeMap = new Map<string, number[]>();
  allProjects.forEach(p => {
    if (p.status_history && p.status_history.length > 0) {
      for (let i = 0; i < p.status_history.length; i++) {
        const entry = p.status_history[i];
        if (!entry.from_status) continue;

        const fromDate = i === 0 ? new Date(p.created_at) : new Date(p.status_history[i - 1].changed_at);
        const toDate = new Date(entry.changed_at);
        const diffDays = Math.floor((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));

        const existing = statusTimeMap.get(entry.from_status) || [];
        existing.push(diffDays);
        statusTimeMap.set(entry.from_status, existing);
      }
    }
  });

  const timeInStatus = Array.from(statusTimeMap.entries())
    .map(([status, days]) => ({
      status,
      avgDays: days.length > 0 ? days.reduce((a, b) => a + b, 0) / days.length : 0
    }));

  const projectsWithDecisionTime = allProjects.filter(p =>
    (p.status === 'AWARDED' || p.status === 'LOST') &&
    p.submitted_date &&
    (p.awarded_at || p.lost_at)
  );

  const avgClientDecisionTime = projectsWithDecisionTime.length > 0
    ? projectsWithDecisionTime.reduce((sum, p) => {
        const submittedDate = new Date(p.submitted_date!);
        const decisionDate = new Date(p.awarded_at || p.lost_at!);
        const diffDays = Math.floor((decisionDate.getTime() - submittedDate.getTime()) / (1000 * 60 * 60 * 24));
        return sum + diffDays;
      }, 0) / projectsWithDecisionTime.length
    : 0;

  const totalSubmissionValue = submittedProjectsList.reduce((sum, p) => sum + (p.calculated_value || 0), 0);
  const totalAwardedValue = allProjects
    .filter(p => p.status === 'AWARDED')
    .reduce((sum, p) => sum + (p.calculated_value || 0), 0);

  const pipelineValue = allProjects
    .filter(p => ['SUBMITTED', 'PENDING_CLIENT_DECISION'].includes(p.status))
    .reduce((sum, p) => sum + (p.calculated_value || 0), 0);

  return {
    totalProjects,
    draftProjects,
    submittedProjects,
    pendingDecisionProjects,
    awardedProjects,
    lostProjects,
    overallWinRate,
    onTimeSubmissions,
    lateSubmissions,
    onTimeSubmissionRate,
    averageDaysInDraft,
    upcomingDeadlines,
    estimatorPerformance,
    submissionTrend,
    avgDealSizeByType,
    timeInStatus,
    avgClientDecisionTime,
    totalSubmissionValue,
    totalAwardedValue,
    pipelineValue
  };
}
