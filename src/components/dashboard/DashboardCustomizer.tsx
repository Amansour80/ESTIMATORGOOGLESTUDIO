import React, { useState } from 'react';
import { Settings, X, Eye, EyeOff, RotateCcw, Save, Sparkles } from 'lucide-react';
import type { DashboardConfig } from '../../types/dashboardConfig';

interface DashboardCustomizerProps {
  config: DashboardConfig;
  isCustomizing: boolean;
  onToggleCustomize: () => void;
  onUpdateConfig: (config: DashboardConfig) => void;
  onReset: () => void;
  onSave: () => Promise<void>;
}

export function DashboardCustomizer({
  config,
  isCustomizing,
  onToggleCustomize,
  onUpdateConfig,
  onReset,
  onSave,
}: DashboardCustomizerProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  const visibleWidgets = Object.values(config.widgets).filter(w => w.visible);
  const hiddenWidgets = Object.values(config.widgets).filter(w => !w.visible);

  const handleToggleWidget = (widgetId: string) => {
    const widget = config.widgets[widgetId];
    onUpdateConfig({
      ...config,
      widgets: {
        ...config.widgets,
        [widgetId]: {
          ...widget,
          visible: !widget.visible,
        },
      },
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave();
    setIsSaving(false);
    setShowPanel(false);
  };

  const handleReset = () => {
    if (confirm('Reset dashboard to default layout? This will remove all customizations.')) {
      onReset();
      setShowPanel(false);
    }
  };

  if (!isCustomizing) {
    return (
      <button
        onClick={() => {
          onToggleCustomize();
          setShowPanel(true);
        }}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
        title="Customize Dashboard"
      >
        <Settings className="w-4 h-4 text-gray-700" />
        <span className="text-sm font-medium text-gray-700">Customize</span>
      </button>
    );
  }

  return (
    <>
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg animate-pulse">
        <Sparkles className="w-5 h-5" />
        <span className="font-semibold">Customization Mode Active</span>
        <button
          onClick={() => setShowPanel(!showPanel)}
          className="ml-2 p-1 hover:bg-blue-700 rounded transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {showPanel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-end p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-gray-900">Dashboard Customization</h2>
                <button
                  onClick={() => setShowPanel(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <p className="text-sm text-gray-600">
                Toggle widgets, resize, and reorder by dragging them
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-green-600" />
                    Visible Widgets ({visibleWidgets.length})
                  </h3>
                  <div className="space-y-2">
                    {visibleWidgets.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No visible widgets</p>
                    ) : (
                      visibleWidgets.map((widget) => (
                        <div
                          key={widget.id}
                          className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm">{widget.name}</p>
                            <p className="text-xs text-gray-600">{widget.description}</p>
                          </div>
                          <button
                            onClick={() => handleToggleWidget(widget.id)}
                            className="ml-3 p-2 hover:bg-green-100 rounded-lg transition-colors"
                            title="Hide widget"
                          >
                            <EyeOff className="w-4 h-4 text-green-700" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {hiddenWidgets.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <EyeOff className="w-4 h-4 text-gray-400" />
                      Hidden Widgets ({hiddenWidgets.length})
                    </h3>
                    <div className="space-y-2">
                      {hiddenWidgets.map((widget) => (
                        <div
                          key={widget.id}
                          className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-700 text-sm">{widget.name}</p>
                            <p className="text-xs text-gray-500">{widget.description}</p>
                          </div>
                          <button
                            onClick={() => handleToggleWidget(widget.id)}
                            className="ml-3 p-2 hover:bg-gray-200 rounded-lg transition-colors"
                            title="Show widget"
                          >
                            <Eye className="w-4 h-4 text-gray-700" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Tips</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>Drag widgets to reorder them</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>Resize widgets by dragging their corners</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>Toggle visibility with the eye icons</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>Click "Save" to persist your layout</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save & Exit
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    onToggleCustomize();
                    setShowPanel(false);
                  }}
                  className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
              <button
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
              >
                <RotateCcw className="w-4 h-4" />
                Reset to Default
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
