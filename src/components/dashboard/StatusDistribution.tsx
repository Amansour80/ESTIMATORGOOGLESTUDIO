interface StatusDistributionProps {
  draft: number;
  submitted: number;
  awarded: number;
  lost: number;
  cancelled: number;
}

export function StatusDistribution({
  draft,
  submitted,
  awarded,
  lost,
  cancelled,
}: StatusDistributionProps) {
  const total = draft + submitted + awarded + lost + cancelled;

  const statuses = [
    { label: 'Draft', count: draft, color: 'bg-gray-400', percentage: total > 0 ? (draft / total) * 100 : 0 },
    { label: 'Submitted', count: submitted, color: 'bg-amber-500', percentage: total > 0 ? (submitted / total) * 100 : 0 },
    { label: 'Awarded', count: awarded, color: 'bg-green-500', percentage: total > 0 ? (awarded / total) * 100 : 0 },
    { label: 'Lost', count: lost, color: 'bg-red-500', percentage: total > 0 ? (lost / total) * 100 : 0 },
    { label: 'Cancelled', count: cancelled, color: 'bg-slate-600', percentage: total > 0 ? (cancelled / total) * 100 : 0 },
  ].filter(s => s.count > 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Projects by Status</h3>

      <div className="flex items-center h-8 rounded-lg overflow-hidden mb-6">
        {statuses.map((status, index) => (
          <div
            key={status.label}
            className={`${status.color} h-full flex items-center justify-center text-white text-xs font-medium transition-all hover:opacity-80`}
            style={{ width: `${status.percentage}%` }}
            title={`${status.label}: ${status.count} (${status.percentage.toFixed(1)}%)`}
          >
            {status.percentage > 8 && <span>{status.count}</span>}
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {statuses.map((status) => (
          <div key={status.label} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded ${status.color}`}></div>
              <span className="text-sm text-gray-700">{status.label}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-900">{status.count}</span>
              <span className="text-xs text-gray-500 w-12 text-right">
                {status.percentage.toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {total === 0 && (
        <p className="text-center text-gray-500 py-8">No projects yet</p>
      )}
    </div>
  );
}
