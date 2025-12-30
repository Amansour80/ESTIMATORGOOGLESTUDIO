import { useState, useRef, useEffect, useMemo } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Edit3,
  Save,
  X,
  Calendar,
  Clock,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Target,
  Layers,
  LayoutGrid,
  Eye
} from 'lucide-react';
import { getActivityStatusBarColor } from '../../utils/statusColors';
import { supabase } from '../../lib/supabase';

interface Activity {
  id: string;
  name: string;
  duration_days: number;
  start_date: string | null;
  end_date: string | null;
  is_date_override: boolean;
  override_warning: string | null;
  progress_percent: number;
  status: string;
  assignee_type?: string | null;
  assignee_user_id?: string | null;
  description?: string;
}

interface Dependency {
  id: string;
  predecessor_activity_id: string;
  successor_activity_id: string;
  type: string;
}

interface EnhancedGanttChartProps {
  activities: Activity[];
  dependencies: Dependency[];
  onEdit: (activity: Activity) => void;
}

type TimeScale = 'day' | 'week' | 'month';
type ViewDensity = 'comfortable' | 'compact';

interface PendingChange {
  activityId: string;
  start_date: string;
  end_date: string;
  originalStart: string;
  originalEnd: string;
}

interface ActivityOrder {
  activityId: string;
  order: number;
}

