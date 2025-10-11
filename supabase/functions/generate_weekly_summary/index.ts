// Edge Function for generating weekly AI summaries with quota management
// Based on MindReel MVP edge function plan

// Import shared utilities
import type {
  Entry,
  RequestPayload,
  SuccessResponse,
  ErrorResponse,
  QuotaState,
  SupportedLanguage,
} from "../_shared/types.ts";
import { validateEnvironment, getNumericConfig } from "../_shared/env.ts";
import { buildPromptData, formatSummary } from "../_shared/normalization.ts";
import {
  callOpenRouter,
  createOpenRouterConfig,
} from "../_shared/openrouter.ts";

// Constants
const QUOTA_LIMIT = 5;
const CYCLE_DAYS = 28;
const MAX_ENTRIES = 1000; // Prevent abuse
const MAX_ENTRY_LENGTH = 10000; // Per entry character limit

// Helper functions for JSON responses
function jsonResponse(
  data: SuccessResponse | ErrorResponse,
  status = 200,
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      Connection: "keep-alive",
    },
  });
}

function errorResponse(
  reason: ErrorResponse["reason"],
  message: string,
  status = 400,
  extra: Partial<ErrorResponse> = {},
): Response {
  return jsonResponse(
    {
      ok: false,
      reason,
      message,
      ...extra,
    },
    status,
  );
}

// Quota management functions
async function getOrInitUserQuota(
  supabase: any,
  userId: string,
): Promise<QuotaState> {
  const { data, error } = await supabase.rpc("get_or_init_user_quota", {
    p_user_id: userId,
  });

  if (error) {
    console.error("Error getting user quota:", error);
    throw new Error(`Failed to get quota: ${error.message}`);
  }

  return data;
}

async function resetQuotaIfExpired(
  supabase: any,
  userId: string,
): Promise<QuotaState> {
  const { data, error } = await supabase.rpc("reset_quota_if_expired", {
    p_user_id: userId,
  });

  if (error) {
    console.error("Error resetting quota:", error);
    throw new Error(`Failed to reset quota: ${error.message}`);
  }

  return data;
}

function calculateQuotaInfo(quota: QuotaState): {
  remaining: number;
  cycleEnd: string;
  isExceeded: boolean;
} {
  const remaining = Math.max(0, QUOTA_LIMIT - quota.ai_summaries_count);
  const cycleStartDate = new Date(quota.cycle_start_at);
  const cycleEndDate = new Date(
    cycleStartDate.getTime() + CYCLE_DAYS * 24 * 60 * 60 * 1000,
  );

  return {
    remaining,
    cycleEnd: cycleEndDate.toISOString(),
    isExceeded: quota.ai_summaries_count >= QUOTA_LIMIT,
  };
}

// Concurrency-safe quota increment function
async function conditionalIncrementQuota(
  supabase: any,
  userId: string,
  expectedCount: number,
): Promise<QuotaState | null> {
  const { data, error } = await supabase.rpc("conditional_increment_quota", {
    p_user_id: userId,
    p_expected_count: expectedCount,
  });

  if (error) {
    console.error("Error incrementing quota:", error);
    throw new Error(`Failed to increment quota: ${error.message}`);
  }

  return data; // Will be null if race condition occurred
}

async function fetchCurrentQuota(
  supabase: any,
  userId: string,
): Promise<QuotaState> {
  const { data, error } = await supabase.rpc("get_or_init_user_quota", {
    p_user_id: userId,
  });

  if (error) {
    console.error("Error fetching quota:", error);
    throw new Error(`Failed to fetch quota: ${error.message}`);
  }

  return data;
}

// Validation functions
function validateWeekRange(
  weekStart: string,
  weekEnd: string,
  serverNow: Date,
): string | null {
  // Parse dates as UTC
  const startDate = new Date(weekStart + "T00:00:00.000Z");
  const endDate = new Date(weekEnd + "T23:59:59.999Z");

  // Check if dates are valid
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return "Invalid date format. Use YYYY-MM-DD";
  }

  // Check if week_start is Monday (1) and week_end is Sunday (0)
  if (startDate.getUTCDay() !== 1) {
    return "week_start must be a Monday";
  }
  if (endDate.getUTCDay() !== 0) {
    return "week_end must be a Sunday";
  }

  // Check if the range is exactly 6 days (Monday to Sunday)
  const daysDiff = Math.floor(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (daysDiff !== 6) {
    return "Week range must be exactly 7 days (Monday to Sunday)";
  }

  // Check if week_start is not more than 1 day in the future
  const oneDayFromNow = new Date(serverNow.getTime() + 24 * 60 * 60 * 1000);
  if (startDate > oneDayFromNow) {
    return "week_start cannot be more than 1 day in the future";
  }

  return null; // Valid
}

