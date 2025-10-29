import type { Session, User } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabaseRendererClient } from "./rendererClient";

/**
 * Internal helper to safely access the preload-exposed Supabase IPC API.
 * We defensively type it to avoid hard runtime failures if preload didn't mount it yet.
 */

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
          setInitError(err instanceof Error ? err.message : "Unknown session fetch error");
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

  const signInWithPassword = useCallback(async (creds: { email: string; password: string }) => {
    return supabaseRendererClient.auth.signInWithPassword(creds);
  }, []);

  const signUp = useCallback(async (creds: { email: string; password: string }) => {
    return supabaseRendererClient.auth.signUp(creds);
  }, []);

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
 * Main Supabase hook providing authentication functionality.
 *
 * Note: Quota management is now handled by the Edge Function API client.
 * Use the EdgeFunctionClient from @/lib/api for weekly summary generation.
 */
export function useSupabase() {
  return useSupabaseAuth();
}
