// ─────────────────────────────────────────────
// OODA — Auth Context (AsyncStorage-backed)
// ─────────────────────────────────────────────

import React, {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  clearAuthState,
  loadAuthState,
  saveAuthState,
} from './storage';

const VALID_USERNAME = 'user';
const VALID_PASSWORD = 'pass@admin';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on app start
  useEffect(() => {
    loadAuthState().then((value) => {
      setIsAuthenticated(value);
      setIsLoading(false);
    });
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    if (username.trim() === VALID_USERNAME && password === VALID_PASSWORD) {
      await saveAuthState(true);
      setIsAuthenticated(true);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await clearAuthState();
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
