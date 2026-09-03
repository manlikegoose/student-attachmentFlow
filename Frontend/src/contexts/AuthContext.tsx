import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ApiError } from '../types/api';
import type { UserRole } from '../types/enums';
import * as authService from '../services/authService';
import type { CompanyRegistration, StudentRegistration } from '../services/authService';
import { getSession } from '../services/session';
import type { Session } from '../services/session';

interface AuthContextValue {
  session: Session | null;
  initialising: boolean;
  role: UserRole | null;
  login: (email: string, password: string) => Promise<Session>;
  loginAsDemo: (email: string) => Promise<Session>;
  registerStudent: (input: StudentRegistration) => Promise<Session>;
  registerCompany: (input: CompanyRegistration) => Promise<Session>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Home route per role — used after sign-in and by the role guard. */
export const HOME_ROUTES: Record<UserRole, string> = {
  STUDENT: '/student/dashboard',
  COMPANY: '/company/dashboard',
  COORDINATOR: '/coordinator/dashboard',
  SUPERVISOR: '/supervisor/dashboard',
  ADMIN: '/coordinator/dashboard'
};

export function AuthProvider({ children }: {children: React.ReactNode;}) {
  const [session, setSession] = useState<Session | null>(getSession());
  const [initialising, setInitialising] = useState(true);

  useEffect(() => {
    let cancelled = false;
    authService.
    me().
    then((s) => {
      if (!cancelled) setSession(s);
    }).
    catch(() => {
      if (!cancelled) setSession(null);
    }).
    finally(() => {
      if (!cancelled) setInitialising(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Expired-token handling: any 401 from a service call clears the session, which sends
   * the user to the sign-in screen with their intended destination preserved.
   */
  useEffect(() => {
    const onRejection = (event: PromiseRejectionEvent) => {
      if (event.reason instanceof ApiError && event.reason.status === 401) {
        setSession(null);
      }
    };
    const onLogout = () => setSession(null);

    window.addEventListener('unhandledrejection', onRejection);
    window.addEventListener('auth:logout', onLogout);
    
    return () => {
      window.removeEventListener('unhandledrejection', onRejection);
      window.removeEventListener('auth:logout', onLogout);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const s = await authService.login(email, password);
    setSession(s);
    return s;
  }, []);

  const loginAsDemo = useCallback(async (email: string) => {
    const s = await authService.loginAsDemo(email);
    setSession(s);
    return s;
  }, []);

  const registerStudent = useCallback(async (input: StudentRegistration) => {
    const s = await authService.registerStudent(input);
    setSession(s);
    return s;
  }, []);

  const registerCompany = useCallback(async (input: CompanyRegistration) => {
    const s = await authService.registerCompany(input);
    setSession(s);
    return s;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setSession(null);
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const s = await authService.refresh();
      setSession(s);
    } catch {
      setSession(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      initialising,
      role: session?.role ?? null,
      login,
      loginAsDemo,
      registerStudent,
      registerCompany,
      logout,
      refreshSession
    }),
    [session, initialising, login, loginAsDemo, registerStudent, registerCompany, logout, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}