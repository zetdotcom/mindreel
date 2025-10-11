import { ipcMain } from "electron";
import {
  supabaseServerClient,
  requireServerClient,
} from "../supabase/serverClient";

/**
 * Result shape for a quota increment operation.
 */
interface IncrementQuotaResult {
  success: boolean;
  newCount?: number;
  error?: string;
  inserted?: boolean;
  userId?: string;
}

/**
 * Arguments accepted by the quota increment IPC handler.
 */
interface IncrementQuotaArgs {
  userId: string;
}

/**
 * Optional: fetch current quota result.
 */
interface GetQuotaResult {
  success: boolean;
  count?: number;
  cycleStartAt?: string;
  updatedAt?: string;
  error?: string;
  userId?: string;
}

/**
 * Register privileged Supabase IPC handlers.
 *
 * SECURITY NOTES:
 * - Handlers are intentionally narrow and intention‑revealing.
 * - They DO NOT expose generic SQL / table access.
 * - They require the service role client (or gracefully fail if absent).
 * - No secrets (service role key) are ever sent to the renderer.
 */
export function registerSupabaseHandlers() {
  /**
   * Increment a user's AI summary quota count (privileged).
   *
   * Channel: 'supabase:quota:increment'
   * Args: { userId: string }
   *
   * Behavior:
   * - If the row exists: atomically increments count by 1.
   * - If not: inserts a new row initialized to 1.
   * - Returns the new total count.
   */
  ipcMain.handle(
    "supabase:quota:increment",
    async (
      _event,
      rawArgs: IncrementQuotaArgs,
    ): Promise<IncrementQuotaResult> => {
      if (!supabaseServerClient) {
        return {
          success: false,
          error:
            "Service role client not initialized (missing SUPABASE_SERVICE_ROLE_KEY).",
        };
      }

      try {
        // Basic validation
        if (!rawArgs || typeof rawArgs.userId !== "string") {
          return { success: false, error: "userId is required (string)" };
        }

        const userId = rawArgs.userId.trim();
        if (!userId) {
          return { success: false, error: "userId cannot be empty" };
        }

        // Always increment by exactly 1 (business rule).

        const client = requireServerClient();

        // Fetch existing row (maybeSingle handles 0 or 1 row)
        const { data: existing, error: selectError } = await client
          .from("user_ai_quota")
          .select("ai_summaries_count, cycle_start_at, updated_at")
          .eq("user_id", userId)
          .maybeSingle();

        if (selectError) {
          return {
            success: false,
            error: `Select failed: ${selectError.message}`,
          };
        }

        const nowIso = new Date().toISOString();

        if (!existing) {
          // Insert new row
          const { error: insertError, data: insertData } = await client
            .from("user_ai_quota")
            .insert({
              user_id: userId,
              ai_summaries_count: 1,
              cycle_start_at: nowIso,
              updated_at: nowIso,
            })
            .select("ai_summaries_count")
            .single();

          if (insertError) {
            return {
              success: false,
              error: `Insert failed: ${insertError.message}`,
              userId,
            };
          }

          return {
            success: true,
            newCount: insertData?.ai_summaries_count,
            inserted: true,
            userId,
          };
        }

        // Update existing row
        const newCount = existing.ai_summaries_count + 1;

        const { error: updateError, data: updateData } = await client
          .from("user_ai_quota")
          .update({
            ai_summaries_count: newCount,
            updated_at: nowIso,
          })
          .eq("user_id", userId)
          .select("ai_summaries_count")
          .single();

        if (updateError) {
          return {
            success: false,
            error: `Update failed: ${updateError.message}`,
            userId,
          };
        }

        return {
          success: true,
          newCount: updateData?.ai_summaries_count,
          userId,
        };
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unknown error incrementing quota";
        return { success: false, error: message };
      }
    },
  );

  /**
   * Retrieve a user's current quota record.
   *
   * Channel: 'supabase:quota:get'
   * Args: userId: string
   */
  ipcMain.handle(
    "supabase:quota:get",
    async (_event, userId: string): Promise<GetQuotaResult> => {
      if (!supabaseServerClient) {
        return {
          success: false,
          error:
            "Service role client not initialized (missing SUPABASE_SERVICE_ROLE_KEY).",
        };
      }
      try {
        if (typeof userId !== "string" || !userId.trim()) {
          return { success: false, error: "userId is required (string)" };
        }

        const client = requireServerClient();
        const { data, error } = await client
          .from("user_ai_quota")
          .select("ai_summaries_count, cycle_start_at, updated_at")
          .eq("user_id", userId)
          .maybeSingle();

        if (error) {
          return { success: false, error: error.message, userId };
        }

        if (!data) {
          return {
            success: true,
            count: 0,
            userId,
          };
        }

        return {
          success: true,
          count: data.ai_summaries_count,
          cycleStartAt: data.cycle_start_at,
          updatedAt: data.updated_at,
          userId,
        };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown error fetching quota";
        return { success: false, error: message };
      }
    },
  );
}
