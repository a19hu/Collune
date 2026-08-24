import { StaffUser } from '../types';
import { mockStaffUsers } from '../mocks/mockData';
import * as api from '../lib/api';

let usersState: StaffUser[] = [...mockStaffUsers];

function mapApiUser(apiUser: api.AdminManagedUserApi): StaffUser {
  const assignedRole = apiUser.userrole?.assigned_role;
  return {
    id: apiUser.user_id,
    name: apiUser.name,
    email: apiUser.email,
    phone: apiUser.phone_no || '',
    department: 'Administration',
    roleId: assignedRole?.role_id || apiUser.userrole?.role_name || 'UNASSIGNED',
    roleName: assignedRole?.name || apiUser.userrole?.role_name || 'Unassigned',
    status: apiUser.is_active ? 'Active' : 'Inactive',
    lastLogin: apiUser.last_login_at || 'Never',
    createdAt: apiUser.created_at,
  };
}

export const userService = {
  getUsers: async (): Promise<StaffUser[]> => {
    try {
      const apiUsers = await api.getStaffUsers();
      usersState = apiUsers.map(mapApiUser);
      return [...usersState];
    } catch (err) {
      // Not authenticated yet, or backend unreachable — keep working off the mock catalog.
      return [...usersState];
    }
  },

  getUserById: async (id: string): Promise<StaffUser | null> => {
    return new Promise((resolve) => {
      const user = usersState.find((u) => u.id === id) || null;
      setTimeout(() => resolve(user ? { ...user } : null), 100);
    });
  },

  createUser: async (
    userData: Omit<StaffUser, 'id' | 'createdAt' | 'lastLogin'> & { password: string }
  ): Promise<StaffUser> => {
    const created = await api.createStaffUser({
      name: userData.name,
      email: userData.email,
      phone_no: userData.phone,
      password: userData.password,
      assigned_role_name: userData.roleName,
      is_active: userData.status === 'Active',
    });
    const newUser = mapApiUser(created);
    usersState = [newUser, ...usersState];
    return newUser;
  },

  updateUser: async (id: string, updates: Partial<StaffUser>): Promise<StaffUser> => {
    return new Promise((resolve, reject) => {
      const index = usersState.findIndex((u) => u.id === id);
      if (index === -1) {
        reject(new Error('User not found'));
        return;
      }
      usersState[index] = { ...usersState[index], ...updates };
      setTimeout(() => resolve({ ...usersState[index] }), 200);
    });
  },

  deleteUser: async (id: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const initialLen = usersState.length;
      usersState = usersState.filter((u) => u.id !== id);
      if (usersState.length === initialLen) {
        reject(new Error('User not found'));
        return;
      }
      setTimeout(() => resolve(true), 200);
    });
  },

  toggleUserStatus: async (id: string, status: 'Active' | 'Inactive' | 'Suspended'): Promise<StaffUser> => {
    return userService.updateUser(id, { status });
  },
};