function validateEntries(
  entries: Entry[],
  weekStart: string,
  weekEnd: string,
): string | null {
  if (!Array.isArray(entries) || entries.length === 0) {
    return "entries array cannot be empty";
  }

  if (entries.length > MAX_ENTRIES) {
    return `Too many entries. Maximum allowed: ${MAX_ENTRIES}`;
  }

  const weekStartTime = new Date(weekStart + "T00:00:00.000Z").getTime();
  const weekEndTime = new Date(weekEnd + "T23:59:59.999Z").getTime();

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    // Check required fields
    if (!entry.timestamp || typeof entry.timestamp !== "string") {
      return `Entry ${i + 1}: timestamp is required and must be a string`;
    }
    if (!entry.text || typeof entry.text !== "string") {
      return `Entry ${i + 1}: text is required and must be a string`;
    }

    // Check text length
    if (entry.text.length > MAX_ENTRY_LENGTH) {
      return `Entry ${i + 1}: text too long. Maximum ${MAX_ENTRY_LENGTH} characters`;
    }

    // Validate timestamp format and range
    const entryTime = new Date(entry.timestamp);
    if (isNaN(entryTime.getTime())) {
      return `Entry ${i + 1}: invalid timestamp format`;
    }

    const entryTimeMs = entryTime.getTime();
    if (entryTimeMs < weekStartTime || entryTimeMs > weekEndTime) {
      return `Entry ${i + 1}: timestamp outside week range`;
    }
  }

  // Check total payload size (rough estimate)
  const totalChars = entries.reduce((sum, entry) => sum + entry.text.length, 0);
  if (totalChars > 50000) {
    // Conservative limit for all entries combined
    return "Total content too large. Please reduce entry text or count";
  }

  return null; // Valid
}

function validateLanguage(language?: string): string | null {
  if (language && !["pl", "en"].includes(language)) {
    return 'language must be either "pl" or "en"';
  }
  return null;
}

