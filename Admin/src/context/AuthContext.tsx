import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Permission, Role, StaffUser, AuditAction, ModuleName } from '../types';
import { roleService } from '../services/roleService';
import { auditLogService } from '../services/auditLogService';
import * as api from '../lib/api';

interface AuthContextType {
  currentUser: StaffUser;
  currentRole: Role;
  roles: Role[];
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<StaffUser>;
  logout: () => void;
  hasPermission: (permission: Permission | string) => boolean;
  refreshRoles: () => Promise<void>;
  logAdminAction: (action: AuditAction, module: ModuleName, description: string, targetId?: string) => Promise<void>;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cached { user, role } profile from the last real login, kept alongside the
// JWT session so a page refresh doesn't need a round trip to restore the UI.
const SESSION_PROFILE_KEY = 'collune_admin_session_profile';

const EMPTY_USER: StaffUser = {
  id: '',
  name: '',
  email: '',
  phone: '',
  department: 'Administration',
  roleId: '',
  roleName: '',
  status: 'Active',
  lastLogin: '',
  createdAt: '',
};

const UNASSIGNED_ROLE: Role = {
  id: 'UNASSIGNED',
  name: 'Unassigned',
  description: 'No permission set has been assigned to this staff account yet. Contact a Super Admin.',
  permissions: [],
  userCount: 0,
  isSystem: false,
  createdAt: '',
  updatedAt: '',
};

function readStoredProfile(): { user: StaffUser; role: Role } | null {
  try {
    const raw = localStorage.getItem(SESSION_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function mapAdminRoleToRole(adminRole: api.AdminRolePermissionsPayload | null | undefined): Role {
  if (!adminRole) return UNASSIGNED_ROLE;
  return {
    id: adminRole.roleId,
    name: adminRole.roleName,
    description: '',
    permissions: adminRole.isWildcard ? ['*'] : (adminRole.permissions as Permission[]),
    userCount: 0,
    isSystem: false,
    createdAt: '',
    updatedAt: '',
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const storedSession = api.getSession();
  const storedProfile = storedSession ? readStoredProfile() : null;

  const [roles, setRoles] = useState<Role[]>(storedProfile ? [storedProfile.role] : []);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!storedSession && !!storedProfile);
  const [currentUser, setCurrentUser] = useState<StaffUser>(storedProfile?.user || EMPTY_USER);
  const [currentRole, setCurrentRole] = useState<Role>(storedProfile?.role || UNASSIGNED_ROLE);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const refreshRoles = useCallback(async () => {
    try {
      const fetched = await roleService.getRoles();
      setRoles(fetched);
    } catch (err) {
      console.error('Failed to load roles', err);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refreshRoles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasPermission = useCallback(
    (permission: Permission | string): boolean => {
      if (!currentRole) return false;
      // Super Admin / wildcard role grants everything
      if (currentRole.permissions.includes('*')) {
        return true;
      }
      return currentRole.permissions.includes(permission as Permission);
    },
    [currentRole]
  );

  const login = useCallback(
    async (email: string, password: string): Promise<StaffUser> => {
      const response = await api.login(email, password);
      if (response.user.role !== 'Admin') {
        throw new Error('This portal is for Collune staff accounts only.');
      }

      const role = mapAdminRoleToRole(response.user.adminRole);
      const user: StaffUser = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        phone: '',
        department: 'Administration',
        roleId: role.id,
        roleName: role.name,
        status: 'Active',
        lastLogin: 'Just now',
        createdAt: new Date().toISOString(),
      };

      api.saveSession({ access: response.access, refresh: response.refresh });
      localStorage.setItem(SESSION_PROFILE_KEY, JSON.stringify({ user, role }));

      setCurrentUser(user);
      setCurrentRole(role);
      setRoles((prev) => (prev.some((r) => r.id === role.id) ? prev : [role, ...prev]));
      setIsAuthenticated(true);
      refreshRoles();

      return user;
    },
    [refreshRoles]
  );

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setCurrentUser(EMPTY_USER);
    setCurrentRole(UNASSIGNED_ROLE);
    api.clearSession();
    localStorage.removeItem(SESSION_PROFILE_KEY);
    api.signout().catch(() => {});
  }, []);

  const logAdminAction = useCallback(
    async (action: AuditAction, module: ModuleName, description: string, targetId?: string) => {
      await auditLogService.logAction({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.roleName,
        action,
        module,
        description,
        targetId,
      });
    },
    [currentUser]
  );

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        roles,
        isAuthenticated,
        login,
        logout,
        hasPermission,
        refreshRoles,
        logAdminAction,
        theme,
        toggleTheme,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
