import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, loginWithEmail, signOutApi } from '../lib/authApi';
import type { UserAccount } from '../types';
import { authStorage } from './authStorage';

type AuthContextValue = {
  currentUser: UserAccount | null;
  isAuthLoading: boolean;
  login: (email: string, password: string) => Promise<UserAccount>;
  logout: () => Promise<void>;
  refreshSessionUser: () => Promise<UserAccount | null>;
  setSessionUser: (user: UserAccount | null) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const getStoredUser = (): UserAccount | null => {
  try {
    return authStorage.getUser();
  } catch {
    return null;
  }
};

const persistSession = (response: any) => {
  authStorage.setTokens(response.access, response.refresh, response.token);
  authStorage.setUser(response.user);
  if (response.user?.email) {
    authStorage.setRememberedEmail(response.user.email);
  }
};

const clearSession = () => {
  authStorage.clear();
};

function toSessionUser(user: any): UserAccount {
  return {
    name: user.name || user.email || "",
    email: user.email,
    role: user.role,
    verification_status: user.verification_status,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(
    getStoredUser
  );

  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    setIsAuthLoading(false);
  }, []);

  const setSessionUser = useCallback((user: UserAccount | null) => {
    setCurrentUser(user);

    if (user) {
      authStorage.setUser(user);
      authStorage.setRememberedEmail(user.email);
    } else {
      authStorage.clear();
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await loginWithEmail(email, password);

      persistSession(response);
      setCurrentUser(response.user);

      return response.user;
    },
    []
  );

  const refreshSessionUser = useCallback(async () => {
    if (!authStorage.isAuthenticated()) return null;
    const response = await getMe();
    const nextUser = toSessionUser(response.user);
    setCurrentUser(nextUser);
    authStorage.setUser(nextUser);
    if (nextUser.email) {
      authStorage.setRememberedEmail(nextUser.email);
    }
    return nextUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOutApi();
    } catch {
      // Ignore logout API failures
    } finally {
      clearSession();
      setCurrentUser(null);
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const handleSessionExpired = () => {
      clearSession();
      setCurrentUser(null);
      navigate('/login', { replace: true });
    };

    window.addEventListener(
      'saaserp:session-expired',
      handleSessionExpired
    );

    return () => {
      window.removeEventListener(
        'saaserp:session-expired',
        handleSessionExpired
      );
    };
  }, [navigate]);

  useEffect(() => {
    if (!currentUser) return;

    void refreshSessionUser().catch(() => undefined);

    const interval = window.setInterval(() => {
      void refreshSessionUser().catch(() => undefined);
    }, 15000);

    const refreshOnFocus = () => {
      void refreshSessionUser().catch(() => undefined);
    };
    const refreshOnVisibility = () => {
      if (document.visibilityState === "visible") {
        void refreshSessionUser().catch(() => undefined);
      }
    };

    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshOnVisibility);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshOnVisibility);
    };
  }, [currentUser?.email, refreshSessionUser]);

  const value = useMemo(
    () => ({
      currentUser,
      isAuthLoading,
      login,
      logout,
      refreshSessionUser,
      setSessionUser,
    }),
    [currentUser, isAuthLoading, login, logout, refreshSessionUser, setSessionUser]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
};
