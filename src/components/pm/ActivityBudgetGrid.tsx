import React, { useEffect, useState } from 'react';
import { AlertCircle, TrendingUp, DollarSign } from 'lucide-react';
import { getActualCosts } from '../../utils/budgetDatabase';

interface Activity {
  id: string;
  name: string;
  progress_percent: number;
  status: string;
}

interface ActivityBudgetGridProps {
  projectId: string;
  activities: Activity[];
  onAllocateBudget: (activityId: string) => void;
}

export function ActivityBudgetGrid({ projectId, activities, onAllocateBudget }: ActivityBudgetGridProps) {
  const [activityCosts, setActivityCosts] = useState<Record<string, { spent: number; committed: number; draft: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivityCosts();
  }, [projectId, activities]);

  const loadActivityCosts = async () => {
    try {
      setLoading(true);
      const allCosts = await getActualCosts(projectId);

      const costsByActivity: Record<string, { spent: number; committed: number; draft: number }> = {};

      activities.forEach(activity => {
        const activityReviewed = allCosts.filter(c => c.activity_id === activity.id && c.status === 'reviewed');
        const activityPending = allCosts.filter(c => c.activity_id === activity.id && c.status === 'pending_review');
        const activityDraft = allCosts.filter(c => c.activity_id === activity.id && c.status === 'draft');

        costsByActivity[activity.id] = {
          spent: activityReviewed.reduce((sum, c) => sum + Number(c.total_amount), 0),
          committed: activityPending.reduce((sum, c) => sum + Number(c.total_amount), 0),
          draft: activityDraft.reduce((sum, c) => sum + Number(c.total_amount), 0)
        };
      });

      setActivityCosts(costsByActivity);
    } catch (error) {
      console.error('Error loading activity costs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
        <p className="text-slate-600">No activities found. Create activities to track budget allocation.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-xl font-semibold text-slate-900">Activity Budget Status</h2>
        <p className="text-sm text-slate-600 mt-1">Track budget allocation and spending by activity</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Activity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Progress
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                Spent
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                Committed
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                Draft
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {activities.map((activity) => {
              const costs = activityCosts[activity.id] || { spent: 0, committed: 0, draft: 0 };
              const hasCosts = costs.spent > 0 || costs.committed > 0 || costs.draft > 0;

              return (
                <tr key={activity.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{activity.name}</span>
                      {hasCosts && (
                        <DollarSign className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                      {activity.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all"
                          style={{ width: `${activity.progress_percent}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-600 w-10 text-right">
                        {activity.progress_percent}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {costs.spent > 0 ? (
                      <span className="text-sm font-medium text-slate-900">
                        {formatCurrency(costs.spent)}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {costs.committed > 0 ? (
                      <span className="text-sm font-medium text-amber-600">
                        {formatCurrency(costs.committed)}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {costs.draft > 0 ? (
                      <span className="text-sm font-medium text-slate-500">
                        {formatCurrency(costs.draft)}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => onAllocateBudget(activity.id)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {activities.length === 0 && (
        <div className="p-12 text-center">
          <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No activities available</p>
          <p className="text-sm text-slate-500 mt-1">Create activities to start tracking budget</p>
        </div>
      )}
    </div>
  );
}
