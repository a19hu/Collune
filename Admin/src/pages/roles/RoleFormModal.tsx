import React, { useState, useEffect } from 'react';
import { Role, Permission, ModuleName } from '../../types';
import { PERMISSION_MODULES, ALL_PERMISSIONS } from '../../constants/permissions';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { roleService } from '../../services/roleService';
import { Check, Shield, Lock } from 'lucide-react';

interface RoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleToEdit?: Role | null;
  onSuccess: () => void;
}

export const RoleFormModal: React.FC<RoleFormModalProps> = ({
  isOpen,
  onClose,
  roleToEdit,
  onSuccess,
}) => {
  const { logAdminAction, refreshRoles } = useAuth();
  const { success, error } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<Set<Permission | string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (roleToEdit) {
      setName(roleToEdit.name);
      setDescription(roleToEdit.description);
      setSelectedPermissions(new Set(roleToEdit.permissions));
    } else {
      setName('');
      setDescription('');
      setSelectedPermissions(new Set());
    }
  }, [roleToEdit, isOpen]);

  const togglePermission = (permId: Permission | string) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) {
        next.delete(permId);
      } else {
        next.add(permId);
      }
      return next;
    });
  };

  const toggleModulePermissions = (moduleName: ModuleName) => {
    const mod = PERMISSION_MODULES.find((m) => m.name === moduleName);
    if (!mod) return;

    const modulePermIds = mod.permissions.map((p) => p.id);
    const allSelected = modulePermIds.every((id) => selectedPermissions.has(id));

    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        modulePermIds.forEach((id) => next.delete(id));
      } else {
        modulePermIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const selectAllPermissions = () => {
    const all = new Set<Permission | string>(ALL_PERMISSIONS.map((p) => p.key));
    setSelectedPermissions(all);
  };

  const clearAllPermissions = () => {
    setSelectedPermissions(new Set());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      error('Role name required', 'Please provide a descriptive name for the role.');
      return;
    }

    setIsSubmitting(true);
    const permsArray = Array.from(selectedPermissions) as Permission[];

    try {
      if (roleToEdit) {
        await roleService.updateRole(roleToEdit.id, {
          name,
          description,
          permissions: permsArray,
        });
        await logAdminAction('UPDATE', 'Roles', `Updated role permissions for "${name}"`, roleToEdit.id);
        success('Role updated', `Saved permissions for ${name}.`);
      } else {
        const created = await roleService.createRole({
          name,
          description,
          permissions: permsArray,
        });
        await logAdminAction('CREATE', 'Roles', `Created new custom role "${name}"`, created.id);
        success('Role created', `Custom role ${name} created successfully.`);
      }
      await refreshRoles();
      onSuccess();
      onClose();
    } catch (err: any) {
      error('Failed to save role', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={roleToEdit ? `Edit Role: ${roleToEdit.name}` : 'Create Custom Role'}
      subtitle="Define role metadata and assign fine-grained granular permissions."
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Role Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Regional Campaign Lead"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Manages North India influencer campaigns..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Permissions Matrix */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                Granular Permissions ({selectedPermissions.size} granted)
              </h4>
              <p className="text-[11px] text-slate-500">Check boxes to grant access to specific platform features.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAllPermissions}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer"
              >
                Select All
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={clearAllPermissions}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
            {PERMISSION_MODULES.map((module) => {
              const modulePermIds = module.permissions.map((p) => p.id);
              const allSelected = modulePermIds.every((id) => selectedPermissions.has(id));
              const someSelected = modulePermIds.some((id) => selectedPermissions.has(id));

              return (
                <div
                  key={module.name}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        {module.name} Module
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                        {module.permissions.length} actions
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleModulePermissions(module.name)}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      {allSelected ? 'Deselect Module' : 'Select All in Module'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {module.permissions.map((perm) => {
                      const isChecked = selectedPermissions.has(perm.id);
                      return (
                        <label
                          key={perm.id}
                          className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer select-none transition-colors ${
                            isChecked
                              ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePermission(perm.id)}
                            className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                              {perm.name}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                              {perm.description}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : roleToEdit ? 'Save Role Changes' : 'Create Role'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
