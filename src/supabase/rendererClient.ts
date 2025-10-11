import { createClient } from "@supabase/supabase-js";
import type { Database } from "./db.types";

/**
 * Resolve Supabase URL and anon key with dual fallback strategy:
 * 1. Vite public prefixed vars (recommended convention): VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
 * 2. Plain env names (SUPABASE_URL / SUPABASE_ANON_KEY) for projects not using prefix
 * 3. process.env.* (mainly for tests or if injected at runtime)
 *
 * Note: Only the anon/public key is ever used here. Service role key MUST NOT be imported
 * or referenced in renderer code.
 */
const url =
  (import.meta as any).env?.VITE_SUPABASE_URL ??
  (import.meta as any).env?.SUPABASE_URL ??
  (typeof process !== "undefined" ? process.env.SUPABASE_URL : undefined);

const anonKey =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ??
  (import.meta as any).env?.SUPABASE_ANON_KEY ??
  (typeof process !== "undefined" ? process.env.SUPABASE_ANON_KEY : undefined);

if (!url || !anonKey) {
  // Intentionally concise error to avoid leaking partially configured values
  throw new Error(
    "[Supabase] Missing SUPABASE_URL or SUPABASE_ANON_KEY for renderer client. Check your .env / Vite env configuration.",
  );
}

/**
 * Supabase client for renderer (anon key only).
 *
 * Auth configuration:
 * - persistSession: true (default) so user stays logged in across app restarts.
 * - autoRefreshToken: true to refresh JWT before expiry.
 * - detectSessionInUrl: false could be set if you don't use OAuth URL flows inside the renderer;
 *   leaving true is harmless unless you explicitly handle deep links differently.
 */
export const supabaseRendererClient = createClient<Database>(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Helper: fetch current session user (typed).
 * Usage example inside React:
 *   const user = await getCurrentUser();
 */
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabaseRendererClient.auth.getUser();
  if (error) {
    // Deliberately not throwing to make caller ergonomics simpler
    console.warn("[Supabase] getCurrentUser error:", error.message);
  }
  return user;
}

/**
 * Helper: sign out current user.
 */
export function signOut() {
  return supabaseRendererClient.auth.signOut();
}

/**
 * NOTE:
 * Do NOT add any privileged (service role) operations here.
 * Quota updates or admin actions must go through a main process IPC bridge
 * that uses a service-role client isolated from the renderer bundle.
 */
