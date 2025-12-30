import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface CostDeletionModalProps {
  costId: string;
  costDescription: string;
  costStatus: string;
  requireReason: boolean;
  onConfirm: (reason?: string) => Promise<void>;
  onClose: () => void;
}

export function CostDeletionModal({
  costId,
  costDescription,
  costStatus,
  requireReason,
  onConfirm,
  onClose
}: CostDeletionModalProps) {
  const [reason, setReason] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (requireReason && !reason.trim()) {
      setError('Deletion reason is required');
      return;
    }

    try {
      setDeleting(true);
      setError('');
      await onConfirm(reason.trim() || undefined);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete cost');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Delete Cost Entry</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              Are you sure you want to delete this cost entry? This action cannot be undone.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Cost Description
            </label>
            <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-200">
              {costDescription}
            </p>
          </div>

          {requireReason && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Reason for Deletion <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setError('');
                }}
                placeholder="Explain why this cost is being deleted..."
                rows={4}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                This reason will be logged in the audit trail for compliance.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t bg-slate-50">
          <button
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={deleting || (requireReason && !reason.trim())}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            <AlertTriangle className="w-4 h-4" />
            {deleting ? 'Deleting...' : 'Delete Cost'}
          </button>
        </div>
      </div>
    </div>
  );
}
