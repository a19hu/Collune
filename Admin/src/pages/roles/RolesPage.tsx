import React, { useState, useEffect } from 'react';
import {
  Shield,
  Plus,
  Edit2,
  Copy,
  Trash2,
  Users,
  Check,
} from 'lucide-react';
import { Role, Permission } from '../../types';
import { roleService } from '../../services/roleService';
import { ALL_PERMISSIONS, PERMISSION_MODULES } from '../../constants/permissions';
import { PermissionGuard } from '../../components/permissions/PermissionGuard';
import { RoleFormModal } from './RoleFormModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface RolesPageProps {
  onRouteChange: (route: string) => void;
}

export const RolesPage: React.FC<RolesPageProps> = ({ onRouteChange }) => {
  const { roles, refreshRoles, logAdminAction } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'roles' | 'matrix'>('roles');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [forceDeleteRole, setForceDeleteRole] = useState<Role | null>(null);

  const handleCloneRole = async (sourceRole: Role) => {
    try {
      const cloned = await roleService.createRole({
        name: `Copy of ${sourceRole.name}`,
        description: `Cloned from ${sourceRole.name}. ${sourceRole.description}`,
        permissions: [...sourceRole.permissions],
      });
      await logAdminAction('CREATE', 'Roles', `Cloned role "${sourceRole.name}" into "${cloned.name}"`, cloned.id);
      await refreshRoles();
      success('Role Cloned', `Created "${cloned.name}".`);
    } catch (err: any) {
      error('Failed to clone role', err.message);
    }
  };

  const performDeleteRole = async (role: Role, force: boolean) => {
    try {
      await roleService.deleteRole(role.id, force);
      await logAdminAction('DELETE', 'Roles', `Deleted role "${role.name}"`, role.id);
      await refreshRoles();
      success('Role Deleted', `Deleted "${role.name}".`);
      setRoleToDelete(null);
      setForceDeleteRole(null);
    } catch (err: any) {
      if (!force && /staff user/i.test(err.message || '')) {
        // Backend refused because staff are still assigned — offer to unassign & retry.
        setForceDeleteRole(role);
        setRoleToDelete(null);
        return;
      }
      error('Failed to delete role', err.message);
    }
  };

  const handleDeleteRole = () => roleToDelete && performDeleteRole(roleToDelete, false);
  const handleForceDeleteRole = () => forceDeleteRole && performDeleteRole(forceDeleteRole, true);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Roles & Permissions (RBAC)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure role access policies and fine-grained module permission scopes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Switcher */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('roles')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'roles'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Role Cards
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'matrix'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              RBAC Matrix View
            </button>
          </div>

          <PermissionGuard permission="roles.create">
            <button
              onClick={() => {
                setRoleToEdit(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create Role</span>
            </button>
          </PermissionGuard>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'roles' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {roles.map((role) => {
            const isWildcard = role.permissions.includes('*');
            return (
              <div
                key={role.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {role.name}
                        </h3>
                        <div className="text-[10px] text-slate-400 font-mono">{role.id}</div>
                      </div>
                    </div>

                    {role.isSystem ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border border-slate-200 dark:border-slate-700">
                        System Core
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800">
                        Custom
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed min-h-[36px]">
                    {role.description}
                  </p>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Scope of Access</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {isWildcard ? 'Full Wildcard (*)' : `${role.permissions.length} Grants`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Staff Assigned</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{role.userCount || 0} users</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-1.5">
                  <PermissionGuard permission="roles.create">
                    <button
                      onClick={() => handleCloneRole(role)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Clone this role"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </PermissionGuard>

                  <PermissionGuard permission="roles.edit">
                    <button
                      onClick={() => {
                        setRoleToEdit(role);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors cursor-pointer"
                      title="Edit Permissions"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </PermissionGuard>

                  {!role.isSystem && (
                    <PermissionGuard permission="roles.delete">
                      <button
                        onClick={() => setRoleToDelete(role)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Role"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </PermissionGuard>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Matrix View */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3.5 font-bold uppercase tracking-wider sticky left-0 bg-slate-50 dark:bg-slate-800 z-10 min-w-[220px]">
                  Permission / Action
                </th>
                {roles.map((r) => (
                  <th key={r.id} className="px-3 py-3.5 text-center min-w-[120px]">
                    <div className="font-bold text-slate-900 dark:text-slate-100 truncate">{r.name}</div>
                    <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                      {r.permissions.includes('*') ? 'All' : `${r.permissions.length} perms`}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {PERMISSION_MODULES.map((mod) => (
                <React.Fragment key={mod.name}>
                  {/* Module Header Row */}
                  <tr className="bg-slate-100/50 dark:bg-slate-850/60">
                    <td
                      colSpan={roles.length + 1}
                      className="px-4 py-2 font-bold text-[11px] uppercase tracking-wider text-indigo-700 dark:text-indigo-400"
                    >
                      {mod.name} Module
                    </td>
                  </tr>

                  {/* Individual Permissions in this module */}
                  {mod.permissions.map((perm) => (
                    <tr key={perm.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-2.5 sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-slate-100 dark:border-slate-800">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {perm.name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">{perm.id}</div>
                      </td>

                      {roles.map((r) => {
                        const hasGrant = r.permissions.includes('*') || r.permissions.includes(perm.id);
                        return (
                          <td key={r.id} className="px-3 py-2.5 text-center">
                            {hasGrant ? (
                              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto" />
                            ) : (
                              <span className="text-slate-300 dark:text-slate-700">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      <RoleFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        roleToEdit={roleToEdit}
        onSuccess={refreshRoles}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!roleToDelete}
        onClose={() => setRoleToDelete(null)}
        onConfirm={handleDeleteRole}
        title={`Delete Role "${roleToDelete?.name}"?`}
        description="This will revoke this role configuration. Any staff assigned to this role must be reassigned."
        confirmText="Delete Role"
        variant="danger"
      />

      {/* Force Delete Confirmation (role still assigned to staff) */}
      <ConfirmDialog
        isOpen={!!forceDeleteRole}
        onClose={() => setForceDeleteRole(null)}
        onConfirm={handleForceDeleteRole}
        title={`"${forceDeleteRole?.name}" is assigned to staff`}
        description={`${forceDeleteRole?.userCount || 0} staff user(s) currently have this role. Deleting it will unassign them — they'll need a new role before regaining access. Continue?`}
        confirmText="Unassign & Delete"
        variant="warning"
      />
    </div>
  );
};