// Main edge function
(globalThis as any).Deno.serve(async (req: Request) => {
  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return errorResponse("validation_error", "Only POST method allowed", 405);
    }

    // Initialize Supabase client
    const supabaseUrl = (globalThis as any).Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = (globalThis as any).Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY",
    );

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing required environment variables");
      return errorResponse("other_error", "Server configuration error", 500);
    }

    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Extract and validate Authorization header
    // const authHeader = req.headers.get("authorization");
    // if (!authHeader || !authHeader.startsWith("Bearer ")) {
    //   return errorResponse(
    //     "auth_error",
    //     "Missing or invalid Authorization header",
    //     401,
    //   );
    // }

    // const token = authHeader.slice(7); // Remove 'Bearer ' prefix

    // // Verify user authentication
    // const {
    //   data: { user },
    //   error: authError,
    // } = await supabase.auth.getUser(token);
    // if (authError || !user) {
    //   console.log("Auth verification failed:", authError?.message);
    //   return errorResponse("auth_error", "Invalid or expired token", 401);
    // }

    // Parse request body
    let payload: RequestPayload;
    try {
      payload = await req.json();
    } catch (error) {
      console.log("JSON parsing failed:", error);
      return errorResponse("validation_error", "Invalid JSON payload");
    }

    const user = {
      id: "sss",
    };

    // Log successful auth for debugging
    console.log(`Request from user: ${user.id}`);

    // Phase 3: Validation Layer
    const serverNow = new Date();

    // Validate required fields
    if (!payload.week_start || !payload.week_end) {
      return errorResponse(
        "validation_error",
        "week_start and week_end are required",
      );
    }

    // Validate week range
    const weekRangeError = validateWeekRange(
      payload.week_start,
      payload.week_end,
      serverNow,
    );
    if (weekRangeError) {
      return errorResponse("validation_error", weekRangeError);
    }

    // Validate entries
    const entriesError = validateEntries(
      payload.entries,
      payload.week_start,
      payload.week_end,
    );
    if (entriesError) {
      return errorResponse("validation_error", entriesError);
    }

    // Validate language
    const languageError = validateLanguage(payload.language);
    if (languageError) {
      return errorResponse("validation_error", languageError);
    }

    console.log(`Validation passed for ${payload.entries.length} entries`);

    // Phase 4: Quota Read & Reset Logic (Pre-LLM)
    try {
      // Get or initialize user quota
      const initialQuota = await getOrInitUserQuota(supabase, user.id);
      console.log(`Initial quota for user ${user.id}:`, initialQuota);

      // Reset quota if 28-day cycle has expired
      const currentQuota = await resetQuotaIfExpired(supabase, user.id);
      console.log(`Current quota after reset check:`, currentQuota);

      // Calculate quota information
      const quotaInfo = calculateQuotaInfo(currentQuota);

      // Check if quota is exceeded
      if (quotaInfo.isExceeded) {
        console.log(
          `Quota exceeded for user ${user.id}. Count: ${currentQuota.ai_summaries_count}`,
        );
        return jsonResponse(
          {
            ok: false,
            reason: "quota_exceeded",
            message: "Monthly AI summary limit reached",
            remaining: quotaInfo.remaining,
            cycle_end: quotaInfo.cycleEnd,
          },
          429,
        );
      }

      console.log(`Quota check passed. Remaining: ${quotaInfo.remaining}`);

      // Phase 5: Entry Normalization & Prompt Building
      try {
        // Get environment configuration
        const env = validateEnvironment();
        const numericConfig = getNumericConfig();

        // Build prompt data with normalization
        const promptData = buildPromptData(
          payload.entries,
          payload.language as SupportedLanguage | undefined,
          numericConfig.maxPromptChars,
          numericConfig.entryTruncationLimit,
        );

        console.log(
          `Prompt data prepared - Language: ${promptData.language}, Entries: ${promptData.entryCount}`,
        );

        // Phase 6: OpenRouter Call
        const openRouterConfig = createOpenRouterConfig(
          env.OPENROUTER_API_KEY,
          env.OPENROUTER_MODEL,
        );

        const llmResponse = await callOpenRouter(promptData, openRouterConfig);

        if (!llmResponse.ok) {
          console.error("OpenRouter API failed:", llmResponse.error);
          return jsonResponse(
            {
              ok: false,
              reason: "provider_error",
              message:
                llmResponse.error || "AI service temporarily unavailable",
              retryable: true,
            },
            502,
          );
        }

        // Format the AI response
        const formattedSummary = formatSummary(
          llmResponse.summary!,
          promptData.language,
        );

        console.log(
          `AI summary generated successfully (${formattedSummary.length} characters)`,
        );

        // Phase 7: Concurrency-Safe Quota Increment (Post-Success)
        try {
          // Attempt to increment quota atomically
          const incrementedQuota = await conditionalIncrementQuota(
            supabase,
            user.id,
            currentQuota.ai_summaries_count,
          );

          let finalQuota: QuotaState;

          if (incrementedQuota === null) {
            // Race condition occurred, fetch current quota
            console.log("Race condition detected, fetching current quota");
            finalQuota = await fetchCurrentQuota(supabase, user.id);
          } else {
            finalQuota = incrementedQuota;
          }

          // Calculate final quota info
          const finalQuotaInfo = calculateQuotaInfo(finalQuota);

          console.log(
            `Quota successfully updated. New count: ${finalQuota.ai_summaries_count}, Remaining: ${finalQuotaInfo.remaining}`,
          );

          // Return success response
          return jsonResponse({
            ok: true,
            summary: formattedSummary,
            remaining: finalQuotaInfo.remaining,
            cycle_end: finalQuotaInfo.cycleEnd,
          });
        } catch (incrementError) {
          console.error("Failed to increment quota:", incrementError);
          // Still return success since AI generation worked
          // Just log the quota increment failure
          return jsonResponse({
            ok: true,
            summary: formattedSummary,
            remaining: Math.max(0, quotaInfo.remaining - 1),
            cycle_end: quotaInfo.cycleEnd,
          });
        }
      } catch (processingError) {
        console.error("Entry processing or AI call failed:", processingError);
        return errorResponse(
          "other_error",
          "Failed to process entries or generate summary",
          500,
        );
      }
    } catch (quotaError) {
      console.error("Quota management error:", quotaError);
      return errorResponse("other_error", "Failed to check quota limits", 500);
    }
  } catch (error) {
    console.error("Unexpected error in edge function:", error);
    return errorResponse(
      "other_error",
      "Unexpected internal failure; retry later",
      500,
    );
  }
});
