import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { setTokens, clearTokens, getAccessToken, getRefreshToken, onAuthExpired, resetSessionFlag } from '@/lib/trpc';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback((user: AuthUser, accessToken: string, refreshToken: string) => {
    resetSessionFlag(); // clear the expired flag so new requests go through
    setUser(user);
    localStorage.setItem('user', JSON.stringify(user));
    setTokens(accessToken, refreshToken);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
    clearTokens();
  }, []);

  // Only clear user if BOTH tokens are gone (no way to recover the session)
  useEffect(() => {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();
    if (!accessToken && !refreshToken) {
      setUser(null);
      localStorage.removeItem('user');
    }
  }, []);

  // Listen for auth expired events from the tRPC layer (refresh token rejected)
  useEffect(() => {
    return onAuthExpired(() => {
      setUser(null);
      localStorage.removeItem('user');
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
