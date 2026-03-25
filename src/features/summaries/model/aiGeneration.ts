// AI History Summary Generation Orchestrator
// Integrates with Supabase Edge Function `generate_weekly_summary`.
// Responsibilities:
//  - Build request payload from local entries for a completed history period
//  - Invoke edge function using authenticated Supabase client
//  - Map error responses to UI states (unauthorized, limitReached/quota, failed)
//  - Persist successful AI summary using summariesRepository
//  - Provide lightweight logging for dev without polluting production UX
//
// Non-Responsibilities:
//  - Quota display (internal only for now)
//  - Abort/cancel mid-flight (future enhancement)
//  - Formatting beyond edge function output (already formatted server-side)
//
// Usage (from history group onGenerate):
//   const result = await generateWeeklySummary({
//     start_date, end_date,
//   });
//   if (result.ok) { /* summary persisted; caller may refresh week data */ }
//   else { /* map result.state to SummaryCardState */ }
//

import { endOfDay, parseISO } from "date-fns";
import type { Entry, Summary } from "../../../sqlite/types";
import { supabaseRendererClient } from "../../../supabase/rendererClient";
import { summariesRepository } from "./repository";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface GenerateWeeklySummaryArgs {
  iso_year?: number;
  week_of_year?: number;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  language?: "en" | "pl";
}

export type GenerateWeeklySummaryState =
  | {
      ok: true;
      summary: import("../../../sqlite/types").Summary;
      state?: undefined;
      message?: undefined;
    }
  | {
      ok: false;
      state: "unauthorized" | "limitReached" | "failed" | "unsupported" | "alreadyExists";
      message?: string;
    };

/* -------------------------------------------------------------------------- */
/* Internal helpers                                                           */
/* -------------------------------------------------------------------------- */

function logDebug(...args: unknown[]) {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.debug("[aiGeneration]", ...args);
  }
}

async function getAuthAccessToken(): Promise<string | null> {
  try {
    // Use the Supabase renderer client to retrieve the current session
    const { data } = await supabaseRendererClient.auth.getSession();
    return data.session?.access_token || null;
  } catch (e) {
    logDebug("Failed to get auth session", e);
    return null;
  }
}

async function fetchEntriesForPeriod(args: GenerateWeeklySummaryArgs): Promise<Entry[]> {
  // Access entries via preload IPC.
  const db = window.appApi?.db;
  if (!db) {
    throw new Error("DB_API_UNAVAILABLE");
  }

  if (typeof db.getEntriesForDateRange === "function") {
    return db.getEntriesForDateRange(args.start_date, args.end_date);
  }

  if (
    typeof db.getEntriesForIsoWeek === "function" &&
    typeof args.iso_year === "number" &&
    typeof args.week_of_year === "number"
  ) {
    return db.getEntriesForIsoWeek(args.iso_year, args.week_of_year);
  }

  throw new Error("DB_API_UNAVAILABLE");
}

function buildEdgePayload(
  entries: Entry[],
  args: GenerateWeeklySummaryArgs,
): Record<string, unknown> {
  // Edge function expects entries with { timestamp, text }
  const transformed = entries.map((e) => ({
    timestamp: new Date(`${e.date}T00:00:00Z`).toISOString(),
    text: e.content,
  }));
  return {
    week_start: args.start_date,
    week_end: args.end_date,
    entries: transformed,
    language: args.language || "en",
  };
}

async function callEdgeFunction(
  accessToken: string,
  payload: Record<string, unknown>,
): Promise<Response> {
  // Supabase Edge function invocation via REST fetch (simpler; could use supabase.functions.invoke)
  // Function deploy URL pattern: <SUPABASE_URL>/functions/v1/generate_weekly_summary
  const url = `${import.meta.env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL}/functions/v1/generate_weekly_summary`;
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
}

/* -------------------------------------------------------------------------- */
/* Public Orchestrator                                                        */
/* -------------------------------------------------------------------------- */

