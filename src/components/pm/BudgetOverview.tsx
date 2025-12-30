import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, CheckCircle2, Clock, FileText } from 'lucide-react';
import { getBudgetSummary, BudgetSummary } from '../../utils/budgetDatabase';
import { supabase } from '../../lib/supabase';
import { useOrganization } from '../../contexts/OrganizationContext';
import { formatCurrency } from '../../utils/currencyFormatter';

interface BudgetOverviewProps {
  projectId: string;
}

export function BudgetOverview({ projectId }: BudgetOverviewProps) {
  const { currentOrganization } = useOrganization();
  const currency = currentOrganization?.currency || 'AED';
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBudgetSummary();

    // Subscribe to realtime changes for budget_baselines
    const channel = supabase
      .channel(`budget-overview-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'budget_baselines',
          filter: `project_id=eq.${projectId}`
        },
        () => {
          loadBudgetSummary();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'actual_costs',
          filter: `project_id=eq.${projectId}`
        },
        () => {
          loadBudgetSummary();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const loadBudgetSummary = async () => {
    try {
      setLoading(true);
      const data = await getBudgetSummary(projectId);
      setSummary(data);
    } catch (error) {
      console.error('Error loading budget summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-slate-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
        <p className="text-slate-600">No budget data available. Create a budget baseline to get started.</p>
      </div>
    );
  }

  const variance = summary.remaining_budget;
  const variancePercent = (variance / summary.total_budget) * 100;
  const isOverBudget = variance < 0;
  const isNearLimit = variancePercent < 10 && variancePercent > 0;

  const formatAmount = (amount: number) => formatCurrency(amount, currency);

  const getStatusColor = () => {
    if (isOverBudget) return 'text-red-600 bg-red-50 border-red-200';
    if (isNearLimit) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getStatusIcon = () => {
    if (isOverBudget) return <AlertTriangle className="h-5 w-5" />;
    if (isNearLimit) return <Clock className="h-5 w-5" />;
    return <CheckCircle2 className="h-5 w-5" />;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
      <h2 className="text-xl font-semibold text-slate-900 mb-6">Budget Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Total Budget</span>
            <DollarSign className="h-5 w-5 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatAmount(summary.total_budget)}
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-600">Total Spent</span>
            <TrendingDown className="h-5 w-5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-900">
            {formatAmount(summary.total_spent)}
          </div>
          <div className="text-xs text-blue-600 mt-1">
            {summary.budget_utilization_percent.toFixed(1)}% utilized
          </div>
        </div>

        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-amber-600">Pending Review</span>
            <Clock className="h-5 w-5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-900">
            {formatAmount(summary.total_committed)}
          </div>
          <div className="text-xs text-amber-600 mt-1">
            Submitted for review
          </div>
        </div>

        {summary.total_draft > 0 && (
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">Draft</span>
              <FileText className="h-5 w-5 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {formatAmount(summary.total_draft)}
            </div>
            <div className="text-xs text-slate-600 mt-1">
              Not yet submitted
            </div>
          </div>
        )}

        <div className={`rounded-lg p-4 border ${getStatusColor()}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Remaining</span>
            {getStatusIcon()}
          </div>
          <div className="text-2xl font-bold">
            {formatAmount(Math.abs(variance))}
          </div>
          <div className="text-xs mt-1 flex items-center gap-1">
            {isOverBudget ? (
              <>
                <TrendingUp className="h-3 w-3" />
                <span>Over by {Math.abs(variancePercent).toFixed(1)}%</span>
              </>
            ) : (
              <>
                <TrendingDown className="h-3 w-3" />
                <span>{variancePercent.toFixed(1)}% remaining</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Budget by Category</h3>
          <div className="space-y-3">
            {summary.by_category.map((cat) => {
              const catUtilization = (cat.spent / cat.allocated) * 100;
              const catRemaining = cat.allocated - cat.spent - cat.committed;
              const isWarning = catUtilization > 90;
              const isDanger = catRemaining < 0;

              return (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{cat.category}</span>
                    <span className={`text-xs ${isDanger ? 'text-red-600' : isWarning ? 'text-orange-600' : 'text-slate-600'}`}>
                      {formatAmount(cat.spent)} / {formatAmount(cat.allocated)}
                    </span>
                  </div>
                  <div className="relative">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          isDanger
                            ? 'bg-red-500'
                            : isWarning
                            ? 'bg-orange-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(catUtilization, 100)}%` }}
                      />
                    </div>
                    {cat.committed > 0 && (
                      <div
                        className="absolute top-0 h-2 bg-amber-400 opacity-50"
                        style={{
                          left: `${Math.min(catUtilization, 100)}%`,
                          width: `${Math.min((cat.committed / cat.allocated) * 100, 100 - catUtilization)}%`
                        }}
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{catUtilization.toFixed(1)}% spent</span>
                    <div className="flex items-center gap-2">
                      {cat.committed > 0 && (
                        <span className="text-amber-600">
                          {formatAmount(cat.committed)} pending
                        </span>
                      )}
                      {cat.draft > 0 && (
                        <span className="text-slate-500">
                          {formatAmount(cat.draft)} draft
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Budget Health</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className={`p-2 rounded-lg ${getStatusColor()}`}>
                {getStatusIcon()}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-slate-900 mb-1">
                  {isOverBudget ? 'Over Budget' : isNearLimit ? 'Near Budget Limit' : 'On Track'}
                </h4>
                <p className="text-xs text-slate-600">
                  {isOverBudget
                    ? `Project is over budget by ${formatAmount(Math.abs(variance))}. Consider creating a change order.`
                    : isNearLimit
                    ? `Only ${formatAmount(variance)} remaining. Monitor spending closely.`
                    : `Project is within budget with ${formatAmount(variance)} remaining.`}
                </p>
              </div>
            </div>

            {summary.total_committed > 0 && (
              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-slate-900 mb-1">
                    Costs Pending Approval
                  </h4>
                  <p className="text-xs text-slate-600">
                    {formatAmount(summary.total_committed)} in costs awaiting approval. Review and approve to commit to budget.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <TrendingDown className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-slate-900 mb-1">
                  Burn Rate
                </h4>
                <p className="text-xs text-slate-600">
                  Currently utilizing {summary.budget_utilization_percent.toFixed(1)}% of total budget allocation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
