// Edge Function for generating weekly AI summaries with quota management
// Based on MindReel MVP edge function plan

// Import shared utilities
import type {
  RequestPayload,
  SupportedLanguage,
  QuotaState,
} from "../_shared/types.ts";
import { validateEnvironment, getNumericConfig } from "../_shared/env.ts";
import { buildPromptData, formatSummary } from "../_shared/normalization.ts";
import {
  callOpenRouter,
  createOpenRouterConfig,
} from "../_shared/openrouter.ts";

// Import local helper functions
import { jsonResponse, errorResponse } from "./http-helpers.ts";
import {
  getOrInitUserQuota,
  resetQuotaIfExpired,
  calculateQuotaInfo,
  conditionalIncrementQuota,
  fetchCurrentQuota,
} from "./quota.ts";
import {
  validateWeekRange,
  validateEntries,
  validateLanguage,
} from "./validation.ts";

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
