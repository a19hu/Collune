import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Permission } from '../../types';

interface PermissionGuardProps {
  permission: Permission | string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  children,
  fallback = null,
}) => {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

interface ProtectedRouteProps {
  permission: Permission | string;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  permission,
  children,
}) => {
  const { hasPermission, currentRole } = useAuth();

  if (!hasPermission(permission)) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-xs my-8 max-w-lg mx-auto space-y-3">
        <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center font-bold">
          403
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Access Restricted
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Your active role (<span className="font-semibold text-indigo-600 dark:text-indigo-400">{currentRole.name}</span>) does not possess the required privilege (<code className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{permission}</code>) to view this module.
        </p>
        <p className="text-[11px] text-slate-400">
          Switch to <strong className="text-slate-700 dark:text-slate-300">Super Admin</strong> or <strong className="text-slate-700 dark:text-slate-300">Admin</strong> in the top header switcher to access all platform screens.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
