import { X, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useUsageLimits } from '../hooks/useUsageLimits';

export function UpgradePromptBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { isOnFreePlan, getProjectsRemaining, getInquiriesRemaining } = useUsageLimits();

  if (dismissed || !isOnFreePlan()) {
    return null;
  }

  const projectsRemaining = getProjectsRemaining();
  const inquiriesRemaining = getInquiriesRemaining();

  const shouldShowWarning =
    (projectsRemaining !== null && projectsRemaining <= 1) ||
    (inquiriesRemaining !== null && inquiriesRemaining <= 2);

  if (!shouldShowWarning) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <Sparkles className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">
              {projectsRemaining === 0 && 'Project limit reached! '}
              {projectsRemaining === 1 && 'This is your last free project. '}
              {inquiriesRemaining !== null && inquiriesRemaining <= 2 && inquiriesRemaining > 0 &&
                `Only ${inquiriesRemaining} inquiries left this month. `}
              {inquiriesRemaining === 0 && 'Monthly inquiry limit reached. '}
              <span className="underline cursor-pointer hover:text-blue-100" onClick={() => {
                window.location.href = '/settings';
              }}>
                Upgrade to Professional
              </span>
              {' '}for unlimited projects, inquiries, and more features.
            </p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="ml-4 p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}