import { Wrench, Sparkles } from 'lucide-react';
import { LaborLibrary } from '../components/LaborLibrary';

interface LaborLibraryManagerProps {
  isSidebarCollapsed: boolean;
}

export default function LaborLibraryManager({ isSidebarCollapsed }: LaborLibraryManagerProps) {
  return (
    <div
      className={`flex-1 transition-all duration-300 ${
        isSidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}
    >
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Wrench className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Labor Library</h1>
          </div>
          <p className="text-gray-600">
            Manage your organization's labor types. These are available across all projects.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-900 font-medium mb-1">Smart Skill-Based Matching</p>
            <p className="text-sm text-blue-800">
              Assign skills to each labor type for intelligent auto-assignment. The system matches assets
              to workers based on skills, not names - so different naming conventions work as long as skills are set.
            </p>
          </div>
        </div>

        <LaborLibrary />
      </div>
    </div>
  );
}
