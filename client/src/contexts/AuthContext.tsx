import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithEmail, signOutApi } from '../lib/authApi';
import type { UserAccount } from '../types';
import { authStorage } from './authStorage';
import { showProjectToast } from '../HtmlComponents/HtmlRoster';

type AuthContextValue = {
  currentUser: UserAccount | null;
  isAuthLoading: boolean;
  login: (email: string, password: string) => Promise<UserAccount>;
  logout: () => Promise<void>;
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

  const logout = useCallback(async () => {
    try {
      await signOutApi();
    } catch {
      // Ignore logout API failures
    } finally {
      clearSession();
      setCurrentUser(null);
      showProjectToast('info', 'Logged out', 'You have been signed out successfully.');
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const handleSessionExpired = () => {
      clearSession();
      setCurrentUser(null);
      showProjectToast('error', 'Session expired', 'Please log in again to continue.');
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

  const value = useMemo(
    () => ({
      currentUser,
      isAuthLoading,
      login,
      logout,
      setSessionUser,
    }),
    [currentUser, isAuthLoading, login, logout, setSessionUser]
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
