const STORAGE = {
  USER: 'saaserp_session_user',
  ACCESS: 'saaserp_access_token',
  REFRESH: 'saaserp_refresh_token',
  DRF: 'saaserp_drf_token',
  EMAIL: 'email',
} as const;

const SESSION_KEYS = [
  STORAGE.USER,
  STORAGE.ACCESS,
  STORAGE.REFRESH,
  STORAGE.DRF,
] as const;

export const authStorage = {
  getUser() {
    const user = localStorage.getItem(STORAGE.USER);
    return user ? JSON.parse(user) : null;
  },

  setUser(user: unknown) {
    localStorage.setItem(STORAGE.USER, JSON.stringify(user));
  },

  getRememberedEmail() {
    return localStorage.getItem(STORAGE.EMAIL) || '';
  },

  setRememberedEmail(email: string) {
    localStorage.setItem(STORAGE.EMAIL, email);
  },

  getAccessToken() {
    return localStorage.getItem(STORAGE.ACCESS);
  },

  getDrfToken() {
    return localStorage.getItem(STORAGE.DRF);
  },

  setTokens(access: string, refresh: string, drf: string) {
    localStorage.setItem(STORAGE.ACCESS, access);
    localStorage.setItem(STORAGE.REFRESH, refresh);
    localStorage.setItem(STORAGE.DRF, drf);
  },

  clear() {
    SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
  },

  isAuthenticated() {
    return !!this.getAccessToken();
  },
};
