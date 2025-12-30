import { supabase } from '../lib/supabase';
import type { DashboardConfig, WidgetConfig } from '../types/dashboardConfig';
import { DEFAULT_DASHBOARD_CONFIG } from '../types/dashboardConfig';

export async function loadDashboardConfig(): Promise<DashboardConfig> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return DEFAULT_DASHBOARD_CONFIG;

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('workspace_preferences')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.workspace_preferences?.dashboard) {
      return {
        ...DEFAULT_DASHBOARD_CONFIG,
        ...profile.workspace_preferences.dashboard,
      };
    }

    return DEFAULT_DASHBOARD_CONFIG;
  } catch (error) {
    console.error('Error loading dashboard config:', error);
    return DEFAULT_DASHBOARD_CONFIG;
  }
}

export async function saveDashboardConfig(config: DashboardConfig): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('workspace_preferences')
      .eq('id', user.id)
      .maybeSingle();

    const currentPreferences = profile?.workspace_preferences || {};

    const { error } = await supabase
      .from('user_profiles')
      .update({
        workspace_preferences: {
          ...currentPreferences,
          dashboard: config,
        },
      })
      .eq('id', user.id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error saving dashboard config:', error);
    return false;
  }
}

export function updateWidgetVisibility(
  config: DashboardConfig,
  widgetId: string,
  visible: boolean
): DashboardConfig {
  return {
    ...config,
    widgets: {
      ...config.widgets,
      [widgetId]: {
        ...config.widgets[widgetId],
        visible,
      },
    },
  };
}

export function updateWidgetLayout(
  config: DashboardConfig,
  widgetId: string,
  layout: WidgetConfig['layout']
): DashboardConfig {
  return {
    ...config,
    widgets: {
      ...config.widgets,
      [widgetId]: {
        ...config.widgets[widgetId],
        layout,
      },
    },
  };
}

export function resetDashboardConfig(): DashboardConfig {
  return { ...DEFAULT_DASHBOARD_CONFIG };
}
