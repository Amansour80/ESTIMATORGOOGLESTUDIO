import React, { useState } from 'react';
import { X, Calendar, FileText } from 'lucide-react';

interface SubmissionDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    submittedDate: string;
    expectedClientResponseDate?: string;
    submissionNotes?: string;
  }) => void;
  projectName: string;
}

export default function SubmissionDateModal({
  isOpen,
  onClose,
  onConfirm,
  projectName,
}: SubmissionDateModalProps) {
  const [submittedDate, setSubmittedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [expectedClientResponseDate, setExpectedClientResponseDate] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      submittedDate,
      expectedClientResponseDate: expectedClientResponseDate || undefined,
      submissionNotes: submissionNotes || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            Confirm Submission
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <span className="font-medium">Project:</span> {projectName}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Submission Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={submittedDate}
              onChange={(e) => setSubmittedDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              When was this project submitted to the client?
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Expected Client Response Date
            </label>
            <input
              type="date"
              value={expectedClientResponseDate}
              onChange={(e) => setExpectedClientResponseDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              When do you expect the client to make a decision?
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Submission Notes
            </label>
            <textarea
              value={submissionNotes}
              onChange={(e) => setSubmissionNotes(e.target.value)}
              rows={3}
              placeholder="Add any relevant notes about this submission..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Confirm Submission
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
