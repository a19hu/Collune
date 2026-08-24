import { Role, Permission } from '../types';
import { DEFAULT_ROLES } from '../constants/permissions';
import * as api from '../lib/api';

let rolesState: Role[] = [...DEFAULT_ROLES];

function mapApiRole(apiRole: api.AdminRoleApi): Role {
  return {
    id: apiRole.role_id,
    name: apiRole.name,
    description: apiRole.description,
    permissions: apiRole.is_wildcard ? ['*'] : (apiRole.permissions as Permission[]),
    userCount: apiRole.user_count,
    isSystem: apiRole.is_system,
    createdAt: apiRole.created_at,
    updatedAt: apiRole.updated_at,
  };
}

export const roleService = {
  getRoles: async (): Promise<Role[]> => {
    try {
      const apiRoles = await api.getAdminRoles();
      rolesState = apiRoles.map(mapApiRole);
      return [...rolesState];
    } catch (err) {
      // Not authenticated yet, or backend unreachable — keep working off the mock catalog.
      return [...rolesState];
    }
  },

  getRoleById: async (id: string): Promise<Role | null> => {
    return new Promise((resolve) => {
      const role = rolesState.find((r) => r.id === id) || null;
      setTimeout(() => resolve(role ? { ...role } : null), 100);
    });
  },

  createRole: async (roleData: { name: string; description: string; permissions: Permission[] }): Promise<Role> => {
    const created = await api.createAdminRole({
      name: roleData.name,
      description: roleData.description,
      permissions: roleData.permissions,
    });
    const newRole = mapApiRole(created);
    rolesState = [...rolesState, newRole];
    return newRole;
  },

  updateRole: async (id: string, updates: Partial<Role>): Promise<Role> => {
    const updated = await api.updateAdminRole(id, {
      name: updates.name,
      description: updates.description,
      permissions: updates.permissions,
    });
    const updatedRole = mapApiRole(updated);
    rolesState = rolesState.map((r) => (r.id === id ? updatedRole : r));
    return updatedRole;
  },

  duplicateRole: async (id: string): Promise<Role> => {
    const original = rolesState.find((r) => r.id === id);
    if (!original) {
      throw new Error('Original role not found');
    }
    const created = await api.createAdminRole({
      name: `${original.name} (Copy)`,
      description: `Cloned from ${original.name}. ${original.description}`,
      permissions: [...original.permissions],
    });
    const duplicateRole = mapApiRole(created);
    rolesState = [...rolesState, duplicateRole];
    return duplicateRole;
  },

  deleteRole: async (id: string, force = false): Promise<boolean> => {
    const role = rolesState.find((r) => r.id === id);
    if (role?.isSystem) {
      throw new Error('System roles cannot be deleted.');
    }
    await api.deleteAdminRole(id, force);
    rolesState = rolesState.filter((r) => r.id !== id);
    return true;
  },
};
