import { Role, Permission } from '../types';
import { DEFAULT_ROLES } from '../constants/permissions';

let rolesState: Role[] = [...DEFAULT_ROLES];

export const roleService = {
  getRoles: async (): Promise<Role[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...rolesState]), 150);
    });
  },

  getRoleById: async (id: string): Promise<Role | null> => {
    return new Promise((resolve) => {
      const role = rolesState.find((r) => r.id === id) || null;
      setTimeout(() => resolve(role ? { ...role } : null), 100);
    });
  },

  createRole: async (roleData: { name: string; description: string; permissions: Permission[] }): Promise<Role> => {
    return new Promise((resolve) => {
      const newRole: Role = {
        id: `ROLE-${roleData.name.toUpperCase().replace(/[^A-Z0-9]/g, '-').slice(0, 20)}-${Date.now().toString().slice(-4)}`,
        name: roleData.name,
        description: roleData.description,
        permissions: roleData.permissions,
        userCount: 0,
        isSystem: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      rolesState = [...rolesState, newRole];
      setTimeout(() => resolve(newRole), 200);
    });
  },

  updateRole: async (id: string, updates: Partial<Role>): Promise<Role> => {
    return new Promise((resolve, reject) => {
      const index = rolesState.findIndex((r) => r.id === id);
      if (index === -1) {
        reject(new Error('Role not found'));
        return;
      }
      rolesState[index] = {
        ...rolesState[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      setTimeout(() => resolve({ ...rolesState[index] }), 200);
    });
  },

  duplicateRole: async (id: string): Promise<Role> => {
    return new Promise((resolve, reject) => {
      const original = rolesState.find((r) => r.id === id);
      if (!original) {
        reject(new Error('Original role not found'));
        return;
      }
      const duplicateRole: Role = {
        id: `ROLE-${original.name.toUpperCase().replace(/[^A-Z0-9]/g, '-')}-COPY-${Date.now().toString().slice(-4)}`,
        name: `${original.name} (Copy)`,
        description: `Cloned from ${original.name}. ${original.description}`,
        permissions: [...original.permissions],
        userCount: 0,
        isSystem: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      rolesState = [...rolesState, duplicateRole];
      setTimeout(() => resolve(duplicateRole), 200);
    });
  },

  deleteRole: async (id: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const role = rolesState.find((r) => r.id === id);
      if (!role) {
        reject(new Error('Role not found'));
        return;
      }
      if (role.isSystem || role.id === 'ROLE-SUPER-ADMIN') {
        reject(new Error('Super Admin / System roles cannot be deleted.'));
        return;
      }
      rolesState = rolesState.filter((r) => r.id !== id);
      setTimeout(() => resolve(true), 200);
    });
  },
};