export async function generateWeeklySummary(
  args: GenerateWeeklySummaryArgs,
): Promise<GenerateWeeklySummaryState> {
  try {
    // 0. Enforce period completion against the user's local day boundary.
    const now = new Date();
    const periodEnd = endOfDay(parseISO(args.end_date));
    if (periodEnd >= now) {
      return {
        ok: false,
        state: "failed",
        message:
          typeof args.iso_year === "number" && typeof args.week_of_year === "number"
            ? "Week not completed"
            : "Period not completed",
      };
    }

    // 1. Auth token
    const token = await getAuthAccessToken();
    if (!token) {
      return { ok: false, state: "unauthorized", message: "Not authenticated" };
    }

    // 2. Fetch entries
    const entries = await fetchEntriesForPeriod(args);
    if (!entries.length) {
      return {
        ok: false,
        state: "failed",
        message:
          typeof args.iso_year === "number" && typeof args.week_of_year === "number"
            ? "No entries for week"
            : "No entries for period",
      };
    }

    // 2b. Duplicate check
    try {
      const exists =
        typeof summariesRepository.existsForDateRange === "function"
          ? await summariesRepository.existsForDateRange(args.start_date, args.end_date)
          : typeof summariesRepository.existsForIsoWeek === "function" &&
              typeof args.iso_year === "number" &&
              typeof args.week_of_year === "number"
            ? await summariesRepository.existsForIsoWeek(args.iso_year, args.week_of_year)
            : false;
      if (exists) {
        return {
          ok: false,
          state: "alreadyExists",
          message: "Summary already exists",
        };
      }
    } catch (dupErr) {
      logDebug("Duplicate check failed (non-fatal)", dupErr);
    }

    // 3. Build payload & call edge function
    const payload = buildEdgePayload(entries, args);
    logDebug("Payload built", { size: entries.length });
    const res = await callEdgeFunction(token, payload);
    let json: {
      ok?: boolean;
      reason?: string;
      message?: string;
      summary?: string;
    };
    try {
      json = await res.json();
    } catch (e) {
      logDebug("Failed to parse edge response", e);
      return { ok: false, state: "failed", message: "Invalid server response" };
    }

    if (!json.ok) {
      // Map error reasons
      if (json.reason === "auth_error") {
        return { ok: false, state: "unauthorized", message: json.message };
      }
      if (json.reason === "quota_exceeded") {
        return { ok: false, state: "limitReached", message: json.message };
      }
      // Provider / validation / other errors become generic failed
      logDebug("Edge function returned error", json);
      return { ok: false, state: "failed", message: json.message };
    }

    const content: string | undefined = json.summary;
    if (!content) {
      return { ok: false, state: "failed", message: "Missing summary content" };
    }

    // 4. Persist summary for the exact history period
    let persisted: undefined | null | Summary;
    try {
      if (typeof summariesRepository.createForDateRange === "function") {
        persisted = await summariesRepository.createForDateRange({
          start_date: args.start_date,
          end_date: args.end_date,
          content,
        });
      } else if (
        typeof summariesRepository.createForIsoWeek === "function" &&
        typeof args.iso_year === "number" &&
        typeof args.week_of_year === "number"
      ) {
        persisted = await summariesRepository.createForIsoWeek({
          iso_year: args.iso_year,
          week_of_year: args.week_of_year,
          start_date: args.start_date,
          end_date: args.end_date,
          content,
        });
      } else {
        throw new Error("CREATE_DATE_RANGE_UNSUPPORTED");
      }
      logDebug("Summary persisted", { id: persisted.id });
    } catch (persistError) {
      if (
        persistError instanceof Error &&
        (persistError.message === "CREATE_DATE_RANGE_UNSUPPORTED" ||
          persistError.message === "CREATE_ISO_WEEK_UNSUPPORTED")
      ) {
        return {
          ok: false,
          state: "unsupported",
          message:
            typeof args.iso_year === "number" && typeof args.week_of_year === "number"
              ? "Arbitrary ISO week persistence unsupported"
              : "Custom history period persistence unsupported",
        };
      }
      logDebug("Persistence error", persistError);
      return { ok: false, state: "failed", message: "Persistence failed" };
    }

    return { ok: true, summary: persisted };
  } catch (error) {
    logDebug("Unexpected generation error", error);
    if (error instanceof Error && error.message === "DB_API_UNAVAILABLE") {
      return { ok: false, state: "failed", message: "Database not available" };
    }
    return { ok: false, state: "failed", message: "Unexpected error" };
  }
}
