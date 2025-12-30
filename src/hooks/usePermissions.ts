import { useState, useEffect } from 'react';
import { useOrganization } from '../contexts/OrganizationContext';
import { supabase } from '../lib/supabase';
import type { ProjectStatus } from '../types/projectStatus';

type Role = 'owner' | 'admin' | 'estimator' | 'viewer';

interface UserRole {
  role: Role;
  organizationId: string;
}

interface ModulePermission {
  module_name: string;
  display_name: string;
  can_view: boolean;
  can_edit: boolean;
}

const ROLE_HIERARCHY: Record<Role, number> = {
  viewer: 0,
  estimator: 1,
  admin: 2,
  owner: 3,
};

export function usePermissions() {
  const { organization } = useOrganization();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modulePermissions, setModulePermissions] = useState<ModulePermission[]>([]);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!organization?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        const [memberResult, superAdminResult, modulePermsResult] = await Promise.all([
          supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', organization.id)
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single(),
          supabase
            .from('super_admins')
            .select('user_id')
            .eq('user_id', user.id)
            .maybeSingle(),
          supabase.rpc('get_user_module_permissions', {
            p_user_id: user.id,
            p_org_id: organization.id
          })
        ]);

        setIsSuperAdmin(!!superAdminResult.data);
        setModulePermissions(modulePermsResult.data || []);

        if (memberResult.error || !memberResult.data) {
          setUserRole(null);
        } else {
          setUserRole({
            role: memberResult.data.role as Role,
            organizationId: organization.id,
          });
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [organization?.id]);

  /**
   * Check if user has permission based on minimum required role
   */
  const hasPermission = (requiredRole: Role): boolean => {
    if (!userRole) return false;

    return ROLE_HIERARCHY[userRole.role] >= ROLE_HIERARCHY[requiredRole];
  };

  /**
   * Check if user is owner
   */
  const isOwner = (): boolean => {
    return userRole?.role === 'owner';
  };

  /**
   * Check if user is admin or higher
   */
  const isAdmin = (): boolean => {
    return hasPermission('admin');
  };

  /**
   * Check if user can manage users
   */
  const canManageUsers = (): boolean => {
    return hasPermission('admin');
  };

  /**
   * Check if user can view subscription
   */
  const canViewSubscription = (): boolean => {
    return hasPermission('owner');
  };

  /**
   * Check if user can update organization settings
   */
  const canUpdateSettings = (): boolean => {
    return hasPermission('admin');
  };

  /**
   * Check if user can edit projects
   */
  const canEditProjects = (): boolean => {
    return hasPermission('estimator');
  };

  /**
   * Check if user can create projects
   */
  const canCreateProjects = (): boolean => {
    return hasPermission('estimator');
  };

  /**
   * Check if user can edit a project based on its status
   * - DRAFT status: any estimator can edit
   * - Other statuses: only admins can edit
   */
  const canEditProjectWithStatus = (status: ProjectStatus): boolean => {
    if (status === 'DRAFT') {
      return hasPermission('estimator');
    }
    return isAdmin();
  };

  /**
   * Check if user has module permission
   */
  const hasModulePermission = (moduleName: string, permissionType: 'view' | 'edit'): boolean => {
    if (isSuperAdmin) return true;

    const modulePermission = modulePermissions.find(m => m.module_name === moduleName);
    if (!modulePermission) return false;

    if (permissionType === 'view') {
      return modulePermission.can_view || modulePermission.can_edit;
    }
    return modulePermission.can_edit;
  };

  /**
   * Check if user can view a module
   */
  const canViewModule = (moduleName: string): boolean => {
    return hasModulePermission(moduleName, 'view');
  };

  /**
   * Check if user can edit a module
   */
  const canEditModule = (moduleName: string): boolean => {
    return hasModulePermission(moduleName, 'edit');
  };

  /**
   * Get list of modules user has access to
   */
  const getAccessibleModules = (): ModulePermission[] => {
    return modulePermissions.filter(m => m.can_view || m.can_edit);
  };

  /**
   * Check if user has view-only access to a module
   */
  const isModuleViewOnly = (moduleName: string): boolean => {
    if (isSuperAdmin) return false;

    const modulePermission = modulePermissions.find(m => m.module_name === moduleName);
    if (!modulePermission) return false;

    return modulePermission.can_view && !modulePermission.can_edit;
  };

  return {
    userRole: userRole?.role || null,
    loading,
    isSuperAdmin,
    hasPermission,
    isOwner,
    isAdmin,
    canManageUsers,
    canViewSubscription,
    canUpdateSettings,
    canEditProjects,
    canCreateProjects,
    canEditProjectWithStatus,
    hasModulePermission,
    canViewModule,
    canEditModule,
    isModuleViewOnly,
    getAccessibleModules,
    modulePermissions,
  };
}
