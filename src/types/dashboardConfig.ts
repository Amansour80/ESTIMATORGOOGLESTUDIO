export interface WidgetLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

export interface WidgetConfig {
  id: string;
  name: string;
  description: string;
  visible: boolean;
  layout: WidgetLayout;
}

export interface DashboardConfig {
  widgets: Record<string, WidgetConfig>;
  cols: number;
  rowHeight: number;
}

export const WIDGET_IDS = {
  KPI_PIPELINE: 'kpi-pipeline',
  KPI_WIN_RATE: 'kpi-win-rate',
  PROCESS_FLOW: 'process-flow',
  MONTHLY_TRENDS: 'monthly-trends',
  INQUIRIES: 'inquiries',
  ESTIMATOR_COMPARISON: 'estimator-comparison',
  RECENT_ACTIVITY: 'recent-activity',
} as const;

export const DEFAULT_DASHBOARD_CONFIG: DashboardConfig = {
  cols: 12,
  rowHeight: 50,
  widgets: {
    [WIDGET_IDS.KPI_PIPELINE]: {
      id: WIDGET_IDS.KPI_PIPELINE,
      name: 'Total Pipeline Value',
      description: 'Overall project pipeline value',
      visible: true,
      layout: { i: WIDGET_IDS.KPI_PIPELINE, x: 0, y: 0, w: 6, h: 2, minW: 2, minH: 1, maxH: 3 },
    },
    [WIDGET_IDS.KPI_WIN_RATE]: {
      id: WIDGET_IDS.KPI_WIN_RATE,
      name: 'Win Rate',
      description: 'Project award success rate',
      visible: true,
      layout: { i: WIDGET_IDS.KPI_WIN_RATE, x: 6, y: 0, w: 6, h: 2, minW: 2, minH: 1, maxH: 3 },
    },
    [WIDGET_IDS.PROCESS_FLOW]: {
      id: WIDGET_IDS.PROCESS_FLOW,
      name: 'Process Flow',
      description: 'Project lifecycle visualization',
      visible: true,
      layout: { i: WIDGET_IDS.PROCESS_FLOW, x: 0, y: 2, w: 12, h: 5, minW: 4, minH: 3 },
    },
    [WIDGET_IDS.MONTHLY_TRENDS]: {
      id: WIDGET_IDS.MONTHLY_TRENDS,
      name: 'Monthly Trends',
      description: 'Project activity over time',
      visible: true,
      layout: { i: WIDGET_IDS.MONTHLY_TRENDS, x: 0, y: 7, w: 12, h: 5, minW: 6, minH: 4 },
    },
    [WIDGET_IDS.INQUIRIES]: {
      id: WIDGET_IDS.INQUIRIES,
      name: 'Inquiries',
      description: 'Pending client inquiries',
      visible: true,
      layout: { i: WIDGET_IDS.INQUIRIES, x: 0, y: 12, w: 12, h: 3, minW: 6, minH: 3 },
    },
    [WIDGET_IDS.ESTIMATOR_COMPARISON]: {
      id: WIDGET_IDS.ESTIMATOR_COMPARISON,
      name: 'Estimator Comparison',
      description: 'Compare performance by module',
      visible: true,
      layout: { i: WIDGET_IDS.ESTIMATOR_COMPARISON, x: 0, y: 15, w: 6, h: 5, minW: 5, minH: 4 },
    },
    [WIDGET_IDS.RECENT_ACTIVITY]: {
      id: WIDGET_IDS.RECENT_ACTIVITY,
      name: 'Recent Activity',
      description: 'Latest project updates',
      visible: true,
      layout: { i: WIDGET_IDS.RECENT_ACTIVITY, x: 6, y: 15, w: 6, h: 5, minW: 5, minH: 4 },
    },
  },
};
