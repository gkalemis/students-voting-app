import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, json, token } from '../api';
import { User } from '../types';
import { THEME_COLORS, applyThemeColor } from '../theme';
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
    if (token()) {
      api('/auth/logout', json('POST')).catch(() => {});
    }
    safeStorage.removeItem('auth_token');
    safeStorage.removeItem('theme_color');
    applyThemeColor(THEME_COLORS[0]);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, ready }}>
      {children}
    </AuthContext.Provider>
  );
}
