import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, token } from '../api';
import { User } from '../types';
import { applyThemeColor } from '../theme';
import { safeStorage } from '../utils/storage';

interface AuthContextType {
  user: User | null;
  setUser: (u: User | null) => void;
  logout: () => void;
  ready: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  logout: () => {},
  ready: false
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!token());

  useEffect(() => {
    applyThemeColor();
    if (token()) {
      api('/auth/me')
        .then(u => {
          setUser(u);
          if (u?.theme_color) applyThemeColor(u.theme_color);
        })
        .catch(() => {
          safeStorage.removeItem('auth_token');
          setUser(null);
        })
        .finally(() => setReady(true));
    } else {
      setReady(true);
    }
  }, []);

  const logout = () => {
    safeStorage.removeItem('auth_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, ready }}>
      {children}
    </AuthContext.Provider>
  );
}
