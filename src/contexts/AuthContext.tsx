import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: number;
  nama: string;
  role: string;
  pt: string;
  departemen: string;
  no_hp: string;
  mustChangePassword?: boolean;
  is_blocked?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const SESSION_EXPIRED_KEY = 'saza_session_expired';

// Only the requireAuth middleware returns these; other 401s (wrong password, etc.) must not log the user out.
const isAuthRejection = (body: unknown): boolean =>
  typeof body === 'object' &&
  body !== null &&
  typeof (body as { error?: unknown }).error === 'string' &&
  /^Unauthorized: (Invalid|Missing) token$|^Sesi (pengguna )?tidak valid/.test((body as { error: string }).error);

const clearStoredSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const currentToken = token || localStorage.getItem('token');
    if (!currentToken) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.user) {
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      }
    } catch (e) {
      // Ignore network errors on background sync
    }
  };

  const expireSession = () => {
    if (!localStorage.getItem('token')) return;
    clearStoredSession();
    sessionStorage.setItem(SESSION_EXPIRED_KEY, '1');
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const nativeFetch = window.fetch.bind(window);

    window.fetch = async (input, init) => {
      const res = await nativeFetch(input, init);
      if (res.status !== 401) return res;

      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (!url.includes('/api/') || url.includes('/api/auth/login')) return res;

      const body: unknown = await res.clone().json().catch(() => null);
      if (isAuthRejection(body)) expireSession();
      return res;
    };

    return () => {
      window.fetch = nativeFetch;
    };
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {}

      // Fetch live user role & data from server to keep in sync
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${storedToken}` }
      })
        .then(res => (res.ok ? res.json() : null))
        .then(data => {
          if (data && data.user) {
            setUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
          }
        })
        .catch(() => {});
    } else if (storedToken || storedUser) {
      clearStoredSession();
    }
    setLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    clearStoredSession();
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
