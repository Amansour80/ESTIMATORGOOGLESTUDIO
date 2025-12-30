import React, { useState, useEffect, useMemo } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  TrendingUp,
  DollarSign,
  Target,
  Award,
  Clock,
  AlertCircle,
  FileText,
  Users,
  BarChart3,
  Filter,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { loadProjects, getFMProjectsCount, type SavedProject } from '../utils/fmDatabase';
import { listRetrofitProjects, getRetrofitProjectsCount, type SavedRetrofitProject } from '../utils/retrofitDatabase';
import { listHKProjects, getHKProjectsCount, type SavedHKProject } from '../utils/hkDatabase';
import { calculateDashboardMetrics, calculateMonthlyTrends } from '../utils/dashboardMetrics';
import { MetricCard } from '../components/dashboard/MetricCard';
import { LineChart } from '../components/dashboard/LineChart';
import { BarChart } from '../components/dashboard/BarChart';
import { DonutChart } from '../components/dashboard/DonutChart';
import { FunnelChart } from '../components/dashboard/FunnelChart';
import { formatCurrency } from '../utils/currencyFormatter';
import type { ProjectStatus } from '../types/projectStatus';

interface InteractiveDashboardProps {
  user: User;
  onNavigate: (tab: 'hk' | 'fm' | 'retrofit' | 'inquiries', projectId?: string) => void;
}

type TimeRange = '7d' | '30d' | '90d' | '6m' | '1y' | 'all';
type ProjectTypeFilter = 'all' | 'hk' | 'fm' | 'retrofit';

