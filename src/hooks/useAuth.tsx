import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Department } from '../types/note';
import type { CreateUserInput, Role, ShareableUser, User } from '../types/user';
import { authService } from '../services/auth/auth';
import { setSessionUser } from '../services/auth/session';
import { readDemoSession } from '../services/demo/constants';

interface Ctx {
  user: User | null;
  loading: boolean;
  error: string | null;
  /** Verdadero cuando la sesión activa es la demostración local. */
  isDemoMode: boolean;
  login(e: string, p: string, r: boolean): Promise<void>;
  startDemo(): Promise<void>;
  logout(): Promise<void>;
  refresh(): Promise<void>;
  listUsers(): Promise<User[]>;
  listShareableUsers(): Promise<ShareableUser[]>;
  createUser(input: CreateUserInput): Promise<User>;
  deleteUser(id: string): Promise<void>;
  updateAccess(id: string, role: Role, area_id: Department | null): Promise<User>;
}

const AuthCtx = createContext<Ctx | null>(null);

export const useAuth = () => {
  const context = useContext(AuthCtx);
  if (!context) throw new Error('AuthProvider ausente');
  return context;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applyUser = useCallback((next: User | null) => {
    setSessionUser(next);
    setUser(next);
    setIsDemoMode(!!next && readDemoSession() !== null);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const current = await authService.me();
      applyUser(current);
    } catch (cause) {
      applyUser(null);
      setError(cause instanceof Error ? cause.message : 'No se pudo comprobar la sesión local.');
    } finally {
      setLoading(false);
    }
  }, [applyUser]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const current = await authService.me();
        if (!cancelled) applyUser(current);
      } catch (cause) {
        if (!cancelled) {
          applyUser(null);
          setError(cause instanceof Error ? cause.message : 'No se pudo comprobar la sesión local.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [applyUser]);

  const login = useCallback(async (email: string, password: string, remember: boolean) => {
    setError(null);
    const current = await authService.login(email, password, remember);
    applyUser(current);
  }, [applyUser]);

  const startDemo = useCallback(async () => {
    setError(null);
    const current = await authService.startDemo();
    applyUser(current);
  }, [applyUser]);

  const logout = useCallback(async () => {
    setError(null);
    try {
      await authService.logout();
    } finally {
      applyUser(null);
    }
  }, [applyUser]);

  const listUsers = useCallback(() => authService.listUsers(), []);
  const listShareableUsers = useCallback(() => authService.listShareableUsers(), []);
  const createUser = useCallback((input: CreateUserInput) => authService.createUser(input), []);
  const deleteUser = useCallback((id: string) => authService.deleteUser(id), []);

  const updateAccess = useCallback(async (id: string, role: Role, area_id: Department | null) => {
    const updated = await authService.updateAccess(id, role, area_id);
    setUser((current) => (current && current.id === updated.id ? updated : current));
    return updated;
  }, []);

  const value = useMemo<Ctx>(() => ({
    user,
    loading,
    error,
    isDemoMode,
    login,
    startDemo,
    logout,
    refresh,
    listUsers,
    listShareableUsers,
    createUser,
    deleteUser,
    updateAccess,
  }), [user, loading, error, isDemoMode, login, startDemo, logout, refresh, listUsers, listShareableUsers, createUser, deleteUser, updateAccess]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
