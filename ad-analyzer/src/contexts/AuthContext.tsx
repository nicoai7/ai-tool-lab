'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiUrl } from '@/lib/api-url';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  accountId: string | null;
  accountName: string | null;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: () => void;
  logout: () => void;
  selectAccount: (accountId: string, accountName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    accountId: null,
    accountName: null,
    error: null,
  });

  // 起動時に認証状態を確認
  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch(apiUrl('/api/auth/status'));
      const data = await res.json();
      setState({
        isAuthenticated: data.authenticated,
        isLoading: false,
        accountId: data.accountId || null,
        accountName: data.accountName || null,
        error: null,
      });
    } catch {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }

  function login() {
    window.location.href = apiUrl('/api/auth/meta');
  }

  async function logout() {
    await fetch(apiUrl('/api/auth/logout'), { method: 'POST' });
    setState({
      isAuthenticated: false,
      isLoading: false,
      accountId: null,
      accountName: null,
      error: null,
    });
  }

  async function selectAccount(accountId: string, accountName: string) {
    try {
      const res = await fetch(apiUrl('/api/auth/select-account'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, accountName }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `アカウント切替に失敗しました (status ${res.status})`);
      }
      setState(prev => ({ ...prev, accountId, accountName, error: null }));
    } catch (e) {
      setState(prev => ({ ...prev, error: (e as Error).message }));
    }
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout, selectAccount }}>
      {children}
    </AuthContext.Provider>
  );
}
