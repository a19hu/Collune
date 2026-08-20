import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  Eye,
  Shield,
  Phone,
  Mail,
  Building,
  MoreVertical,
} from 'lucide-react';
import { DataTable, Column, BulkAction } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { UserFormModal } from './UserFormModal';
import { PermissionGuard } from '../../components/permissions/PermissionGuard';
import { StaffUser } from '../../types';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatDate, timeAgo } from '../../utils/formatters';

interface UsersPageProps {
  onRouteChange: (route: string) => void;
}

export const UsersPage: React.FC<UsersPageProps> = ({ onRouteChange }) => {
  const { hasPermission, logAdminAction } = useAuth();
  const { success, error } = useToast();

  const [users, setUsers] = useState<StaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals & Dialogs
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<StaffUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<StaffUser | null>(null);
  const [statusAction, setStatusAction] = useState<{ user: StaffUser; newStatus: 'Active' | 'Inactive' | 'Suspended' } | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await userService.getUsers();
      setUsers(data);
    } catch (err: any) {
      error('Failed to load users', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await userService.deleteUser(userToDelete.id);
      await logAdminAction('DELETE', 'Users', `Deleted staff account for ${userToDelete.name}`, userToDelete.id);
      success('User deleted', `${userToDelete.name} was removed from the system.`);
      setUserToDelete(null);
      loadUsers();
    } catch (err: any) {
      error('Failed to delete user', err.message);
    }
  };

  const handleStatusChange = async () => {
    if (!statusAction) return;
    try {
      await userService.toggleUserStatus(statusAction.user.id, statusAction.newStatus);
      const actionType = statusAction.newStatus === 'Active' ? 'ACTIVATE' : 'DEACTIVATE';
      await logAdminAction(
        actionType,
        'Users',
        `Changed status for ${statusAction.user.name} to ${statusAction.newStatus}`,
        statusAction.user.id
      );
      success('Status updated', `${statusAction.user.name} is now ${statusAction.newStatus}.`);
      setStatusAction(null);
      loadUsers();
    } catch (err: any) {
      error('Failed to update status', err.message);
    }
  };

  const columns: Column<StaffUser>[] = [
    {
      key: 'name',
      header: 'Staff Member',
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
            alt={row.name}
            className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
          />
          <div>
            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span>{row.name}</span>
            </div>
            <div className="text-xs text-slate-400 font-mono">{row.id}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Contact Info',
      render: (row) => (
        <div className="space-y-0.5 text-xs">
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate max-w-[180px]">{row.email}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{row.phone}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'roleName',
      header: 'Role & Scope',
      render: (row) => (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200/60 dark:border-indigo-800">
          <Shield className="w-3.5 h-3.5 shrink-0" />
          <span>{row.roleName}</span>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      render: (row) => (
        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
          {row.department}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'lastLogin',
      header: 'Last Login',
      render: (row) => (
        <span className="text-xs text-slate-500">
          {row.lastLogin.includes('T') ? timeAgo(row.lastLogin) : row.lastLogin}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {/* View detail button */}
          <button
            onClick={() => onRouteChange(`/admin/users/${row.id}`)}
            className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors cursor-pointer"
            title="View User Details"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Edit button (Guarded) */}
          <PermissionGuard permission="users.edit">
            <button
              onClick={() => {
                setUserToEdit(row);
                setIsCreateOpen(true);
              }}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Edit Staff Member"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </PermissionGuard>

          {/* Status Toggle (Guarded) */}
          {row.status === 'Active' ? (
            <PermissionGuard permission="users.deactivate">
              <button
                onClick={() => setStatusAction({ user: row, newStatus: 'Suspended' })}
                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg transition-colors cursor-pointer"
                title="Suspend User"
              >
                <UserX className="w-4 h-4" />
              </button>
            </PermissionGuard>
          ) : (
            <PermissionGuard permission="users.activate">
              <button
                onClick={() => setStatusAction({ user: row, newStatus: 'Active' })}
                className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors cursor-pointer"
                title="Activate User"
              >
                <UserCheck className="w-4 h-4" />
              </button>
            </PermissionGuard>
          )}

          {/* Delete (Guarded) */}
          <PermissionGuard permission="users.delete">
            <button
              onClick={() => setUserToDelete(row)}
              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
              title="Delete Staff Member"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </PermissionGuard>
        </div>
      ),
    },
  ];

  const filterOptions = [
    {
      key: 'department',
      label: 'Department',
      options: [
        { label: 'Operations', value: 'Operations' },
        { label: 'Campaign Management', value: 'Campaign Management' },
        { label: 'Creator Management', value: 'Creator Management' },
        { label: 'Brand Management', value: 'Brand Management' },
        { label: 'Finance', value: 'Finance' },
        { label: 'Support', value: 'Support' },
        { label: 'Export/Data', value: 'Export/Data' },
        { label: 'Administration', value: 'Administration' },
      ],
    },
    {
      key: 'status',
      label: 'Status',
      options: [
        { label: 'Active', value: 'Active' },
        { label: 'Inactive', value: 'Inactive' },
        { label: 'Suspended', value: 'Suspended' },
      ],
    },
  ];

  const bulkActions: BulkAction<StaffUser>[] = [
    {
      label: 'Activate Selected',
      variant: 'success',
      permission: 'users.activate',
      onClick: async (selected) => {
        for (const u of selected) {
          await userService.toggleUserStatus(u.id, 'Active');
        }
        await logAdminAction('ACTIVATE', 'Users', `Bulk activated ${selected.length} staff accounts`);
        success(`Activated ${selected.length} users`);
        loadUsers();
      },
    },
    {
      label: 'Suspend Selected',
      variant: 'danger',
      permission: 'users.deactivate',
      onClick: async (selected) => {
        for (const u of selected) {
          await userService.toggleUserStatus(u.id, 'Suspended');
        }
        await logAdminAction('DEACTIVATE', 'Users', `Bulk suspended ${selected.length} staff accounts`);
        success(`Suspended ${selected.length} users`);
        loadUsers();
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Internal Staff Users
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage admin accounts, department assignments, and security status.
          </p>
        </div>

        <PermissionGuard permission="users.create">
          <button
            onClick={() => {
              setUserToEdit(null);
              setIsCreateOpen(true);
            }}
            className="px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Staff User</span>
          </button>
        </PermissionGuard>
      </div>

      {/* Main Table */}
      <DataTable
        data={users}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search staff by name, email, role, phone..."
        filterOptions={filterOptions}
        bulkActions={bulkActions}
        exportPermission="users.export"
        onRowClick={(row) => onRouteChange(`/admin/users/${row.id}`)}
        emptyTitle="No staff members found"
        emptyDescription="No internal staff users match the applied search and filter criteria."
      />

      {/* Create / Edit Modal */}
      <UserFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        userToEdit={userToEdit}
        onSuccess={loadUsers}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDeleteUser}
        title={`Delete User "${userToDelete?.name}"?`}
        description="This action cannot be undone. This staff member will immediately lose access to the platform."
        confirmText="Delete User"
        variant="danger"
      />

      {/* Status Change Dialog */}
      <ConfirmDialog
        isOpen={!!statusAction}
        onClose={() => setStatusAction(null)}
        onConfirm={handleStatusChange}
        title={`${statusAction?.newStatus === 'Active' ? 'Activate' : 'Suspend'} "${statusAction?.user.name}"?`}
        description={
          statusAction?.newStatus === 'Active'
            ? 'The user will regain login access to their assigned platform permissions.'
            : 'The user will be blocked from logging into the Collune admin portal.'
        }
        confirmText={statusAction?.newStatus === 'Active' ? 'Activate User' : 'Suspend User'}
        variant={statusAction?.newStatus === 'Active' ? 'primary' : 'warning'}
      />
    </div>
  );
};
