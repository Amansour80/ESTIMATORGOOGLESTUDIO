import { X, Maximize2, Minimize2, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import EnhancedGanttChart from './EnhancedGanttChart';

interface Activity {
  id: string;
  name: string;
  description: string;
  duration_days: number;
  start_date: string | null;
  end_date: string | null;
  is_date_override: boolean;
  override_warning: string | null;
  progress_percent: number;
  status: string;
  assignee_type: string | null;
  assignee_user_id: string | null;
  created_at: string;
}

interface Dependency {
  id: string;
  predecessor_activity_id: string;
  successor_activity_id: string;
  type: string;
}

interface GanttChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities: Activity[];
  dependencies: Dependency[];
  onEdit: (activity: Activity) => void;
  onAddActivity: () => void;
}

export default function GanttChartModal({ isOpen, onClose, activities, dependencies, onEdit, onAddActivity }: GanttChartModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isFullscreen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isFullscreen, onClose]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`bg-white rounded-lg shadow-2xl flex flex-col ${
        isFullscreen ? 'w-screen h-screen' : 'w-[95vw] h-[90vh] max-w-[1800px]'
      }`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="text-xl font-semibold text-gray-900">Project Gantt Chart</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onAddActivity}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
              title="Add Activity"
            >
              <Plus className="w-5 h-5" />
              Add Activity
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden p-4 bg-gray-50">
          <div className="h-full bg-white rounded-lg shadow-sm">
            <EnhancedGanttChart
              activities={activities}
              dependencies={dependencies}
              onEdit={onEdit}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
