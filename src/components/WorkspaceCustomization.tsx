import { useState, useEffect } from 'react';
import { Layout, Eye, EyeOff, Grid, List, Palette, Save, RefreshCw, Settings as SettingsIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface Widget {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: 'analytics' | 'projects' | 'actions' | 'insights';
}

interface WorkspacePreferences {
  dashboardLayout: 'grid' | 'list';
  showProcessFlow: boolean;
  showSmartSuggestions: boolean;
  showRecentProjects: boolean;
  showKPICards: boolean;
  showStatusDistribution: boolean;
  showMonthlyTrends: boolean;
  showEstimatorComparison: boolean;
  compactMode: boolean;
  sidebarDefaultExpanded: boolean;
}

interface WorkspaceCustomizationProps {
  user: User;
  onPreferencesChange?: (preferences: WorkspacePreferences) => void;
}

export default function WorkspaceCustomization({ user, onPreferencesChange }: WorkspaceCustomizationProps) {
  const [preferences, setPreferences] = useState<WorkspacePreferences>({
    dashboardLayout: 'grid',
    showProcessFlow: true,
    showSmartSuggestions: true,
    showRecentProjects: true,
    showKPICards: true,
    showStatusDistribution: true,
    showMonthlyTrends: true,
    showEstimatorComparison: true,
    compactMode: false,
    sidebarDefaultExpanded: true,
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const widgets: Widget[] = [
    {
      id: 'processFlow',
      name: 'Process Flow Visualization',
      description: 'Visual representation of project lifecycle stages',
      enabled: preferences.showProcessFlow,
      category: 'insights',
    },
    {
      id: 'smartSuggestions',
      name: 'Smart Suggestions',
      description: 'AI-powered navigation and action recommendations',
      enabled: preferences.showSmartSuggestions,
      category: 'actions',
    },
    {
      id: 'recentProjects',
      name: 'Recent Projects',
      description: 'Quick access to recently updated projects',
      enabled: preferences.showRecentProjects,
      category: 'projects',
    },
    {
      id: 'kpiCards',
      name: 'KPI Cards',
      description: 'Key performance indicators and metrics',
      enabled: preferences.showKPICards,
      category: 'analytics',
    },
    {
      id: 'statusDistribution',
      name: 'Status Distribution',
      description: 'Project status breakdown chart',
      enabled: preferences.showStatusDistribution,
      category: 'analytics',
    },
    {
      id: 'monthlyTrends',
      name: 'Monthly Trends',
      description: 'Project creation and completion trends',
      enabled: preferences.showMonthlyTrends,
      category: 'analytics',
    },
    {
      id: 'estimatorComparison',
      name: 'Estimator Comparison',
      description: 'Compare performance across estimator types',
      enabled: preferences.showEstimatorComparison,
      category: 'analytics',
    },
  ];

  useEffect(() => {
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('user_profiles')
        .select('workspace_preferences')
        .eq('id', user.id)
        .maybeSingle();

      if (data?.workspace_preferences) {
        const prefs = data.workspace_preferences as WorkspacePreferences;
        setPreferences(prefs);
        if (onPreferencesChange) {
          onPreferencesChange(prefs);
        }
      }
    } catch (error) {
      console.error('Error loading workspace preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('user_profiles')
        .update({ workspace_preferences: preferences })
        .eq('id', user.id);

      if (error) throw error;

      setSaved(true);
      if (onPreferencesChange) {
        onPreferencesChange(preferences);
      }

      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving workspace preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    const defaults: WorkspacePreferences = {
      dashboardLayout: 'grid',
      showProcessFlow: true,
      showSmartSuggestions: true,
      showRecentProjects: true,
      showKPICards: true,
      showStatusDistribution: true,
      showMonthlyTrends: true,
      showEstimatorComparison: true,
      compactMode: false,
      sidebarDefaultExpanded: true,
    };
    setPreferences(defaults);
  };

  const toggleWidget = (widgetId: string) => {
    const key = `show${widgetId.charAt(0).toUpperCase()}${widgetId.slice(1)}` as keyof WorkspacePreferences;
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const groupedWidgets = {
    analytics: widgets.filter(w => w.category === 'analytics'),
    projects: widgets.filter(w => w.category === 'projects'),
    actions: widgets.filter(w => w.category === 'actions'),
    insights: widgets.filter(w => w.category === 'insights'),
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-gray-600">Loading preferences...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
              <Layout className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Workspace Customization</h3>
              <p className="text-sm text-gray-600">Personalize your dashboard and interface</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetToDefaults}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={savePreferences}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : saved ? (
                <>
                  <Save className="w-4 h-4" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5 text-gray-700" />
            Layout Preferences
          </h4>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Dashboard Layout</div>
                <div className="text-sm text-gray-600 mt-1">Choose your preferred layout style</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPreferences(prev => ({ ...prev, dashboardLayout: 'grid' }))}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                    preferences.dashboardLayout === 'grid'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                  Grid
                </button>
                <button
                  onClick={() => setPreferences(prev => ({ ...prev, dashboardLayout: 'list' }))}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                    preferences.dashboardLayout === 'list'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <List className="w-4 h-4" />
                  List
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Compact Mode</div>
                <div className="text-sm text-gray-600 mt-1">Reduce spacing for more content</div>
              </div>
              <button
                onClick={() => setPreferences(prev => ({ ...prev, compactMode: !prev.compactMode }))}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  preferences.compactMode ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform ${
                    preferences.compactMode ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Sidebar Default State</div>
                <div className="text-sm text-gray-600 mt-1">Start with sidebar expanded or collapsed</div>
              </div>
              <button
                onClick={() => setPreferences(prev => ({ ...prev, sidebarDefaultExpanded: !prev.sidebarDefaultExpanded }))}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  preferences.sidebarDefaultExpanded ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform ${
                    preferences.sidebarDefaultExpanded ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {Object.entries(groupedWidgets).map(([category, categoryWidgets]) => {
          if (categoryWidgets.length === 0) return null;

          const categoryLabels = {
            analytics: 'Analytics Widgets',
            projects: 'Project Widgets',
            actions: 'Action Widgets',
            insights: 'Insight Widgets',
          };

          const categoryIcons = {
            analytics: SettingsIcon,
            projects: Grid,
            actions: Layout,
            insights: Eye,
          };

          const Icon = categoryIcons[category as keyof typeof categoryIcons];

          return (
            <div key={category}>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Icon className="w-5 h-5 text-gray-700" />
                {categoryLabels[category as keyof typeof categoryLabels]}
              </h4>

              <div className="space-y-3">
                {categoryWidgets.map(widget => (
                  <div
                    key={widget.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {widget.enabled ? (
                        <Eye className="w-5 h-5 text-green-600" />
                      ) : (
                        <EyeOff className="w-5 h-5 text-gray-400" />
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{widget.name}</div>
                        <div className="text-sm text-gray-600 mt-0.5">{widget.description}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleWidget(widget.id)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        widget.enabled ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform ${
                          widget.enabled ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
