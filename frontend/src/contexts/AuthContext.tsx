import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, loginWithEmail, signOutApi, type LoginApiUser } from '../lib/authApi';
import type { UserAccount } from '../types';

type AuthContextValue = {
  currentUser: UserAccount | null;
  isAuthLoading: boolean;
  login: (email: string, password: string) => Promise<UserAccount>;
  logout: () => Promise<void>;
  setSessionUser: (user: UserAccount) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const mapApiRoleToUiRole = (role?: string | null): UserAccount['role'] => {
  const normalized = (role || '').toUpperCase();
  if (normalized === 'SUPER_ADMIN') return 'Super Admin';
  if (normalized === 'CREATOR') return 'Creator';
  if (normalized === 'BRAND') return 'Brand';
  if (normalized === 'ADMIN') return 'Super Admin';
  return 'Super Admin';
};

const mapApiUserToUiUser = (user: LoginApiUser): UserAccount => ({
  id: user.user_id,
  phone: user.phone_no || '',
  name: user.name || user.username,
  email: user.email,
  role: mapApiRoleToUiRole(user.role),
  schoolCode: user.school || undefined,
});

const clearAuthStorage = () => {
  localStorage.removeItem('saaserp_session_user');
  localStorage.removeItem('saaserp_access_token');
  localStorage.removeItem('saaserp_refresh_token');
  localStorage.removeItem('saaserp_drf_token');
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const raw = localStorage.getItem('saaserp_session_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const setSessionUser = useCallback((user: UserAccount) => {
    setCurrentUser(user);
    localStorage.setItem('saaserp_session_user', JSON.stringify(user));
  }, []);

  useEffect(() => {
    const boot = async () => {
      const access = localStorage.getItem('saaserp_access_token');
      const drf = localStorage.getItem('saaserp_drf_token');
      if (!access && !drf) {
        setIsAuthLoading(false);
        return;
      }

      try {
        const me = await getMe();
        setSessionUser(mapApiUserToUiUser(me.user));
      } catch {
        clearAuthStorage();
        setCurrentUser(null);
        navigate('/login', { replace: true });
      } finally {
        setIsAuthLoading(false);
      }
    };
    void boot();
  }, [navigate, setSessionUser]);

  useEffect(() => {
    const handleSessionExpired = () => {
      clearAuthStorage();
      setCurrentUser(null);
      navigate('/login', { replace: true });
    };

    window.addEventListener('saaserp:session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('saaserp:session-expired', handleSessionExpired);
    };
  }, [navigate]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginWithEmail(email, password);
    const user = mapApiUserToUiUser(response.user);
    localStorage.setItem('saaserp_access_token', response.access);
    localStorage.setItem('saaserp_refresh_token', response.refresh);
    localStorage.setItem('saaserp_drf_token', response.token);
    localStorage.setItem('saaserp_last_login_username', response.user.email || email);
    setSessionUser(user);
    return user;
  }, [setSessionUser]);

  const logout = useCallback(async () => {
    await signOutApi().catch(() => undefined);
    clearAuthStorage();
    setCurrentUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  const value = useMemo<AuthContextValue>(() => ({
    currentUser,
    isAuthLoading,
    login,
    logout,
    setSessionUser,
  }), [currentUser, isAuthLoading, login, logout, setSessionUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }
  return context;
};
