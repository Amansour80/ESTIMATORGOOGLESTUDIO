import { ReactNode } from 'react';
import { usePermissions } from '../hooks/usePermissions';

interface PermissionGateProps {
  moduleName: string;
  permission: 'view' | 'edit';
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGate({
  moduleName,
  permission,
  children,
  fallback = null
}: PermissionGateProps) {
  const { hasModulePermission } = usePermissions();

  if (!hasModulePermission(moduleName, permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
