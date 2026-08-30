import { StaffUser } from '../types';
import * as api from '../lib/api';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

let usersState: StaffUser[] = [];

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
    const apiUsers = await api.getStaffUsers();
    usersState = apiUsers.map(mapApiUser);
    return [...usersState];
  },

  getUserById: async (id: string): Promise<StaffUser | null> => {
    try {
      const apiUser = await api.getStaffUser(id);
      const user = mapApiUser(apiUser);
      const index = usersState.findIndex((existing) => existing.id === id);
      if (index >= 0) usersState[index] = user;
      else usersState = [user, ...usersState];
      return { ...user };
    } catch {
      return null;
    }
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
    const assignedRoleId = updates.roleId && UUID_PATTERN.test(updates.roleId) ? updates.roleId : undefined;
    const updated = await api.updateStaffUser(id, {
      name: updates.name,
      email: updates.email,
      phone_no: updates.phone,
      assigned_role_id: assignedRoleId,
      assigned_role_name: assignedRoleId ? undefined : updates.roleName,
      is_active: updates.status ? updates.status === 'Active' : undefined,
    });
    const mapped = mapApiUser(updated);
    const index = usersState.findIndex((user) => user.id === id);
    if (index >= 0) usersState[index] = mapped;
    else usersState = [mapped, ...usersState];
    return { ...mapped };
  },

  deleteUser: async (id: string): Promise<boolean> => {
    await api.deleteStaffUser(id);
    usersState = usersState.filter((user) => user.id !== id);
    return true;
  },

  toggleUserStatus: async (id: string, status: 'Active' | 'Inactive'): Promise<StaffUser> => {
    return userService.updateUser(id, { status });
  },
};
