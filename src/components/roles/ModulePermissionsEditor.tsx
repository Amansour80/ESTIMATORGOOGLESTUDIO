import { useState, useEffect } from 'react';
import { Eye, Edit2, LayoutDashboard, Wrench, HardHat, ClipboardList, CheckSquare, BookOpen, Users, Settings as SettingsIcon, Bell, User, Kanban, Save, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Module {
  id: string;
  name: string;
  display_name: string;
  description: string;
}

interface ModulePermission {
  module_id: string;
  can_view: boolean;
  can_edit: boolean;
}

interface ModulePermissionsEditorProps {
  roleId: string;
  disabled?: boolean;
}

const MODULE_ICONS: Record<string, any> = {
  dashboard: LayoutDashboard,
  fm_estimator: Wrench,
  retrofit_estimator: HardHat,
  retrofit_pm: Kanban,
  inquiries: ClipboardList,
  approvals: CheckSquare,
  asset_library: BookOpen,
  labor_library: Users,
  settings: SettingsIcon,
  notifications: Bell,
  user_profile: User,
};

const MODULE_COLORS: Record<string, string> = {
  dashboard: 'text-teal-600',
  fm_estimator: 'text-orange-600',
  retrofit_estimator: 'text-purple-600',
  retrofit_pm: 'text-blue-600',
  inquiries: 'text-yellow-600',
  approvals: 'text-emerald-600',
  asset_library: 'text-indigo-600',
  labor_library: 'text-cyan-600',
  settings: 'text-gray-600',
  notifications: 'text-pink-600',
  user_profile: 'text-slate-600',
};

export function ModulePermissionsEditor({ roleId, disabled = false }: ModulePermissionsEditorProps) {
  const [modules, setModules] = useState<Module[]>([]);
  const [permissions, setPermissions] = useState<Record<string, ModulePermission>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadModulesAndPermissions();
  }, [roleId]);

  const loadModulesAndPermissions = async () => {
    try {
      setLoading(true);

      const [modulesResult, permsResult] = await Promise.all([
        supabase.from('modules').select('*').order('name'),
        supabase
          .from('role_module_permissions')
          .select('module_id, can_view, can_edit')
          .eq('role_id', roleId),
      ]);

      if (modulesResult.data) {
        setModules(modulesResult.data);

        const permsMap: Record<string, ModulePermission> = {};
        modulesResult.data.forEach((module) => {
          const perm = permsResult.data?.find((p) => p.module_id === module.id);
          permsMap[module.id] = {
            module_id: module.id,
            can_view: perm?.can_view || false,
            can_edit: perm?.can_edit || false,
          };
        });
        setPermissions(permsMap);
      }
    } catch (error) {
      console.error('Error loading modules and permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (moduleId: string, field: 'can_view' | 'can_edit') => {
    if (disabled) return;

    setPermissions((prev) => {
      const current = prev[moduleId] || { module_id: moduleId, can_view: false, can_edit: false };
      const updated = { ...current, [field]: !current[field] };

      if (field === 'can_edit' && updated.can_edit) {
        updated.can_view = true;
      }

      if (field === 'can_view' && !updated.can_view) {
        updated.can_edit = false;
      }

      return { ...prev, [moduleId]: updated };
    });
    setHasChanges(true);
  };

  const handlePreset = (preset: 'none' | 'view_all' | 'edit_all' | 'estimator' | 'pm') => {
    if (disabled) return;

    const newPermissions: Record<string, ModulePermission> = {};

    modules.forEach((module) => {
      switch (preset) {
        case 'none':
          newPermissions[module.id] = { module_id: module.id, can_view: false, can_edit: false };
          break;
        case 'view_all':
          newPermissions[module.id] = { module_id: module.id, can_view: true, can_edit: false };
          break;
        case 'edit_all':
          newPermissions[module.id] = { module_id: module.id, can_view: true, can_edit: true };
          break;
        case 'estimator':
          if (['fm_estimator', 'retrofit_estimator', 'inquiries', 'asset_library', 'labor_library', 'dashboard', 'notifications', 'user_profile'].includes(module.name)) {
            newPermissions[module.id] = { module_id: module.id, can_view: true, can_edit: true };
          } else if (['retrofit_pm', 'approvals'].includes(module.name)) {
            newPermissions[module.id] = { module_id: module.id, can_view: true, can_edit: false };
          } else {
            newPermissions[module.id] = { module_id: module.id, can_view: false, can_edit: false };
          }
          break;
        case 'pm':
          if (['retrofit_pm', 'dashboard', 'notifications', 'user_profile', 'approvals'].includes(module.name)) {
            newPermissions[module.id] = { module_id: module.id, can_view: true, can_edit: true };
          } else if (['fm_estimator', 'retrofit_estimator', 'inquiries', 'asset_library', 'labor_library'].includes(module.name)) {
            newPermissions[module.id] = { module_id: module.id, can_view: true, can_edit: false };
          } else {
            newPermissions[module.id] = { module_id: module.id, can_view: false, can_edit: false };
          }
          break;
      }
    });

    setPermissions(newPermissions);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (disabled) return;

    try {
      setSaving(true);

      await supabase.from('role_module_permissions').delete().eq('role_id', roleId);

      const permsToInsert = Object.values(permissions)
        .filter((p) => p.can_view || p.can_edit)
        .map((p) => ({
          role_id: roleId,
          module_id: p.module_id,
          can_view: p.can_view,
          can_edit: p.can_edit,
        }));

      if (permsToInsert.length > 0) {
        const { error } = await supabase.from('role_module_permissions').insert(permsToInsert);
        if (error) throw error;
      }

      setHasChanges(false);
      alert('Module permissions saved successfully!');
    } catch (error: any) {
      console.error('Error saving permissions:', error);
      alert('Failed to save permissions: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const viewCount = Object.values(permissions).filter((p) => p.can_view).length;
  const editCount = Object.values(permissions).filter((p) => p.can_edit).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Module Access</label>
          <p className="text-sm text-gray-600">
            {viewCount} modules visible, {editCount} editable
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!disabled && (
            <>
              <select
                onChange={(e) => handlePreset(e.target.value as any)}
                className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value=""
              >
                <option value="" disabled>
                  Quick presets
                </option>
                <option value="none">None</option>
                <option value="view_all">View All</option>
                <option value="edit_all">Edit All</option>
                <option value="estimator">Estimator</option>
                <option value="pm">Project Manager</option>
              </select>
              {hasChanges && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save className="w-3 h-3" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {hasChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-800">
            You have unsaved changes. Click Save to apply them.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {modules.map((module) => {
          const perm = permissions[module.id] || { module_id: module.id, can_view: false, can_edit: false };
          const Icon = MODULE_ICONS[module.name] || LayoutDashboard;
          const color = MODULE_COLORS[module.name] || 'text-gray-600';

          return (
            <div
              key={module.id}
              className={`p-4 border rounded-lg ${
                perm.can_view || perm.can_edit
                  ? 'border-blue-200 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900">{module.display_name}</h4>
                  {module.description && (
                    <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={perm.can_view}
                      onChange={() => handleToggle(module.id, 'can_view')}
                      disabled={disabled}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                    />
                    <span className="text-sm text-gray-700 flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      View
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={perm.can_edit}
                      onChange={() => handleToggle(module.id, 'can_edit')}
                      disabled={disabled}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 disabled:cursor-not-allowed"
                    />
                    <span className="text-sm text-gray-700 flex items-center gap-1">
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </span>
                  </label>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {Object.values(permissions).every((p) => !p.can_view && !p.can_edit) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            This role has no module access. Users with this role will not be able to access any modules.
          </p>
        </div>
      )}
    </div>
  );
}
