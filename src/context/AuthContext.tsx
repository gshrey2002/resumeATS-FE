'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  picture: string;
  draftLatex?: string;
  draftJobDescription?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoggedIn: boolean;
  loading: boolean;
  login: (googleCredential: string) => Promise<void>;
  logout: () => void;
  saveDraft: (latex: string, jd: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoggedIn: false,
  loading: true,
  login: async () => {},
  logout: () => {},
  saveDraft: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
      setToken(savedToken);
      fetchUser(savedToken).then((u) => {
        if (u) setUser(u);
        else {
          localStorage.removeItem('auth_token');
          setToken(null);
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchUser(jwt: string): Promise<UserProfile | null> {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  const login = useCallback(async (googleCredential: string) => {
    const res = await fetch(`${API_BASE}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: googleCredential }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }

    const data = await res.json();
    localStorage.setItem('auth_token', data.token);
    setToken(data.token);

    const fullUser = await fetchUser(data.token);
    if (fullUser) setUser(fullUser);
    else setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  }, []);

  const saveDraft = useCallback((latex: string, jd: string) => {
    const currentToken = localStorage.getItem('auth_token');
    if (!currentToken) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetch(`${API_BASE}/api/auth/draft`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${currentToken}` },
        body: JSON.stringify({ draftLatex: latex, draftJobDescription: jd }),
      }).catch(() => {});
    }, 2000);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoggedIn: !!user, loading, login, logout, saveDraft }}>
      {children}
    </AuthContext.Provider>
  );
}
