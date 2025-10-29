import type { Session, User } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabaseRendererClient } from "@/supabase/rendererClient";
import * as repository from "./repository";

export interface UseAuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: string | null;
  authenticated: boolean;
  emailVerified: boolean;
}

export interface UseAuthActions {
  login: (
    email: string,
    password: string,
  ) => Promise<repository.AuthResult<repository.AuthSessionInfo>>;
  register: (
    email: string,
    password: string,
  ) => Promise<repository.AuthResult<repository.AuthSessionInfo>>;
  logout: () => Promise<repository.AuthResult<null>>;
  resetPassword: (email: string) => Promise<repository.AuthResult<null>>;
  updatePassword: (
    newPassword: string,
  ) => Promise<repository.AuthResult<repository.AuthSessionInfo>>;
  getCurrentUser: () => Promise<repository.AuthResult<repository.AuthSessionInfo>>;
  resendVerification: (email: string) => Promise<repository.AuthResult<null>>;
  checkEmailVerification: () => Promise<boolean>;
  clearError: () => void;
}

export interface UseAuthReturn extends UseAuthState, UseAuthActions {}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function useAuth(): UseAuthReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    (async () => {
      try {
        const { data, error: sessionError } = await supabaseRendererClient.auth.getSession();
        if (!mountedRef.current) return;
        if (sessionError) {
          setError(sessionError.message);
        }
        setSession(data.session ?? null);
        setUser(data.session?.user ?? null);
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : "Unknown session fetch error");
        }
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();

    const {
      data: { subscription },
    } = supabaseRendererClient.auth.onAuthStateChange((_event, newSession) => {
      if (!mountedRef.current) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    const result = await repository.login(normalizeEmail(email), password);
    if (result.ok && result.data) {
      setUser(result.data.user);
    } else if (result.error) {
      setError(result.error);
    }
    return result;
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    setError(null);
    const result = await repository.register(normalizeEmail(email), password);
    if (result.ok && result.data) {
      setUser(result.data.user);
    } else if (result.error) {
      setError(result.error);
    }
    return result;
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    const result = await repository.logout();
    if (result.ok) {
      setUser(null);
      setSession(null);
    } else if (result.error) {
      setError(result.error);
    }
    return result;
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setError(null);
    const result = await repository.resetPassword(normalizeEmail(email));
    if (result.error) {
      setError(result.error);
    }
    return result;
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    setError(null);
    const result = await repository.updatePassword(newPassword);
    if (result.ok && result.data) {
      setUser(result.data.user);
    } else if (result.error) {
      setError(result.error);
    }
    return result;
  }, []);

  const getCurrentUser = useCallback(async () => {
    setError(null);
    const result = await repository.getCurrentUser();
    if (result.ok && result.data) {
      setUser(result.data.user);
    } else if (result.error) {
      setError(result.error);
    }
    return result;
  }, []);

  const resendVerification = useCallback(async (email: string) => {
    setError(null);
    const result = await repository.resendVerification(normalizeEmail(email));
    if (result.error) {
      setError(result.error);
    }
    return result;
  }, []);

  const checkEmailVerification = useCallback(async (): Promise<boolean> => {
    const result = await repository.getCurrentUser();
    if (result.ok && result.data) {
      setUser(result.data.user);
      return result.data.emailVerified;
    }
    return false;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const authenticated = !!user;
  const emailVerified = !!user?.email_confirmed_at;

  return {
    session,
    user,
    loading,
    error,
    authenticated,
    emailVerified,
    login,
    register,
    logout,
    resetPassword,
    updatePassword,
    getCurrentUser,
    resendVerification,
    checkEmailVerification,
    clearError,
  };
}