export default function EnhancedGanttChart({ activities: propActivities, dependencies, onEdit }: EnhancedGanttChartProps) {
  const [editMode, setEditMode] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [timeScale, setTimeScale] = useState<TimeScale>('day');
  const [viewDensity, setViewDensity] = useState<ViewDensity>('comfortable');
  const [showFilters, setShowFilters] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  const [pendingChanges, setPendingChanges] = useState<Record<string, PendingChange>>({});
  const [activityOrder, setActivityOrder] = useState<ActivityOrder[]>([]);

  const [draggedActivity, setDraggedActivity] = useState<string | null>(null);
  const [resizingActivity, setResizingActivity] = useState<{ id: string; edge: 'left' | 'right' } | null>(null);
  const [verticalDragActivity, setVerticalDragActivity] = useState<string | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [hoveredActivity, setHoveredActivity] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const chartRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(0);
  const dragStartX = useRef<number>(0);
  const dragStartY = useRef<number>(0);
  const dragStartDates = useRef<{ start: Date; end: Date } | null>(null);

  useEffect(() => {
    if (propActivities.length > 0 && activityOrder.length === 0) {
      setActivityOrder(propActivities.map((a, idx) => ({ activityId: a.id, order: idx })));
    }
  }, [propActivities]);

  useEffect(() => {
    const updateWidth = () => {
      if (chartRef.current) {
        const rect = chartRef.current.getBoundingClientRect();
        setChartWidth(rect.width - 300);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const orderedActivities = useMemo(() => {
    if (activityOrder.length === 0) return propActivities;

    const orderMap = new Map(activityOrder.map(o => [o.activityId, o.order]));
    return [...propActivities].sort((a, b) => {
      const orderA = orderMap.get(a.id) ?? 999999;
      const orderB = orderMap.get(b.id) ?? 999999;
      return orderA - orderB;
    });
  }, [propActivities, activityOrder]);

  const filteredActivities = useMemo(() => {
    let filtered = orderedActivities.filter(a => a.start_date && a.end_date);
    if (statusFilter.length > 0) {
      filtered = filtered.filter(a => statusFilter.includes(a.status));
    }
    return filtered;
  }, [orderedActivities, statusFilter]);

  const activities = filteredActivities;

  const getActivityWithChanges = (activity: Activity) => {
    const change = pendingChanges[activity.id];
    if (change) {
      return {
        ...activity,
        start_date: change.start_date,
        end_date: change.end_date
      };
    }
    return activity;
  };

  const criticalPath = useMemo(() => {
    return new Set<string>();
  }, [activities, dependencies]);

  const getDateRange = () => {
    if (activities.length === 0) return { start: new Date(), end: new Date() };

    const dates = activities.flatMap(a => {
      const withChanges = getActivityWithChanges(a);
      return [new Date(withChanges.start_date), new Date(withChanges.end_date)];
    });

    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 7);

    return { start: minDate, end: maxDate };
  };

  const { start: rangeStart, end: rangeEnd } = getDateRange();
  const totalDays = Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24));

  const baseDayWidth = timeScale === 'day' ? 40 : timeScale === 'week' ? 25 : 15;
  const dayWidth = baseDayWidth * zoom;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getTimelineHeaders = () => {
    const headers: { label: string; width: number; isToday?: boolean; isWeekend?: boolean }[] = [];
    let currentDate = new Date(rangeStart);

    if (timeScale === 'day') {
      while (currentDate <= rangeEnd) {
        const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
        const isToday = currentDate.getTime() === today.getTime();
        headers.push({
          label: currentDate.getDate().toString(),
          width: dayWidth,
          isToday,
          isWeekend
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (timeScale === 'week') {
      while (currentDate <= rangeEnd) {
        const weekStart = new Date(currentDate);
        const weekEnd = new Date(currentDate);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const daysInView = Math.min(7, Math.ceil((rangeEnd.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        headers.push({
          label: `W${getWeekNumber(currentDate)}`,
          width: daysInView * dayWidth
        });
        currentDate.setDate(currentDate.getDate() + 7);
      }
    } else {
      while (currentDate <= rangeEnd) {
        const monthStart = new Date(currentDate);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const endDate = monthEnd > rangeEnd ? rangeEnd : monthEnd;
        const daysInMonth = Math.ceil((endDate.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        headers.push({
          label: monthStart.toLocaleDateString('en-US', { month: 'short' }),
          width: daysInMonth * dayWidth
        });
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      }
    }

    return headers;
  };

  function getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  const getBarPosition = (activity: Activity) => {
    const withChanges = getActivityWithChanges(activity);
    const start = new Date(withChanges.start_date);
    const end = new Date(withChanges.end_date);

    const leftOffset = Math.max(0, (start.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return {
      leftPx: leftOffset * dayWidth,
      widthPx: duration * dayWidth,
      startDate: start,
      endDate: end
    };
  };

  const handleMouseDown = (e: React.MouseEvent, activityId: string, edge?: 'left' | 'right') => {
    if (!editMode) return;
    e.stopPropagation();
    e.preventDefault();

    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;

    const withChanges = getActivityWithChanges(activity);
    dragStartX.current = e.clientX;
    dragStartDates.current = {
      start: new Date(withChanges.start_date),
      end: new Date(withChanges.end_date)
    };

    if (edge) {
      setResizingActivity({ id: activityId, edge });
    } else {
      setDraggedActivity(activityId);
    }
    setSelectedActivity(activityId);
  };

  const handleVerticalDragStart = (e: React.MouseEvent, activityId: string) => {
    if (!editMode) return;
    e.stopPropagation();
    dragStartY.current = e.clientY;
    setVerticalDragActivity(activityId);
    setSelectedActivity(activityId);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (verticalDragActivity) {
      const currentIndex = activities.findIndex(a => a.id === verticalDragActivity);
      if (currentIndex === -1) return;

      const deltaY = e.clientY - dragStartY.current;
      const rowHeight = viewDensity === 'comfortable' ? 64 : 48;
      const rowsMoved = Math.round(deltaY / rowHeight);

      if (rowsMoved !== 0) {
        const newIndex = Math.max(0, Math.min(activities.length - 1, currentIndex + rowsMoved));
        setDropTargetIndex(newIndex);
      }
      return;
    }

    if (!draggedActivity && !resizingActivity) return;
    if (!dragStartDates.current) return;

    const deltaX = e.clientX - dragStartX.current;
    const deltaDays = Math.round(deltaX / dayWidth);

    if (deltaDays === 0) return;

    const activityId = draggedActivity || resizingActivity?.id;
    if (!activityId) return;

    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;

    let newStartDate = new Date(dragStartDates.current.start);
    let newEndDate = new Date(dragStartDates.current.end);

    if (draggedActivity) {
      newStartDate.setDate(newStartDate.getDate() + deltaDays);
      newEndDate.setDate(newEndDate.getDate() + deltaDays);
    } else if (resizingActivity) {
      if (resizingActivity.edge === 'left') {
        newStartDate.setDate(newStartDate.getDate() + deltaDays);
        if (newStartDate >= newEndDate) return;
      } else {
        newEndDate.setDate(newEndDate.getDate() + deltaDays);
        if (newEndDate <= newStartDate) return;
      }
    }

    setPendingChanges(prev => ({
      ...prev,
      [activityId]: {
        activityId,
        start_date: newStartDate.toISOString().split('T')[0],
        end_date: newEndDate.toISOString().split('T')[0],
        originalStart: activity.start_date,
        originalEnd: activity.end_date
      }
    }));
  };

  const handleMouseUp = () => {
    if (verticalDragActivity && dropTargetIndex !== null) {
      const currentIndex = activities.findIndex(a => a.id === verticalDragActivity);
      if (currentIndex !== dropTargetIndex && currentIndex !== -1) {
        const newOrder = [...activityOrder];
        const [movedItem] = newOrder.splice(currentIndex, 1);
        newOrder.splice(dropTargetIndex, 0, movedItem);

        newOrder.forEach((item, idx) => {
          item.order = idx;
        });

        setActivityOrder(newOrder);
      }
    }

    setDraggedActivity(null);
    setResizingActivity(null);
    setVerticalDragActivity(null);
    setDropTargetIndex(null);
    dragStartDates.current = null;
  };

  useEffect(() => {
    if (draggedActivity || resizingActivity || verticalDragActivity) {
      const cursor = verticalDragActivity ? 'ns-resize' : draggedActivity ? 'grabbing' : 'ew-resize';
      document.body.style.cursor = cursor;
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.body.style.cursor = 'default';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedActivity, resizingActivity, verticalDragActivity, dayWidth, dropTargetIndex]);

  useEffect(() => {
    setPendingChanges(prev => {
      const newPending = { ...prev };
      let hasChanges = false;

      Object.keys(newPending).forEach(activityId => {
        const activity = propActivities.find(a => a.id === activityId);
        if (activity) {
          const pendingStart = newPending[activityId].start_date;
          const pendingEnd = newPending[activityId].end_date;

          if (activity.start_date === pendingStart && activity.end_date === pendingEnd) {
            delete newPending[activityId];
            hasChanges = true;
          }
        }
      });

      return hasChanges ? newPending : prev;
    });
  }, [propActivities]);

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      const updates = Object.values(pendingChanges);

      for (const change of updates) {
        const activity = activities.find(a => a.id === change.activityId);
        if (!activity) continue;

        const startDate = new Date(change.start_date);
        const endDate = new Date(change.end_date);
        const duration_days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        const { data, error } = await supabase
          .from('project_activities')
          .update({
            start_date: change.start_date,
            end_date: change.end_date,
            duration_days: duration_days,
            is_date_override: true
          })
          .eq('id', change.activityId)
          .select();

        if (error) throw error;

        if (!data || data.length === 0) {
          throw new Error('Update was blocked. You may not have permission to edit this activity.');
        }
      }

      setPendingChanges({});
      setEditMode(false);
      alert('Changes saved successfully!');
    } catch (error) {
      console.error('Error saving changes:', error);
      alert(`Failed to save changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelChanges = () => {
    setPendingChanges({});
    setEditMode(false);
  };

  const renderDependencyLines = () => {
    if (!chartWidth) return null;

    return dependencies.map(dep => {
      const predecessorIdx = activities.findIndex(a => a.id === dep.predecessor_activity_id);
      const successorIdx = activities.findIndex(a => a.id === dep.successor_activity_id);

      if (predecessorIdx === -1 || successorIdx === -1) return null;

      const predecessor = activities[predecessorIdx];
      const successor = activities[successorIdx];
      const successorPos = getBarPosition(successor);
      const predecessorPos = getBarPosition(predecessor);

      const rowHeight = viewDensity === 'comfortable' ? 64 : 48;
      const leftPadding = 300;

      // Task bars are h-10 (40px) positioned 8px from top of row
      const barTopOffset = 8;
      const barHeight = 40;
      const barCenter = barTopOffset + barHeight / 2; // Center of the task bar within the row

      // CRITICAL: SVG is positioned at (0,0) relative to the gantt content area (activity rows)
      // NOT relative to the entire chart including headers
      // fromY MUST use predecessor's row, toY MUST use successor's row
      // Arrow starts FROM the predecessor (source) and goes TO the successor (target)
      const fromY = predecessorIdx * rowHeight + barCenter;  // Start at predecessor's Y level
      const toY = successorIdx * rowHeight + barCenter;      // End at successor's Y level

      // Calculate X positions based on dependency type
      // fromX = X coordinate on PREDECESSOR bar (source of arrow)
      // toX = X coordinate on SUCCESSOR bar (target of arrow)
      let fromX: number;
      let toX: number;

      switch (dep.type) {
        case 'FS': // Finish-to-Start: Arrow FROM end of PREDECESSOR TO start of SUCCESSOR
          fromX = leftPadding + predecessorPos.leftPx + predecessorPos.widthPx - dayWidth;  // End of predecessor bar
          toX = leftPadding + successorPos.leftPx;                                           // Start of successor bar
          break;
        case 'SS': // Start-to-Start: Arrow FROM start of PREDECESSOR TO start of SUCCESSOR
          fromX = leftPadding + predecessorPos.leftPx;                                       // Start of predecessor bar
          toX = leftPadding + successorPos.leftPx;                                           // Start of successor bar
          break;
        case 'FF': // Finish-to-Finish: Arrow FROM end of PREDECESSOR TO end of SUCCESSOR
          fromX = leftPadding + predecessorPos.leftPx + predecessorPos.widthPx - dayWidth;  // End of predecessor bar
          toX = leftPadding + successorPos.leftPx + successorPos.widthPx - dayWidth;        // End of successor bar
          break;
        case 'SF': // Start-to-Finish: Arrow FROM start of PREDECESSOR TO end of SUCCESSOR
          fromX = leftPadding + predecessorPos.leftPx;                                       // Start of predecessor bar
          toX = leftPadding + successorPos.leftPx + successorPos.widthPx - dayWidth;        // End of successor bar
          break;
        default:   // Default to Finish-to-Start
          fromX = leftPadding + predecessorPos.leftPx + predecessorPos.widthPx - dayWidth;  // End of predecessor bar
          toX = leftPadding + successorPos.leftPx;                                           // Start of successor bar
      }

      const isCritical = criticalPath.has(dep.predecessor_activity_id) && criticalPath.has(dep.successor_activity_id);
      const hasConflict = checkDependencyConflict(dep, predecessor, successor);

      const horizontalOffset = 20;
      let path: string;

      // Path always starts at (fromX, fromY) on PREDECESSOR and ends at (toX, toY) on SUCCESSOR
      if (toY > fromY) { // Arrow going DOWN: predecessor above successor
        path = `M ${fromX} ${fromY}
                L ${fromX + horizontalOffset} ${fromY}
                L ${fromX + horizontalOffset} ${fromY + (toY - fromY) / 2}
                L ${toX - horizontalOffset} ${fromY + (toY - fromY) / 2}
                L ${toX - horizontalOffset} ${toY}
                L ${toX} ${toY}`;
      } else { // Arrow going UP: predecessor below successor
        path = `M ${fromX} ${fromY}
                L ${fromX + horizontalOffset} ${fromY}
                L ${fromX + horizontalOffset} ${fromY - Math.abs(toY - fromY) / 2}
                L ${toX - horizontalOffset} ${fromY - Math.abs(toY - fromY) / 2}
                L ${toX - horizontalOffset} ${toY}
                L ${toX} ${toY}`;
      }

      return (
        <g key={dep.id}>
          <path
            d={path}
            stroke={hasConflict ? '#ef4444' : isCritical ? '#f59e0b' : '#3b82f6'}
            strokeWidth={isCritical ? '3' : '2'}
            fill="none"
            markerEnd={`url(#arrow-${hasConflict ? 'error' : isCritical ? 'warning' : 'normal'})`}
            opacity={hasConflict ? '0.9' : '0.7'}
            className="transition-opacity hover:opacity-100"
          />
        </g>
      );
    });
  };

  function checkDependencyConflict(dep: Dependency, predecessor: Activity, successor: Activity): boolean {
    const predWithChanges = getActivityWithChanges(predecessor);
    const succWithChanges = getActivityWithChanges(successor);

    const predStart = new Date(predWithChanges.start_date);
    const predEnd = new Date(predWithChanges.end_date);
    const succStart = new Date(succWithChanges.start_date);
    const succEnd = new Date(succWithChanges.end_date);

    switch (dep.type) {
      case 'FS':
        return succStart < predEnd;
      case 'SS':
        return succStart < predStart;
      case 'FF':
        return succEnd < predEnd;
      case 'SF':
        return succEnd < predStart;
      default:
        return false;
    }
  }

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.3));
  const handleZoomFit = () => setZoom(1);

  const toggleStatusFilter = (status: string) => {
    setStatusFilter(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const hasChanges = Object.keys(pendingChanges).length > 0;
  const hasConflicts = dependencies.some(dep => {
    const pred = activities.find(a => a.id === dep.predecessor_activity_id);
    const succ = activities.find(a => a.id === dep.successor_activity_id);
    return pred && succ && checkDependencyConflict(dep, pred, succ);
  });

  const timelineHeaders = getTimelineHeaders();
  const rowHeight = viewDensity === 'comfortable' ? 64 : 48;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-gray-700" />
              <h3 className="text-lg font-semibold text-gray-900">Gantt Chart</h3>
            </div>

            {editMode && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                <Edit3 className="w-4 h-4" />
                Edit Mode
                {hasChanges && (
                  <span className="ml-1 px-2 py-0.5 bg-blue-200 rounded-full text-xs">
                    {Object.keys(pendingChanges).length} changes
                  </span>
                )}
              </div>
            )}

            {hasConflicts && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-800 rounded-lg text-sm font-medium">
                <AlertTriangle className="w-4 h-4" />
                Dependency conflicts detected
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Edit3 className="w-4 h-4" />
                Edit Schedule
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancelChanges}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={!hasChanges || saving}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setTimeScale('day')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                timeScale === 'day' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setTimeScale('week')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                timeScale === 'week' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setTimeScale('month')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                timeScale === 'month' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Month
            </button>
          </div>

          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm">
            <button onClick={handleZoomOut} className="p-1 rounded hover:bg-gray-100 transition-colors">
              <ZoomOut className="w-4 h-4 text-gray-600" />
            </button>
            <input
              type="range"
              min="0.3"
              max="2.5"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-24 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xs text-gray-600 w-12 text-center font-medium">{Math.round(zoom * 100)}%</span>
            <button onClick={handleZoomIn} className="p-1 rounded hover:bg-gray-100 transition-colors">
              <ZoomIn className="w-4 h-4 text-gray-600" />
            </button>
            <button onClick={handleZoomFit} className="p-1 rounded hover:bg-gray-100 transition-colors">
              <Maximize2 className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setViewDensity('comfortable')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewDensity === 'comfortable' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewDensity('compact')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewDensity === 'compact' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors shadow-sm ${
              showFilters ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Filter by Status</h4>
            <div className="flex flex-wrap gap-2">
              {['Pending', 'Work in Progress', 'Ready for Inspection', 'Awaiting Client Approval', 'Inspected', 'Closed'].map(status => (
                <button
                  key={status}
                  onClick={() => toggleStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter.includes(status)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
              {statusFilter.length > 0 && (
                <button
                  onClick={() => setStatusFilter([])}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[600px]" ref={chartRef}>
        <div style={{ minWidth: `${300 + totalDays * dayWidth}px` }}>
          {timeScale === 'day' && (
            <div className="flex border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="w-[300px] flex-shrink-0 bg-gray-50 px-4 py-2 font-medium text-xs text-gray-500 uppercase tracking-wider border-r border-gray-200">
                Month
              </div>
              <div className="flex-1 flex">
                {(() => {
                  const months: { name: string; days: number }[] = [];
                  let currentDate = new Date(rangeStart);
                  while (currentDate <= rangeEnd) {
                    const monthStart = new Date(currentDate);
                    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                    const endDate = monthEnd > rangeEnd ? rangeEnd : monthEnd;
                    const daysInMonth = Math.ceil((endDate.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    months.push({
                      name: monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                      days: daysInMonth
                    });
                    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
                  }
                  return months.map((month, idx) => (
                    <div
                      key={idx}
                      className="border-r border-gray-200 px-2 py-2 text-center text-xs font-semibold text-gray-700"
                      style={{ width: `${month.days * dayWidth}px` }}
                    >
                      {month.name}
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          <div className="flex border-b border-gray-300 sticky top-8 bg-white z-10 shadow-sm">
            <div className="w-[300px] flex-shrink-0 bg-gray-50 px-4 py-3 font-semibold text-sm text-gray-700 border-r border-gray-200 flex items-center gap-2">
              {editMode && <Target className="w-4 h-4 text-blue-600" />}
              Activity Name
            </div>
            <div className="flex-1 flex">
              {timelineHeaders.map((header, idx) => (
                <div
                  key={idx}
                  className={`border-r border-gray-200 px-2 py-3 text-center text-sm font-medium transition-colors ${
                    header.isToday ? 'bg-blue-50 text-blue-700 font-bold' :
                    header.isWeekend ? 'bg-gray-100 text-gray-500' : 'text-gray-700'
                  }`}
                  style={{ width: `${header.width}px` }}
                >
                  {header.label}
                </div>
              ))}
            </div>
          </div>

          <div className="relative" style={{ minHeight: `${activities.length * rowHeight}px` }}>
            <svg
              className="absolute inset-0 pointer-events-none"
              style={{ width: '100%', height: '100%', zIndex: 5 }}
            >
              <defs>
                <marker id="arrow-normal" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                  <path d="M0,0 L0,6 L9,3 z" fill="#3b82f6" />
                </marker>
                <marker id="arrow-warning" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                  <path d="M0,0 L0,6 L9,3 z" fill="#f59e0b" />
                </marker>
                <marker id="arrow-error" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                  <path d="M0,0 L0,6 L9,3 z" fill="#ef4444" />
                </marker>
              </defs>
              {renderDependencyLines()}
            </svg>

            {Array.from({ length: totalDays }).map((_, dayIndex) => {
              const currentDate = new Date(rangeStart);
              currentDate.setDate(currentDate.getDate() + dayIndex);
              const isToday = currentDate.getTime() === today.getTime();
              const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;

              return (
                <div
                  key={dayIndex}
                  className={`absolute top-0 bottom-0 ${
                    isToday ? 'bg-blue-500 z-10' : isWeekend ? 'bg-gray-50' : 'border-r border-gray-100'
                  }`}
                  style={{
                    left: `${300 + dayIndex * dayWidth}px`,
                    width: isToday ? '2px' : isWeekend ? `${dayWidth}px` : '1px'
                  }}
                />
              );
            })}

            {activities.map((activity, index) => {
              const position = getBarPosition(activity);

              const isSelected = selectedActivity === activity.id;
              const isDragging = draggedActivity === activity.id || resizingActivity?.id === activity.id;
              const isVerticalDragging = verticalDragActivity === activity.id;
              const hasChange = !!pendingChanges[activity.id];
              const isHovered = hoveredActivity === activity.id;
              const isCritical = criticalPath.has(activity.id);
              const showDropIndicator = editMode && dropTargetIndex === index;

              return (
                <div key={activity.id} className="relative">
                  {showDropIndicator && (
                    <div className="absolute left-0 right-0 h-1 bg-blue-500 z-20" style={{ top: '-2px' }} />
                  )}
                  <div
                    className={`flex transition-all ${
                      isSelected ? 'bg-blue-50 ring-2 ring-blue-500' :
                      isHovered ? 'bg-gray-50' :
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    } ${isVerticalDragging ? 'opacity-50 shadow-xl' : ''}`}
                    style={{ height: `${rowHeight}px` }}
                    onMouseEnter={() => setHoveredActivity(activity.id)}
                    onMouseLeave={() => setHoveredActivity(null)}
                  >
                    <div
                      className={`w-[300px] flex-shrink-0 px-4 py-3 border-r border-gray-200 flex items-center gap-3 ${
                        editMode ? 'cursor-ns-resize' : ''
                      }`}
                      onMouseDown={(e) => handleVerticalDragStart(e, activity.id)}
                    >
                      {editMode && (
                        <div className="flex flex-col gap-0.5">
                          <div className="w-4 h-0.5 bg-gray-400 rounded" />
                          <div className="w-4 h-0.5 bg-gray-400 rounded" />
                          <div className="w-4 h-0.5 bg-gray-400 rounded" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onEdit(activity)}
                            className="text-left hover:text-blue-600 transition-colors flex-1 min-w-0"
                          >
                            <div className="font-medium text-sm text-gray-900 truncate flex items-center gap-2">
                              {activity.name}
                              {isCritical && <Target className="w-3 h-3 text-orange-500 flex-shrink-0" />}
                              {hasChange && <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {activity.progress_percent}% complete
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 py-3 relative">
                      <div
                        className={`absolute group ${isDragging ? 'opacity-70 z-30' : 'z-20'}`}
                        style={{
                          left: `${position.leftPx}px`,
                          width: `${position.widthPx}px`,
                          top: '8px',
                          cursor: editMode ? (draggedActivity === activity.id ? 'grabbing' : 'grab') : 'pointer'
                        }}
                        onMouseDown={(e) => handleMouseDown(e, activity.id)}
                      >
                        {editMode && (
                          <div
                            className="absolute -left-2 top-0 bottom-0 w-4 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-blue-400 hover:bg-opacity-50 transition-opacity rounded-l z-30"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              handleMouseDown(e, activity.id, 'left');
                            }}
                          />
                        )}

                        <div
                          className={`h-10 rounded-lg ${getActivityStatusBarColor(activity.status)} relative overflow-hidden shadow-md border-2 transition-all ${
                            isSelected ? 'border-blue-600 ring-2 ring-blue-300' :
                            hasChange ? 'border-green-500' :
                            'border-white/50'
                          } ${isHovered ? 'shadow-lg transform scale-105' : ''}`}
                          title={`${activity.name}\n${position.startDate.toLocaleDateString()} - ${position.endDate.toLocaleDateString()}\nProgress: ${activity.progress_percent}%`}
                        >
                          <div
                            className="absolute inset-y-0 left-0 bg-white bg-opacity-40 transition-all"
                            style={{ width: `${activity.progress_percent}%` }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center px-3">
                            <span className="text-xs font-semibold text-white truncate drop-shadow">
                              {activity.name}
                            </span>
                          </div>
                        </div>

                        {editMode && (
                          <div
                            className="absolute -right-2 top-0 bottom-0 w-4 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-blue-400 hover:bg-opacity-50 transition-opacity rounded-r z-30"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              handleMouseDown(e, activity.id, 'right');
                            }}
                          />
                        )}

                        <div className="text-xs text-gray-600 mt-1.5 text-center whitespace-nowrap pointer-events-none font-medium">
                          {position.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {position.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showMinimap && activities.length > 5 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Eye className="w-4 h-4" />
            <span className="font-medium">Timeline Overview</span>
          </div>
          <div className="mt-2 h-16 bg-white rounded border border-gray-200 relative overflow-hidden">
            {activities.map((activity) => {
              const position = getBarPosition(activity);
              const totalWidth = totalDays * dayWidth;
              const leftPercent = (position.leftPx / totalWidth) * 100;
              const widthPercent = (position.widthPx / totalWidth) * 100;

              return (
                <div
                  key={activity.id}
                  className={`absolute top-1 h-2 rounded ${getActivityStatusBarColor(activity.status)} opacity-70`}
                  style={{
                    left: `${leftPercent}%`,
                    width: `${widthPercent}%`
                  }}
                  title={activity.name}
                />
              );
            })}
          </div>
        </div>
      )}

      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-gray-400 shadow-sm"></div>
              <span className="text-gray-700 font-medium">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-blue-500 shadow-sm"></div>
              <span className="text-gray-700 font-medium">In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-yellow-500 shadow-sm"></div>
              <span className="text-gray-700 font-medium">Ready for Inspection</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-green-500 shadow-sm"></div>
              <span className="text-gray-700 font-medium">Inspected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-slate-400 shadow-sm"></div>
              <span className="text-gray-700 font-medium">Closed</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-0.5 w-6 bg-blue-500"></div>
              <span className="text-gray-600">Normal dependency</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-0.5 w-6 bg-red-500"></div>
              <span className="text-gray-600">Conflict</span>
            </div>
          </div>
        </div>

        {editMode && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2 text-sm text-blue-800">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Edit Mode Active</div>
                <div className="text-xs mt-1 text-blue-700">
                  • Drag activities horizontally to change dates
                  <br />
                  • Drag activity edges to resize duration
                  <br />
                  • Drag activities vertically (from name) to reorder
                  <br />
                  • Click Save to commit all changes
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
