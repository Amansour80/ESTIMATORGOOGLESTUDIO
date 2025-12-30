import React, { useEffect, useState } from 'react';
import { FolderOpen, DollarSign, AlertCircle, CheckCircle, TrendingUp, Clock, FileText, Activity } from 'lucide-react';
import { KPICard } from './KPICard';
import { DonutChart } from './DonutChart';
import { BarChart } from './BarChart';
import { calculatePMMetrics, PMMetrics } from '../../utils/pmDashboardMetrics';
import { useOrganization } from '../../contexts/OrganizationContext';

interface PMDashboardViewProps {
  onNavigateToProject?: (projectId: string) => void;
}

export function PMDashboardView({ onNavigateToProject: _onNavigateToProject }: PMDashboardViewProps) {
  const handleNavigateToProject = (projectId: string) => {
    window.location.hash = `#/retrofit-pm/${projectId}`;
  };
  const { organization } = useOrganization();
  const [metrics, setMetrics] = useState<PMMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (organization?.id) {
      loadMetrics();
    }
  }, [organization?.id]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const data = await calculatePMMetrics(organization!.id);
      setMetrics(data);
    } catch (error) {
      console.error('Error loading PM metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading metrics...</div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">No data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="cursor-pointer hover:shadow-lg transition-shadow">
          <KPICard
            title="Active Projects"
            value={metrics.totalActiveProjects}
            icon={<FolderOpen className="w-5 h-5" />}
            color="blue"
          />
        </div>
        <KPICard
          title="Budget Variance"
          value={metrics.budgetVariancePercentage}
          isPercentage
          icon={<DollarSign className="w-5 h-5" />}
          color={metrics.budgetVariancePercentage > 0 ? 'red' : 'green'}
          subtitle={`${metrics.budgetVariancePercentage > 0 ? 'Over' : 'Under'} budget`}
        />
        <KPICard
          title="Avg Completion"
          value={metrics.averageCompletion}
          isPercentage
          icon={<TrendingUp className="w-5 h-5" />}
          color="teal"
        />
        <KPICard
          title="Open Issues"
          value={metrics.openIssuesCount}
          icon={<AlertCircle className="w-5 h-5" />}
          color="orange"
          subtitle={`${metrics.criticalIssuesCount} critical`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Budget"
          value={metrics.totalBudget}
          isCurrency
          icon={<DollarSign className="w-5 h-5" />}
          color="blue"
        />
        <KPICard
          title="Actual Costs"
          value={metrics.totalActualCost}
          isCurrency
          icon={<DollarSign className="w-5 h-5" />}
          color="teal"
        />
        <KPICard
          title="Pending Approvals"
          value={metrics.pendingCostApprovals}
          icon={<Clock className="w-5 h-5" />}
          color="orange"
          subtitle={metrics.totalPendingCostValue > 0 ? `${(metrics.totalPendingCostValue / 1000).toFixed(0)}K value` : ''}
        />
        <KPICard
          title="Overdue Tasks"
          value={metrics.overdueTasksCount}
          icon={<AlertCircle className="w-5 h-5" />}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Project Health Status
          </h3>
          <DonutChart
            data={metrics.projectsByHealth.map(d => ({
              label: d.health,
              value: d.count,
              color: d.color
            }))}
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Cost Breakdown
          </h3>
          <DonutChart
            data={metrics.costBreakdown.map(d => ({
              label: d.type,
              value: d.amount
            }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-50 rounded-lg p-6 border border-green-100">
          <p className="text-sm font-medium text-green-900 mb-2">Budget Performance</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-green-700">Under Budget</span>
              <span className="text-sm font-semibold text-green-900">{metrics.projectsUnderBudget}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-green-700">On Budget</span>
              <span className="text-sm font-semibold text-green-900">{metrics.projectsOnBudget}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-green-700">Over Budget</span>
              <span className="text-sm font-semibold text-green-900">{metrics.projectsOverBudget}</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
          <p className="text-sm font-medium text-blue-900 mb-2">Schedule Performance</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-700">On Schedule</span>
              <span className="text-sm font-semibold text-blue-900">{metrics.projectsOnSchedule}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-700">Delayed</span>
              <span className="text-sm font-semibold text-blue-900">{metrics.projectsDelayed}</span>
            </div>
          </div>
        </div>

        <div className="bg-teal-50 rounded-lg p-6 border border-teal-100">
          <p className="text-sm font-medium text-teal-900 mb-2">Document Status</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-teal-700">Approved</span>
              <span className="text-sm font-semibold text-teal-900">{metrics.documentStatus.approved}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-teal-700">Pending</span>
              <span className="text-sm font-semibold text-teal-900">{metrics.documentStatus.pending}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-teal-700">Rejected</span>
              <span className="text-sm font-semibold text-teal-900">{metrics.documentStatus.rejected}</span>
            </div>
          </div>
        </div>
      </div>

      {metrics.budgetUtilizationByProject.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Budget Utilization by Project
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Project
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Budget
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actual
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Utilization
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Variance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metrics.budgetUtilizationByProject.map((project) => (
                  <tr
                    key={project.projectId}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleNavigateToProject(project.projectId)}
                  >
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{project.projectName}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      {(project.budget / 1000).toFixed(1)}K
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      {(project.actual / 1000).toFixed(1)}K
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          project.utilization > 100
                            ? 'bg-red-100 text-red-800'
                            : project.utilization > 90
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {project.utilization.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={project.variance > 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                        {project.variance > 0 ? '+' : ''}
                        {(project.variance / 1000).toFixed(1)}K
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {metrics.schedulePerformanceByProject.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Schedule Performance by Project
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Project
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Completion
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Days Elapsed
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Health
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metrics.schedulePerformanceByProject.map((project) => (
                  <tr
                    key={project.projectId}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleNavigateToProject(project.projectId)}
                  >
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{project.projectName}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      {project.completion.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      {project.daysElapsed} days
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          project.health === 'delayed'
                            ? 'bg-red-100 text-red-800'
                            : project.health === 'at_risk'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {project.health.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {metrics.recentActivities.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Upcoming Activities
          </h3>
          <div className="space-y-3">
            {metrics.recentActivities.map((activity, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() => handleNavigateToProject(activity.projectId)}
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.activityName}</p>
                  <p className="text-xs text-gray-500">{activity.projectName}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      activity.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : activity.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {activity.status.replace('_', ' ')}
                  </span>
                  {activity.dueDate && (
                    <p className="text-xs text-gray-500 mt-1">
                      Due: {new Date(activity.dueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {metrics.projectsByPhase.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Projects by Phase
          </h3>
          <BarChart
            data={metrics.projectsByPhase.map(d => ({
              label: d.phase,
              value: d.count
            }))}
            color="#3b82f6"
          />
        </div>
      )}
    </div>
  );
}
