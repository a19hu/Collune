import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Permission, Role, StaffUser, AuditAction, ModuleName } from '../types';
import { DEFAULT_ROLES } from '../constants/permissions';
import { roleService } from '../services/roleService';
import { auditLogService } from '../services/auditLogService';
import { useToast } from './ToastContext';

interface AuthContextType {
  currentUser: StaffUser;
  currentRole: Role;
  roles: Role[];
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<StaffUser>;
  logout: () => void;
  hasPermission: (permission: Permission | string) => boolean;
  switchDemoRole: (roleId: string) => void;
  refreshRoles: () => Promise<void>;
  logAdminAction: (action: AuditAction, module: ModuleName, description: string, targetId?: string) => Promise<void>;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo-only session gate: no real backend, so any listed staff email + this password unlocks the portal.
const DEMO_LOGIN_PASSWORD = 'Collune@123';
const AUTH_SESSION_KEY = 'collune_admin_session';

function readStoredSession(): { roleId: string } | null {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const DEMO_USERS_BY_ROLE: Record<string, Partial<StaffUser>> = {
  'ROLE-SUPER-ADMIN': {
    id: 'ADM-001',
    name: 'Ashutosh Kumar',
    email: 'admin@collune.com',
    department: 'Administration',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  'ROLE-ADMIN': {
    id: 'ADM-011',
    name: 'Siddharth Roy',
    email: 'siddharth.admin@collune.com',
    department: 'Administration',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  },
  'ROLE-OPS-MANAGER': {
    id: 'ADM-002',
    name: 'Pooja Hegde',
    email: 'pooja.ops@collune.com',
    department: 'Operations',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  },
  'ROLE-CREATOR-MANAGER': {
    id: 'ADM-003',
    name: 'Rohan Deshmukh',
    email: 'rohan.creators@collune.com',
    department: 'Creator Management',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  'ROLE-CAMPAIGN-MANAGER': {
    id: 'ADM-004',
    name: 'Meera Sengupta',
    email: 'meera.campaigns@collune.com',
    department: 'Campaign Management',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
  'ROLE-BRAND-MANAGER': {
    id: 'ADM-005',
    name: 'Vikram Malhotra',
    email: 'vikram.brands@collune.com',
    department: 'Brand Management',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
  'ROLE-EXPORT-TEAM': {
    id: 'ADM-006',
    name: 'Priya Singh',
    email: 'priya.data@collune.com',
    department: 'Export/Data',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  },
  'ROLE-FINANCE-MANAGER': {
    id: 'ADM-007',
    name: 'Arjun Nair',
    email: 'arjun.finance@collune.com',
    department: 'Finance',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
  },
  'ROLE-SUPPORT-EXEC': {
    id: 'ADM-008',
    name: 'Sunita Rao',
    email: 'sunita.support@collune.com',
    department: 'Support',
    avatarUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const storedSession = readStoredSession();
  const [roles, setRoles] = useState<Role[]>(DEFAULT_ROLES);
  const [activeRoleId, setActiveRoleId] = useState<string>(storedSession?.roleId || 'ROLE-SUPER-ADMIN');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!storedSession);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const { info } = useToast();

  const refreshRoles = useCallback(async () => {
    try {
      const fetched = await roleService.getRoles();
      setRoles(fetched);
    } catch (err) {
      console.error('Failed to load roles', err);
    }
  }, []);

  useEffect(() => {
    refreshRoles();
  }, [refreshRoles]);

  const currentRole: Role =
    roles.find((r) => r.id === activeRoleId) ||
    roles[0] ||
    DEFAULT_ROLES[0];

  const demoProfile = DEMO_USERS_BY_ROLE[activeRoleId] || {
    id: 'ADM-DEMO',
    name: `${currentRole.name} User`,
    email: `${currentRole.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@collune.com`,
    department: 'Operations',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  };

  const currentUser: StaffUser = {
    id: demoProfile.id || 'ADM-001',
    name: demoProfile.name || 'Ashutosh Kumar',
    email: demoProfile.email || 'admin@collune.com',
    phone: '+91 98765 43210',
    avatarUrl: demoProfile.avatarUrl,
    department: (demoProfile.department as any) || 'Administration',
    roleId: currentRole.id,
    roleName: currentRole.name,
    status: 'Active',
    lastLogin: 'Just now',
    createdAt: '2025-01-01T00:00:00Z',
  };

  const hasPermission = useCallback(
    (permission: Permission | string): boolean => {
      if (!currentRole) return false;
      // Super Admin wildcard '*' grants everything
      if (currentRole.permissions.includes('*')) {
        return true;
      }
      return currentRole.permissions.includes(permission as Permission);
    },
    [currentRole]
  );

  const switchDemoRole = useCallback(
    (roleId: string) => {
      const targetRole = roles.find((r) => r.id === roleId);
      if (targetRole) {
        setActiveRoleId(roleId);
        info(`Switched to ${targetRole.name}`, `Now viewing the dashboard with ${targetRole.permissions.includes('*') ? 'All' : targetRole.permissions.length} permissions.`);
      }
    },
    [roles, info]
  );

  const login = useCallback((email: string, password: string): Promise<StaffUser> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const normalizedEmail = email.trim().toLowerCase();
        const matchedRoleId = Object.entries(DEMO_USERS_BY_ROLE).find(
          ([, profile]) => profile.email?.toLowerCase() === normalizedEmail
        )?.[0];

        if (!matchedRoleId || password !== DEMO_LOGIN_PASSWORD) {
          reject(new Error('Invalid email or password.'));
          return;
        }

        setActiveRoleId(matchedRoleId);
        setIsAuthenticated(true);
        localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ roleId: matchedRoleId }));

        const profile = DEMO_USERS_BY_ROLE[matchedRoleId];
        const role = roles.find((r) => r.id === matchedRoleId) || DEFAULT_ROLES[0];
        resolve({
          id: profile.id || 'ADM-DEMO',
          name: profile.name || role.name,
          email: profile.email || normalizedEmail,
          phone: '+91 98765 43210',
          avatarUrl: profile.avatarUrl,
          department: (profile.department as any) || 'Administration',
          roleId: role.id,
          roleName: role.name,
          status: 'Active',
          lastLogin: 'Just now',
          createdAt: '2025-01-01T00:00:00Z',
        });
      }, 400);
    });
  }, [roles]);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_SESSION_KEY);
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
        switchDemoRole,
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