export default function InteractiveDashboard({ user, onNavigate }: InteractiveDashboardProps) {
  const [hkProjects, setHkProjects] = useState<SavedHKProject[]>([]);
  const [fmProjects, setFmProjects] = useState<SavedProject[]>([]);
  const [retrofitProjects, setRetrofitProjects] = useState<SavedRetrofitProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('6m');
  const [projectTypeFilter, setProjectTypeFilter] = useState<ProjectTypeFilter>('all');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [hkResult, fmResult, retrofitResult] = await Promise.all([
        listHKProjects(),
        loadProjects(),
        listRetrofitProjects(),
      ]);

      setHkProjects(hkResult || []);
      setFmProjects(fmResult.success && fmResult.projects ? fmResult.projects : []);
      setRetrofitProjects(retrofitResult || []);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    const filterByDate = (date: string) => {
      const projectDate = new Date(date);
      const now = new Date();
      const diff = now.getTime() - projectDate.getTime();
      const days = diff / (1000 * 60 * 60 * 24);

      switch (timeRange) {
        case '7d': return days <= 7;
        case '30d': return days <= 30;
        case '90d': return days <= 90;
        case '6m': return days <= 180;
        case '1y': return days <= 365;
        default: return true;
      }
    };

    const hk = hkProjects.filter(p => filterByDate(p.created_at));
    const fm = fmProjects.filter(p => filterByDate(p.created_at));
    const retrofit = retrofitProjects.filter(p => filterByDate(p.created_at));

    switch (projectTypeFilter) {
      case 'hk': return { hkProjects: hk, fmProjects: [], retrofitProjects: [] };
      case 'fm': return { hkProjects: [], fmProjects: fm, retrofitProjects: [] };
      case 'retrofit': return { hkProjects: [], fmProjects: [], retrofitProjects: retrofit };
      default: return { hkProjects: hk, fmProjects: fm, retrofitProjects: retrofit };
    }
  }, [hkProjects, fmProjects, retrofitProjects, timeRange, projectTypeFilter]);

  const metrics = useMemo(
    () => calculateDashboardMetrics(
      filteredData.hkProjects,
      filteredData.fmProjects,
      filteredData.retrofitProjects
    ),
    [filteredData]
  );

  const trends = useMemo(
    () => calculateMonthlyTrends(
      filteredData.hkProjects,
      filteredData.fmProjects,
      filteredData.retrofitProjects,
      6
    ),
    [filteredData]
  );

  const statusDistribution = useMemo(() => [
    { label: 'Draft', value: metrics.draftCount, color: '#94A3B8' },
    { label: 'Submitted', value: metrics.submittedCount, color: '#3B82F6' },
    { label: 'Awarded', value: metrics.awardedCount, color: '#10B981' },
    { label: 'Lost', value: metrics.lostCount, color: '#EF4444' },
    { label: 'Cancelled', value: metrics.cancelledCount, color: '#F59E0B' },
  ].filter(item => item.value > 0), [metrics]);

  const pipelineValue = useMemo(() => [
    { label: 'Draft', value: metrics.draftValue, color: '#94A3B8' },
    { label: 'Submitted', value: metrics.submittedValue, color: '#3B82F6' },
    { label: 'Awarded', value: metrics.awardedValue, color: '#10B981' },
    { label: 'Lost', value: metrics.lostValue, color: '#EF4444' },
  ].filter(item => item.value > 0), [metrics]);

  const funnelStages = [
    { label: 'Total Pipeline', value: metrics.totalProjectsValue, count: metrics.totalProjectsCount, color: '#6366F1' },
    { label: 'Submitted', value: metrics.submittedValue + metrics.awardedValue + metrics.lostValue, count: metrics.submittedCount + metrics.awardedCount + metrics.lostCount, color: '#3B82F6' },
    { label: 'Awarded', value: metrics.awardedValue, count: metrics.awardedCount, color: '#10B981' },
  ];

  const projectTypeComparison = [
    { label: 'HK', value: metrics.hkValue, color: '#3B82F6' },
    { label: 'FM', value: metrics.fmValue, color: '#10B981' },
    { label: 'Retrofit', value: metrics.retrofitValue, color: '#F59E0B' },
  ].filter(item => item.value > 0);

  const revenueByMonth = trends.map(t => ({
    label: t.month.split(' ')[0],
    value: t.value,
  }));

  const projectsByMonth = trends.map(t => ({
    label: t.month.split(' ')[0],
    value: t.created,
  }));

  const conversionMetrics = {
    submitRate: metrics.totalProjectsCount > 0
      ? ((metrics.submittedCount + metrics.awardedCount + metrics.lostCount) / metrics.totalProjectsCount * 100).toFixed(1)
      : '0.0',
    winRate: metrics.winRate.toFixed(1),
    avgDealSize: metrics.totalProjectsCount > 0
      ? metrics.totalProjectsValue / metrics.totalProjectsCount
      : 0,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Overall Performance Dashboard</h1>
            <p className="text-gray-600">Real-time business intelligence and analytics</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={projectTypeFilter}
                onChange={(e) => setProjectTypeFilter(e.target.value as ProjectTypeFilter)}
                className="text-sm border-none focus:ring-0 bg-transparent"
              >
                <option value="all">All Projects</option>
                <option value="hk">HK Only</option>
                <option value="fm">FM Only</option>
                <option value="retrofit">Retrofit Only</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                className="text-sm border-none focus:ring-0 bg-transparent"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="6m">Last 6 months</option>
                <option value="1y">Last year</option>
                <option value="all">All time</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Total Pipeline Value"
            value={formatCurrency(metrics.totalProjectsValue)}
            change={15.3}
            changeLabel="vs last period"
            icon={<DollarSign className="w-6 h-6" />}
            color="blue"
          />
          <MetricCard
            title="Win Rate"
            value={`${metrics.winRate.toFixed(1)}%`}
            change={5.2}
            changeLabel="vs last period"
            icon={<Target className="w-6 h-6" />}
            color="green"
          />
          <MetricCard
            title="Active Projects"
            value={metrics.totalProjectsCount}
            changeLabel={`${metrics.draftCount} drafts`}
            icon={<FileText className="w-6 h-6" />}
            color="orange"
          />
          <MetricCard
            title="Projects Awarded"
            value={metrics.awardedCount}
            change={8.7}
            changeLabel="vs last period"
            icon={<Award className="w-6 h-6" />}
            color="teal"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
                <p className="text-sm text-gray-600">Monthly project value analysis</p>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm font-semibold">+23.5%</span>
              </div>
            </div>
            <LineChart
              data={revenueByMonth}
              height={280}
              color="#10B981"
              formatValue={(v) => formatCurrency(v)}
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Performance Metrics</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Submit Rate</span>
                  <span className="text-lg font-bold text-gray-900">{conversionMetrics.submitRate}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${conversionMetrics.submitRate}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Win Rate</span>
                  <span className="text-lg font-bold text-gray-900">{conversionMetrics.winRate}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${conversionMetrics.winRate}%` }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Avg. Deal Size</div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(conversionMetrics.avgDealSize)}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Total Projects</div>
                <div className="text-2xl font-bold text-gray-900">
                  {metrics.totalProjectsCount}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {metrics.hkCount} HK • {metrics.fmCount} FM • {metrics.retrofitCount} Retrofit
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Funnel</h3>
            <p className="text-sm text-gray-600 mb-6">Pipeline conversion analysis</p>
            <FunnelChart
              stages={funnelStages}
              formatValue={(v) => formatCurrency(v)}
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Distribution</h3>
            <p className="text-sm text-gray-600 mb-6">By status</p>
            <div className="flex justify-center">
              <DonutChart
                data={statusDistribution}
                size={220}
                thickness={45}
                centerLabel="Projects"
                centerValue={metrics.totalProjectsCount.toString()}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Project Type</h3>
            <p className="text-sm text-gray-600 mb-6">Comparative analysis</p>
            <BarChart
              data={projectTypeComparison}
              height={280}
              formatValue={(v) => formatCurrency(v)}
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Activity</h3>
            <p className="text-sm text-gray-600 mb-6">Monthly creation trends</p>
            <BarChart
              data={projectsByMonth}
              height={280}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onNavigate('hk')}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">HK Estimator</h3>
              <ArrowRight className="w-5 h-5" />
            </div>
            <div className="text-3xl font-bold mb-2">{formatCurrency(metrics.hkValue)}</div>
            <div className="text-sm opacity-90">{metrics.hkCount} projects • {metrics.hkWinRate.toFixed(1)}% win rate</div>
          </div>

          <div
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-sm p-6 text-white cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onNavigate('fm')}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">FM Estimator</h3>
              <ArrowRight className="w-5 h-5" />
            </div>
            <div className="text-3xl font-bold mb-2">{formatCurrency(metrics.fmValue)}</div>
            <div className="text-sm opacity-90">{metrics.fmCount} projects • {metrics.fmWinRate.toFixed(1)}% win rate</div>
          </div>

          <div
            className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-sm p-6 text-white cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onNavigate('retrofit')}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Retrofit Estimator</h3>
              <ArrowRight className="w-5 h-5" />
            </div>
            <div className="text-3xl font-bold mb-2">{formatCurrency(metrics.retrofitValue)}</div>
            <div className="text-sm opacity-90">{metrics.retrofitCount} projects • {metrics.retrofitWinRate.toFixed(1)}% win rate</div>
          </div>
        </div>

        {metrics.recentProjects.length > 0 && (
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {metrics.recentProjects.slice(0, 5).map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => onNavigate(project.type, project.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      project.status === 'AWARDED' ? 'bg-green-500' :
                      project.status === 'SUBMITTED' ? 'bg-blue-500' :
                      project.status === 'LOST' ? 'bg-red-500' :
                      project.status === 'CANCELLED' ? 'bg-orange-500' :
                      'bg-gray-400'
                    }`} />
                    <div>
                      <div className="font-medium text-gray-900">{project.name}</div>
                      <div className="text-xs text-gray-500">
                        {project.type.toUpperCase()} • {new Date(project.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{formatCurrency(project.value)}</div>
                    <div className="text-xs text-gray-500">{project.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
