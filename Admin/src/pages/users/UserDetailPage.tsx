import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  Shield,
  Clock,
  Calendar,
  CheckCircle2,
  Lock,
  Edit2,
  Trash2,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { StaffUser, Role, AuditLog } from '../../types';
import { userService } from '../../services/userService';
import { roleService } from '../../services/roleService';
import { auditLogService } from '../../services/auditLogService';
import { ALL_PERMISSIONS } from '../../constants/permissions';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PermissionGuard } from '../../components/permissions/PermissionGuard';
import { UserFormModal } from './UserFormModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatDate, timeAgo } from '../../utils/formatters';

interface UserDetailPageProps {
  userId: string;
  onRouteChange: (route: string) => void;
}

export const UserDetailPage: React.FC<UserDetailPageProps> = ({ userId, onRouteChange }) => {
  const { hasPermission, logAdminAction } = useAuth();
  const { success, error } = useToast();

  const [user, setUser] = useState<StaffUser | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [userLogs, setUserLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'permissions' | 'activity'>('overview');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const u = await userService.getUserById(userId);
      if (u) {
        setUser(u);
        const r = await roleService.getRoleById(u.roleId);
        setRole(r || null);
        const allLogs = await auditLogService.getLogs();
        setUserLogs(allLogs.filter((l) => l.userId === u.id || l.userName === u.name));
      }
    } catch (err: any) {
      error('Failed to load user details', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  const handleDelete = async () => {
    if (!user) return;
    try {
      await userService.deleteUser(user.id);
      await logAdminAction('DELETE', 'Users', `Deleted user ${user.name}`, user.id);
      success('User deleted', `${user.name}'s account was deleted.`);
      onRouteChange('/admin/users');
    } catch (err: any) {
      error('Failed to delete user', err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-48" />
        <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">User Not Found</h3>
        <p className="text-sm text-slate-500 mt-1">The requested staff member does not exist.</p>
        <button
          onClick={() => onRouteChange('/admin/users')}
          className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl"
        >
          Back to Staff List
        </button>
      </div>
    );
  }

  const isSuperAdmin = role?.permissions.includes('*');

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => onRouteChange('/admin/users')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Staff Users</span>
      </button>

      {/* User Header Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={user.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500/20 shadow-md shrink-0"
            />
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{user.name}</h1>
                <StatusBadge status={user.status} />
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">Staff ID: {user.id}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  <Shield className="w-3.5 h-3.5" />
                  <span>{user.roleName}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  <Building className="w-3.5 h-3.5" />
                  <span>{user.department}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <PermissionGuard permission="users.edit">
              <button
                onClick={() => setIsEditOpen(true)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit Profile</span>
              </button>
            </PermissionGuard>

            <PermissionGuard permission="users.delete">
              <button
                onClick={() => setIsDeleteOpen(true)}
                className="px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </PermissionGuard>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-6 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Overview & Contact
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`pb-2 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'permissions'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>Assigned Permissions</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px]">
              {isSuperAdmin ? 'All' : role?.permissions.length || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`pb-2 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'activity'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>Activity Logs</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px]">
              {userLogs.length}
            </span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact & Account info */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Account Information
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500">Email Address</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{user.email}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500">Phone Number</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{user.phone}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500">Department</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{user.department}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500">Joined Platform</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(user.createdAt)}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500">Last Active Session</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {user.lastLogin.includes('T') ? formatDate(user.lastLogin) : user.lastLogin}
                </span>
              </div>
            </div>
          </div>

          {/* Role Summary Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Assigned Role Scope
              </h3>
              <button
                onClick={() => onRouteChange('/admin/roles')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Manage Roles →
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {role?.description || 'Standard access permissions defined for this department.'}
            </p>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Access Tier</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {isSuperAdmin ? 'Full System Administrator (*)' : `${role?.permissions.length} Specific Grants`}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Role Type</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {role?.isSystem ? 'System Core Role' : 'Custom Defined'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'permissions' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Effective Permissions Matrix
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Permissions inherited by {user.name} through the "{user.roleName}" role.
              </p>
            </div>
            {isSuperAdmin && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200">
                Wildcard Full Access (*)
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {ALL_PERMISSIONS.map((perm) => {
              const isGranted = isSuperAdmin || (role?.permissions.includes(perm.key) ?? false);
              return (
                <div
                  key={perm.key}
                  className={`p-3 rounded-xl border transition-all ${
                    isGranted
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-slate-50/40 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800 opacity-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {perm.label}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">{perm.key}</div>
                    </div>
                    {isGranted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-snug">
                    {perm.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Recorded Audit Trail Events
          </h3>
          {userLogs.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">
              No direct audit logs recorded for this staff user yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {userLogs.map((log) => (
                <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={log.action} showIcon={false} className="text-[10px]" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {log.module}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">{log.description}</p>
                  </div>
                  <span className="text-slate-400 text-[11px] shrink-0 font-mono">
                    {timeAgo(log.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <UserFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        userToEdit={user}
        onSuccess={loadData}
      />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title={`Delete User ${user.name}?`}
        description="Are you sure? This will remove the staff user permanently."
        confirmText="Delete Staff Member"
        variant="danger"
      />
    </div>
  );
};
