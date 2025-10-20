import { supabaseRendererClient } from "@/supabase/rendererClient";
import type { User } from "@supabase/supabase-js";

/**
 * AuthRepository - typed wrapper around Supabase auth methods.
 * Provides normalized return shapes and error objects for UI consumption.
 */
export interface AuthResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface AuthSessionInfo {
  user: User | null;
  emailVerified: boolean;
}

function normalizeError(error: any): string {
  if (!error) return "Unknown authentication error";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (error.message) return String(error.message);
  return "Authentication failed";
}

export async function login(email: string, password: string): Promise<AuthResult<AuthSessionInfo>> {
  try {
    const { data, error } = await supabaseRendererClient.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { ok: false, error: normalizeError(error) };
    const user = data.user ?? null;
    return {
      ok: true,
      data: {
        user,
        emailVerified: !!user?.email_confirmed_at,
      },
    };
  } catch (err) {
    return { ok: false, error: normalizeError(err) };
  }
}

export async function register(
  email: string,
  password: string,
): Promise<AuthResult<AuthSessionInfo>> {
  try {
    const { data, error } = await supabaseRendererClient.auth.signUp({ email, password });
    if (error) return { ok: false, error: normalizeError(error) };
    const user = data.user ?? null;
    // New users usually unverified until they click email link
    return {
      ok: true,
      data: {
        user,
        emailVerified: !!user?.email_confirmed_at,
      },
    };
  } catch (err) {
    return { ok: false, error: normalizeError(err) };
  }
}

export async function logout(): Promise<AuthResult<null>> {
  try {
    const { error } = await supabaseRendererClient.auth.signOut();
    if (error) return { ok: false, error: normalizeError(error) };
    return { ok: true, data: null };
  } catch (err) {
    return { ok: false, error: normalizeError(err) };
  }
}

export async function resetPassword(email: string): Promise<AuthResult<null>> {
  try {
    const { error } = await supabaseRendererClient.auth.resetPasswordForEmail(email);
    if (error) return { ok: false, error: normalizeError(error) };
    return { ok: true, data: null };
  } catch (err) {
    return { ok: false, error: normalizeError(err) };
  }
}

export async function updatePassword(newPassword: string): Promise<AuthResult<AuthSessionInfo>> {
  try {
    const { data, error } = await supabaseRendererClient.auth.updateUser({ password: newPassword });
    if (error) return { ok: false, error: normalizeError(error) };
    const user = data.user ?? null;
    return {
      ok: true,
      data: {
        user,
        emailVerified: !!user?.email_confirmed_at,
      },
    };
  } catch (err) {
    return { ok: false, error: normalizeError(err) };
  }
}

export async function getCurrentUser(): Promise<AuthResult<AuthSessionInfo>> {
  try {
    const { data, error } = await supabaseRendererClient.auth.getUser();
    if (error) return { ok: false, error: normalizeError(error) };
    const user = data.user ?? null;
    return {
      ok: true,
      data: {
        user,
        emailVerified: !!user?.email_confirmed_at,
      },
    };
  } catch (err) {
    return { ok: false, error: normalizeError(err) };
  }
}

// Supabase resend verification currently uses update user / or magic link flows.
// If using the beta resend API: supabase.auth.resend({ type: 'signup', email })
// Guard usage since not all versions support it.
export async function resendVerification(email: string): Promise<AuthResult<null>> {
  const auth: any = supabaseRendererClient.auth as any;
  if (typeof auth.resend !== "function") {
    return {
      ok: false,
      error: "Resend verification not supported by current Supabase client version",
    };
  }
  try {
    const { error } = await auth.resend({ type: "signup", email });
    if (error) return { ok: false, error: normalizeError(error) };
    return { ok: true, data: null };
  } catch (err) {
    return { ok: false, error: normalizeError(err) };
  }
}
