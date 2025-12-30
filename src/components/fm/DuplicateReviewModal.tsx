import { useState } from 'react';
import { X, AlertTriangle, Check, Eye, ArrowRight } from 'lucide-react';
import type { DuplicateMatch } from '../../utils/assetDuplicateDetection';

interface DuplicateReviewModalProps {
  isOpen: boolean;
  duplicates: DuplicateMatch[];
  onClose: () => void;
  onResolve: (decisions: Map<number, 'skip' | 'import'>) => void;
}

export default function DuplicateReviewModal({
  isOpen,
  duplicates,
  onClose,
  onResolve
}: DuplicateReviewModalProps) {
  const [decisions, setDecisions] = useState<Map<number, 'skip' | 'import'>>(
    new Map(duplicates.map(d => [d.newAssetIndex, 'skip']))
  );
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleDecision = (index: number, decision: 'skip' | 'import') => {
    const newDecisions = new Map(decisions);
    newDecisions.set(index, decision);
    setDecisions(newDecisions);
  };

  const handleProceed = () => {
    onResolve(decisions);
  };

  const getMatchTypeLabel = (matchType: string) => {
    switch (matchType) {
      case 'exact':
        return { label: 'Exact Match', color: 'bg-red-100 text-red-800 border-red-200' };
      case 'standard_code':
        return { label: 'Code Match', color: 'bg-red-100 text-red-800 border-red-200' };
      case 'fuzzy':
        return { label: 'Similar Match', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
      default:
        return { label: 'Unknown', color: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
  };

  const skipCount = Array.from(decisions.values()).filter(d => d === 'skip').length;
  const importCount = duplicates.length - skipCount;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Potential Duplicates Found</h2>
              <p className="text-sm text-gray-600 mt-1">
                Review {duplicates.length} potential duplicate{duplicates.length !== 1 ? 's' : ''} before importing
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-900 font-medium">
                  These assets match or are very similar to existing assets in your library.
                </p>
                <p className="text-sm text-yellow-800 mt-1">
                  Choose to skip duplicates or import them anyway if they are truly different assets.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {duplicates.map((duplicate, index) => {
              const isExpanded = expandedIndex === index;
              const decision = decisions.get(duplicate.newAssetIndex);
              const matchInfo = getMatchTypeLabel(duplicate.matchType);

              return (
                <div
                  key={index}
                  className={`border-2 rounded-lg overflow-hidden transition-all ${
                    decision === 'skip' ? 'border-gray-300 bg-gray-50' : 'border-blue-300 bg-blue-50'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`text-xs font-semibold px-2 py-1 rounded border ${matchInfo.color}`}>
                            {matchInfo.label}
                          </span>
                          <span className="text-xs font-medium text-gray-600">
                            {duplicate.similarity}% similar
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white p-3 rounded-lg border border-gray-200">
                            <div className="text-xs font-semibold text-gray-500 mb-2">NEW ASSET</div>
                            <div className="font-semibold text-gray-900 mb-1">
                              {duplicate.newAsset.asset.asset_name}
                            </div>
                            <div className="text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Category:</span>
                                <span>{duplicate.newAsset.asset.category}</span>
                              </div>
                              {duplicate.newAsset.asset.standard_code && (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Code:</span>
                                  <span>{duplicate.newAsset.asset.standard_code}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Tasks:</span>
                                <span>{duplicate.newAsset.tasks.length}</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white p-3 rounded-lg border border-gray-200">
                            <div className="text-xs font-semibold text-gray-500 mb-2">EXISTING ASSET</div>
                            <div className="font-semibold text-gray-900 mb-1">
                              {duplicate.existingAsset.asset_name}
                            </div>
                            <div className="text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Category:</span>
                                <span>{duplicate.existingAsset.category}</span>
                              </div>
                              {duplicate.existingAsset.standard_code && (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Code:</span>
                                  <span>{duplicate.existingAsset.standard_code}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">New Asset Details</h4>
                                {duplicate.newAsset.asset.description && (
                                  <p className="text-sm text-gray-600 mb-2">
                                    {duplicate.newAsset.asset.description}
                                  </p>
                                )}
                                {duplicate.newAsset.tasks.length > 0 && (
                                  <div>
                                    <div className="text-xs font-semibold text-gray-500 mb-1">PPM TASKS:</div>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                      {duplicate.newAsset.tasks.map((task, taskIdx) => (
                                        <li key={taskIdx}>
                                          • {task.task_name} - {task.frequency} ({task.hours_per_task}h)
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Existing Asset Details</h4>
                                {duplicate.existingAsset.description && (
                                  <p className="text-sm text-gray-600">
                                    {duplicate.existingAsset.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => setExpandedIndex(isExpanded ? null : index)}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          {isExpanded ? 'Hide' : 'View'}
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700">Action:</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDecision(duplicate.newAssetIndex, 'skip')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            decision === 'skip'
                              ? 'bg-gray-600 text-white'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {decision === 'skip' && <Check className="w-4 h-4" />}
                            Skip (Use Existing)
                          </span>
                        </button>
                        <button
                          onClick={() => handleDecision(duplicate.newAssetIndex, 'import')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            decision === 'import'
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {decision === 'import' && <Check className="w-4 h-4" />}
                            Import Anyway
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{skipCount}</span> to skip, <span className="font-medium">{importCount}</span> to import
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleProceed}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Proceed
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
