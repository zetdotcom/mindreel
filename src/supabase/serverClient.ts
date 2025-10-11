import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./db.types";

/**
 * Main-process ONLY Supabase client using the service role key.
 *
 * SECURITY:
 * - Never import this file from any code that is bundled into the renderer.
 * - Do not expose this client directly over IPC or preload. Only wrap
 *   narrowly-scoped, intention‑revealing handlers (e.g. incrementQuota).
 *
 * RATIONALE:
 * The service role key bypasses Row Level Security. Treat as a secret.
 */
const serviceUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceUrl) {
  throw new Error("[Supabase] SUPABASE_URL is required for server (service role) client.");
}

if (!serviceRoleKey) {
  // We intentionally do NOT throw here so the application can still run
  // features that only depend on the anon client. Privileged IPC handlers
  // should check for null and respond gracefully.
  console.warn(
    "[Supabase] SUPABASE_SERVICE_ROLE_KEY not set. Privileged Supabase features are disabled.",
  );
}

/**
 * Exported service-role client (or null if unavailable).
 * Auth settings:
 *  - persistSession: false (we are using a stateless service key)
 *  - autoRefreshToken: false (service key JWTs are long-lived; refreshing not required)
 */
export const supabaseServerClient: SupabaseClient<Database> | null = serviceRoleKey
  ? createClient<Database>(serviceUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          "X-Client-Info": "mindreel-service-role",
        },
      },
    })
  : null;

/**
 * Helper guard to ensure privileged operations fail fast with a clear message.
 */
export function requireServerClient(): ExcludesNull<typeof supabaseServerClient> {
  if (!supabaseServerClient) {
    throw new Error(
      "[Supabase] Service role client not initialized (missing SUPABASE_SERVICE_ROLE_KEY).",
    );
  }
  return supabaseServerClient;
}

/**
 * Narrow type helper to refine null out of supabaseServerClient.
 */
type ExcludesNull<T> = T extends null ? never : T;

/**
 * Example privileged utility (NOT exported by default):
 *
 * async function internalIncrementQuota(userId: string) {
 *   const client = requireServerClient();
 *   // Example: call a SECURITY DEFINER RPC not allowed for anon users
 *   const { data, error } = await client.rpc('increment_ai_summary_count', { user_id: userId });
 *   if (error) throw error;
 *   return data;
 * }
 *
 * Keep such functions private to this module or a dedicated IPC handler file.
 */

// IMPORTANT: Do not add any renderer-facing exports beyond the client reference + helper.
