import React, { useEffect, useState } from 'react';
import { TrendingUp, Users, Target, DollarSign, Clock, AlertCircle } from 'lucide-react';
import { KPICard } from './KPICard';
import { LineChart } from './LineChart';
import { DonutChart } from './DonutChart';
import { FunnelChart } from './FunnelChart';
import { calculateBDMetrics, BDMetrics } from '../../utils/bdDashboardMetrics';
import { useOrganization } from '../../contexts/OrganizationContext';

export function BDDashboardView() {
  const { organization } = useOrganization();
  const [metrics, setMetrics] = useState<BDMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (organization?.id) {
      loadMetrics();
    }
  }, [organization?.id]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const data = await calculateBDMetrics(organization!.id);
      setMetrics(data);
    } catch (error) {
      console.error('Error loading BD metrics:', error);
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
        <KPICard
          title="Total Inquiries"
          value={metrics.totalInquiries}
          icon={<Users className="w-5 h-5" />}
          color="blue"
        />
        <KPICard
          title="Conversion Rate"
          value={metrics.conversionRate}
          isPercentage
          icon={<Target className="w-5 h-5" />}
          color="green"
          subtitle={`${metrics.convertedInquiries} converted`}
        />
        <KPICard
          title="Pipeline Value"
          value={metrics.estimatedPipelineValue}
          isCurrency
          icon={<DollarSign className="w-5 h-5" />}
          color="teal"
          subtitle="Active inquiries"
        />
        <KPICard
          title="Avg Response Time"
          value={metrics.averageResponseTime}
          icon={<Clock className="w-5 h-5" />}
          color="orange"
          subtitle="Days to respond"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="New Inquiries"
          value={metrics.newInquiries}
          icon={<AlertCircle className="w-5 h-5" />}
          color="blue"
        />
        <KPICard
          title="In Review"
          value={metrics.inReviewInquiries}
          icon={<Users className="w-5 h-5" />}
          color="orange"
        />
        <KPICard
          title="Converted Value"
          value={metrics.convertedValue}
          isCurrency
          icon={<TrendingUp className="w-5 h-5" />}
          color="green"
        />
        <KPICard
          title="Avg Conversion Time"
          value={metrics.averageConversionTime}
          icon={<Clock className="w-5 h-5" />}
          color="gray"
          subtitle="Days to convert"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Monthly Inquiry Trend
          </h3>
          <LineChart
            data={metrics.monthlyInquiryTrend.map(d => ({
              label: d.month,
              value: d.count
            }))}
            color="#3b82f6"
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Inquiry Status Distribution
          </h3>
          <DonutChart
            data={metrics.inquiryStatusDistribution.map(d => ({
              label: d.status.charAt(0).toUpperCase() + d.status.slice(1).replace('_', ' '),
              value: d.count
            }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Conversion by Project Type
          </h3>
          <div className="space-y-4">
            {metrics.conversionByProjectType.map((item) => (
              <div key={item.type}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{item.type}</span>
                  <span className="text-sm text-gray-600">
                    {item.converted}/{item.total} ({item.rate.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${item.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top Clients by Inquiries
          </h3>
          <div className="space-y-3">
            {metrics.topClientsByInquiries.slice(0, 5).map((client, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{client.clientName}</p>
                  <p className="text-xs text-gray-500">{client.count} inquiries</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {(client.totalValue / 1000).toFixed(0)}K
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {metrics.lostInquiryReasons.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Lost Inquiry Reasons
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.lostInquiryReasons.map((reason, idx) => (
              <div key={idx} className="bg-red-50 rounded-lg p-4 border border-red-100">
                <p className="text-sm font-medium text-gray-900 mb-1">{reason.reason}</p>
                <p className="text-2xl font-bold text-red-600">{reason.count}</p>
                <p className="text-xs text-gray-600">inquiries</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Inquiry Conversion Funnel
        </h3>
        <FunnelChart
          stages={[
            {
              label: 'Total Inquiries',
              value: metrics.estimatedPipelineValue,
              count: metrics.totalInquiries,
              color: '#3b82f6'
            },
            {
              label: 'In Review',
              value: metrics.estimatedPipelineValue * ((metrics.inReviewInquiries + metrics.convertedInquiries) / Math.max(metrics.totalInquiries, 1)),
              count: metrics.inReviewInquiries + metrics.convertedInquiries,
              color: '#f59e0b'
            },
            {
              label: 'Converted',
              value: metrics.convertedValue,
              count: metrics.convertedInquiries,
              color: '#10b981'
            }
          ]}
        />
      </div>
    </div>
  );
}
