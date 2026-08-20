import { StaffUser } from '../types';
import { mockStaffUsers } from '../mocks/mockData';

let usersState: StaffUser[] = [...mockStaffUsers];

export const userService = {
  getUsers: async (): Promise<StaffUser[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...usersState]), 150);
    });
  },

  getUserById: async (id: string): Promise<StaffUser | null> => {
    return new Promise((resolve) => {
      const user = usersState.find((u) => u.id === id) || null;
      setTimeout(() => resolve(user ? { ...user } : null), 100);
    });
  },

  createUser: async (userData: Omit<StaffUser, 'id' | 'createdAt' | 'lastLogin'>): Promise<StaffUser> => {
    return new Promise((resolve) => {
      const nextId = `ADM-${String(usersState.length + 1).padStart(3, '0')}`;
      const newUser: StaffUser = {
        ...userData,
        id: nextId,
        createdAt: new Date().toISOString(),
        lastLogin: 'Never',
      };
      usersState = [newUser, ...usersState];
      setTimeout(() => resolve(newUser), 200);
    });
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
