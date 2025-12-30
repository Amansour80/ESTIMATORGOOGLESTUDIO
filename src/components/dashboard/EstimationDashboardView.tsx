import React, { useEffect, useState } from 'react';
import { FileText, Award, TrendingUp, Clock, Target, AlertCircle, CheckCircle, DollarSign } from 'lucide-react';
import { KPICard } from './KPICard';
import { LineChart } from './LineChart';
import { DonutChart } from './DonutChart';
import { BarChart } from './BarChart';
import { calculateEstimationMetrics, EstimationMetrics } from '../../utils/estimationDashboardMetrics';
import { useOrganization } from '../../contexts/OrganizationContext';

export function EstimationDashboardView() {
  const { organization } = useOrganization();
  const [metrics, setMetrics] = useState<EstimationMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (organization?.id) {
      loadMetrics();
    }
  }, [organization?.id]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const data = await calculateEstimationMetrics(organization!.id);
      setMetrics(data);
    } catch (error) {
      console.error('Error loading estimation metrics:', error);
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

  const submittedCount = metrics.submittedProjects + metrics.pendingDecisionProjects;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Projects"
          value={metrics.totalProjects}
          icon={<FileText className="w-5 h-5" />}
          color="blue"
        />
        <KPICard
          title="Win Rate"
          value={metrics.overallWinRate}
          isPercentage
          icon={<Award className="w-5 h-5" />}
          color="green"
          subtitle={`${metrics.awardedProjects} awarded`}
        />
        <KPICard
          title="On-Time Submission"
          value={metrics.onTimeSubmissionRate}
          isPercentage
          icon={<CheckCircle className="w-5 h-5" />}
          color="teal"
          subtitle={`${metrics.onTimeSubmissions} on time`}
        />
        <KPICard
          title="Avg Days in Draft"
          value={metrics.averageDaysInDraft}
          icon={<Clock className="w-5 h-5" />}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Draft Projects"
          value={metrics.draftProjects}
          icon={<FileText className="w-5 h-5" />}
          color="gray"
        />
        <KPICard
          title="Submitted & Pending"
          value={submittedCount}
          icon={<Target className="w-5 h-5" />}
          color="blue"
          subtitle="Awaiting decision"
        />
        <KPICard
          title="Pipeline Value"
          value={metrics.pipelineValue}
          isCurrency
          icon={<DollarSign className="w-5 h-5" />}
          color="teal"
        />
        <KPICard
          title="Awarded Value"
          value={metrics.totalAwardedValue}
          isCurrency
          icon={<Award className="w-5 h-5" />}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Submission & Award Trend
          </h3>
          <LineChart
            data={metrics.submissionTrend.map(d => ({
              label: d.month,
              value: d.submitted
            }))}
            color="#3b82f6"
            secondaryData={metrics.submissionTrend.map(d => ({
              label: d.month,
              value: d.awarded
            }))}
            secondaryColor="#10b981"
            showLegend
            legendLabels={['Submitted', 'Awarded']}
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Project Status Distribution
          </h3>
          <DonutChart
            data={[
              { label: 'Draft', value: metrics.draftProjects },
              { label: 'Submitted', value: metrics.submittedProjects },
              { label: 'Pending Decision', value: metrics.pendingDecisionProjects },
              { label: 'Awarded', value: metrics.awardedProjects },
              { label: 'Lost', value: metrics.lostProjects }
            ]}
          />
        </div>
      </div>

      {metrics.upcomingDeadlines.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            Upcoming Deadlines (Next 30 Days)
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Project
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Deadline
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Days Remaining
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metrics.upcomingDeadlines.map((deadline) => (
                  <tr key={deadline.projectId}>
                    <td className="px-4 py-3 text-sm text-gray-900">{deadline.projectName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{deadline.type}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(deadline.deadline).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          deadline.daysRemaining <= 3
                            ? 'bg-red-100 text-red-800'
                            : deadline.daysRemaining <= 7
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {deadline.daysRemaining} days
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {metrics.estimatorPerformance.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Estimator Performance Comparison
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estimator
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Submitted
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Awarded
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Win Rate
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Avg Value
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Avg Turnaround
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metrics.estimatorPerformance.map((estimator) => (
                  <tr key={estimator.estimatorId}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {estimator.estimatorName}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      {estimator.totalSubmitted}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      {estimator.totalAwarded}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          estimator.winRate >= 50
                            ? 'bg-green-100 text-green-800'
                            : estimator.winRate >= 30
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {estimator.winRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      {(estimator.avgProjectValue / 1000).toFixed(0)}K
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      {estimator.avgTurnaroundDays.toFixed(0)} days
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Avg Deal Size by Type
          </h3>
          <BarChart
            data={metrics.avgDealSizeByType.map(d => ({
              label: d.type,
              value: d.avgValue
            }))}
            color="#3b82f6"
            isCurrency
          />
        </div>

        {metrics.timeInStatus.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Average Time in Each Status
            </h3>
            <BarChart
              data={metrics.timeInStatus
                .filter(d => d.status)
                .map(d => ({
                  label: d.status.replace('_', ' '),
                  value: d.avgDays
                }))}
              color="#10b981"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
          <p className="text-sm font-medium text-blue-900 mb-2">Submission Performance</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-700">On Time</span>
              <span className="text-sm font-semibold text-blue-900">{metrics.onTimeSubmissions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-700">Late</span>
              <span className="text-sm font-semibold text-blue-900">{metrics.lateSubmissions}</span>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-6 border border-green-100">
          <p className="text-sm font-medium text-green-900 mb-2">Client Decision Time</p>
          <p className="text-3xl font-bold text-green-900">{metrics.avgClientDecisionTime.toFixed(1)}</p>
          <p className="text-xs text-green-700 mt-1">Avg days to decision</p>
        </div>

        <div className="bg-teal-50 rounded-lg p-6 border border-teal-100">
          <p className="text-sm font-medium text-teal-900 mb-2">Total Submission Value</p>
          <p className="text-2xl font-bold text-teal-900">
            {(metrics.totalSubmissionValue / 1000000).toFixed(1)}M
          </p>
          <p className="text-xs text-teal-700 mt-1">All submitted projects</p>
        </div>
      </div>
    </div>
  );
}
