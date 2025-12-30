import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { ProjectStatus, STATUS_LABELS, StatusHistoryEntry, VALID_TRANSITIONS } from '../types/projectStatus';
import { StatusBadge } from './StatusBadge';
import SubmissionDateModal from './SubmissionDateModal';

interface StatusChangeModalProps {
  projectName: string;
  currentStatus: ProjectStatus;
  statusHistory: StatusHistoryEntry[];
  isAdmin: boolean;
  onClose: () => void;
  onStatusChange: (
    newStatus: ProjectStatus,
    notes?: string,
    submissionData?: {
      submittedDate: string;
      expectedClientResponseDate?: string;
      submissionNotes?: string;
    }
  ) => Promise<void>;
}

export const StatusChangeModal: React.FC<StatusChangeModalProps> = ({
  projectName,
  currentStatus,
  statusHistory,
  isAdmin,
  onClose,
  onStatusChange,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);

  const availableStatuses = isAdmin
    ? (['DRAFT', 'SUBMITTED', 'PENDING_CLIENT_DECISION', 'AWARDED', 'LOST', 'CANCELLED'] as ProjectStatus[]).filter(
        (s) => s !== currentStatus
      )
    : VALID_TRANSITIONS[currentStatus];

  const handleSubmit = async () => {
    if (!selectedStatus) return;

    if (currentStatus === 'DRAFT' && selectedStatus === 'SUBMITTED') {
      setShowSubmissionModal(true);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onStatusChange(selectedStatus, notes);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmissionConfirm = async (submissionData: {
    submittedDate: string;
    expectedClientResponseDate?: string;
    submissionNotes?: string;
  }) => {
    if (!selectedStatus) return;

    setIsSubmitting(true);
    setError(null);
    setShowSubmissionModal(false);

    try {
      await onStatusChange(selectedStatus, notes, submissionData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Change Project Status</h2>
            <p className="text-sm text-gray-600 mt-1">{projectName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Status
            </label>
            <StatusBadge status={currentStatus} className="text-sm px-3 py-1.5" />
          </div>

          {availableStatuses.length > 0 ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Change To {isAdmin && <span className="text-xs text-gray-500">(Admin Override Enabled)</span>}
                </label>
                <div className="space-y-2">
                  {availableStatuses.map((status) => (
                    <label
                      key={status}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedStatus === status
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="status"
                        checked={selectedStatus === status}
                        onChange={() => setSelectedStatus(status)}
                        className="mr-3"
                      />
                      <StatusBadge status={status} />
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add any notes about this status change..."
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>No valid status transitions available from {STATUS_LABELS[currentStatus]}.</span>
            </div>
          )}

          {statusHistory.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Status History
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {statusHistory.slice().reverse().map((entry, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={entry.from_status} className="text-xs" />
                      <span className="text-gray-400">→</span>
                      <StatusBadge status={entry.to_status} className="text-xs" />
                    </div>
                    <div className="text-xs text-gray-600">
                      {entry.changed_by_email} • {formatDate(entry.changed_at)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedStatus || isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Changing...' : 'Change Status'}
          </button>
        </div>
      </div>

      {showSubmissionModal && (
        <SubmissionDateModal
          isOpen={showSubmissionModal}
          onClose={() => setShowSubmissionModal(false)}
          onConfirm={handleSubmissionConfirm}
          projectName={projectName}
        />
      )}
    </div>
  );
};
