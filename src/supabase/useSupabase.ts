import { useCallback, useEffect, useRef, useState } from "react";
import { supabaseRendererClient } from "./rendererClient";
import type { Session, User } from "@supabase/supabase-js";

/**
 * Internal helper to safely access the preload-exposed Supabase IPC API.
 * We defensively type it to avoid hard runtime failures if preload didn't mount it yet.
 */
function getPreloadSupabaseApi():
  | {
      incrementQuota: (userId: string) => Promise<{
        success: boolean;
        newCount?: number;
        error?: string;
        inserted?: boolean;
        userId?: string;
      }>;
      getQuota: (userId: string) => Promise<{
        success: boolean;
        count?: number;
        cycleStartAt?: string;
        updatedAt?: string;
        error?: string;
        userId?: string;
      }>;
    }
  | undefined {
  // @ts-expect-error Window global is augmented by preload; ambient types may be added separately.
  return typeof window !== "undefined" ? window?.appApi?.supabase : undefined;
}

/**
 * Hook managing Supabase auth session + current user.
 *
 * Provides:
 * - session (Supabase Session | null)
 * - user (Supabase User | null)
 * - loading (initial fetch state)
 * - error (string | null) for initial session retrieval (not auth actions)
 * - signInWithPassword({ email, password })
 * - signUp({ email, password })
 * - signOut()
 *
 * NOTE: This uses the renderer (anon) client only. Do not put privileged logic here.
 */
export function useSupabaseAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // Initial session fetch
    (async () => {
      try {
        const { data, error } = await supabaseRendererClient.auth.getSession();
        if (!mountedRef.current) return;
        if (error) {
          setInitError(error.message);
        }
        setSession(data.session ?? null);
        setUser(data.session?.user ?? null);
      } catch (err) {
        if (mountedRef.current) {
          setInitError(
            err instanceof Error ? err.message : "Unknown session fetch error",
          );
        }
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();

    // Auth state subscription
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

  const signInWithPassword = useCallback(
    async (creds: { email: string; password: string }) => {
      return supabaseRendererClient.auth.signInWithPassword(creds);
    },
    [],
  );

  const signUp = useCallback(
    async (creds: { email: string; password: string }) => {
      return supabaseRendererClient.auth.signUp(creds);
    },
    [],
  );

  const signOut = useCallback(async () => {
    return supabaseRendererClient.auth.signOut();
  }, []);

  return {
    session,
    user,
    loading,
    error: initError,
    signInWithPassword,
    signUp,
    signOut,
  };
}

/**
 * Hook exposing privileged quota operations via preload IPC bridge.
 *
 * Only returns functions if the preload Supabase API is present; otherwise they
 * are undefined (allowing conditional UI).
 *
 * These operations depend on the service role key (in main process) and
 * SHOULD NOT be directly accessible using the anon client.
 */
export function useQuotaApi() {
  const api = getPreloadSupabaseApi();

  const incrementQuota = useCallback(
    async (userId: string) => {
      if (!api) {
        throw new Error(
          "Quota API unavailable (preload supabase handlers not registered).",
        );
      }
      return api.incrementQuota(userId);
    },
    [api],
  );

  const getQuota = useCallback(
    async (userId: string) => {
      if (!api) {
        throw new Error(
          "Quota API unavailable (preload supabase handlers not registered).",
        );
      }
      return api.getQuota(userId);
    },
    [api],
  );

  return {
    available: Boolean(api),
    incrementQuota: api ? incrementQuota : undefined,
    getQuota: api ? getQuota : undefined,
  };
}

/**
 * Convenience composite hook if you often need auth + quota actions together.
 */
export function useSupabase() {
  const auth = useSupabaseAuth();
  const quota = useQuotaApi();
  return { ...auth, quota };
}
