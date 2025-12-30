import { X, Lock, ArrowRight } from 'lucide-react';

interface LimitReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
  limitType: 'projects' | 'inquiries' | 'users';
  currentCount: number;
  maxCount: number;
}

export function LimitReachedModal({
  isOpen,
  onClose,
  limitType,
  currentCount,
  maxCount,
}: LimitReachedModalProps) {
  if (!isOpen) return null;

  const messages = {
    projects: {
      title: 'Project Limit Reached',
      description: `You've created ${currentCount} of ${maxCount} projects on the Free plan. Upgrade to Professional for unlimited projects.`,
      benefits: [
        'Unlimited projects across all estimators',
        'Advanced approval workflows',
        'Dashboard analytics',
        'Project comparison tools',
        'No watermarks on exports',
      ],
    },
    inquiries: {
      title: 'Monthly Inquiry Limit Reached',
      description: `You've created ${currentCount} of ${maxCount} inquiries this month. Upgrade to Professional for unlimited inquiries.`,
      benefits: [
        'Unlimited inquiries per month',
        'Advanced inquiry tracking',
        'Automated status updates',
        'Priority support',
        'Team collaboration features',
      ],
    },
    users: {
      title: 'User Limit Reached',
      description: `Free plan includes ${maxCount} user. Upgrade to Professional to invite your team.`,
      benefits: [
        'Up to 5 team members',
        'Role-based permissions',
        'Collaborative workflows',
        'Activity tracking',
        'Shared project access',
      ],
    },
  };

  const content = messages[limitType];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Lock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{content.title}</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-gray-600 mb-6">{content.description}</p>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Professional Plan includes:
            </h3>
            <ul className="space-y-2">
              {content.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <ArrowRight className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Maybe Later
            </button>
            <button
              onClick={() => {
                window.location.href = '/settings';
              }}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md font-medium"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}