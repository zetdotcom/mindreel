// AI Weekly Summary Generation Orchestrator
// Integrates with Supabase Edge Function `generate_weekly_summary`.
// Responsibilities:
//  - Build request payload from local entries for a completed ISO week
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
// Usage (from WeekGroup onGenerate):
//   const result = await generateWeeklySummary({
//     iso_year, week_of_year, start_date, end_date,
//   });
//   if (result.ok) { /* summary persisted; caller may refresh week data */ }
//   else { /* map result.state to SummaryCardState */ }
//
import { summariesRepository } from "./repository";
import type { Entry } from "../../../sqlite/types";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface GenerateWeeklySummaryArgs {
  iso_year: number;
  week_of_year: number;
  start_date: string; // Monday YYYY-MM-DD
  end_date: string; // Sunday YYYY-MM-DD
  language?: "en" | "pl";
}

export type GenerateWeeklySummaryState =
  | { ok: true; summary: import("../../../sqlite/types").Summary }
  | {
      ok: false;
      state: "unauthorized" | "limitReached" | "failed" | "unsupported";
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
    // Supabase auth client is created in renderer via useSupabase / rendererClient.
    // Access global injected client (pattern used elsewhere in app).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = (window as any)?.supabaseClient;
    if (!supabase) return null;
    const session = await supabase.auth.getSession();
    return session.data.session?.access_token || null;
  } catch (e) {
    logDebug("Failed to get auth session", e);
    return null;
  }
}

async function fetchEntriesForIsoWeek(iso_year: number, week_of_year: number): Promise<Entry[]> {
  // Access entries via preload IPC (window.appApi.db.getEntriesForIsoWeek)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = (window as any)?.appApi?.db;
  if (!db || typeof db.getEntriesForIsoWeek !== "function") {
    throw new Error("DB_API_UNAVAILABLE");
  }
  const entries: Entry[] = await db.getEntriesForIsoWeek(iso_year, week_of_year);
  return entries;
}

function buildEdgePayload(
  entries: Entry[],
  args: GenerateWeeklySummaryArgs,
): Record<string, unknown> {
  // Edge function expects entries with { timestamp, text }
  const transformed = entries.map((e) => ({
    timestamp: new Date(e.date + "T00:00:00Z").toISOString(),
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
  const url = `${(import.meta as any).env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL}/functions/v1/generate_weekly_summary`;
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
    // 0. Enforce week completion (end_date strictly before today UTC)
    const now = new Date();
    const weekEnd = new Date(args.end_date + "T23:59:59.999Z");
    if (weekEnd >= now) {
      return { ok: false, state: "failed", message: "Week not completed" };
    }

    // 1. Auth token
    const token = await getAuthAccessToken();
    if (!token) {
      return { ok: false, state: "unauthorized", message: "Not authenticated" };
    }

    // 2. Fetch entries
    const entries = await fetchEntriesForIsoWeek(args.iso_year, args.week_of_year);
    if (!entries.length) {
      return { ok: false, state: "failed", message: "No entries for week" };
    }

    // 3. Build payload & call edge function
    const payload = buildEdgePayload(entries, args);
    logDebug("Payload built", { size: entries.length });
    const res = await callEdgeFunction(token, payload);
    let json: any;
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

    // 4. Persist summary (arbitrary ISO week supported)
    let persisted;
    try {
      persisted = await summariesRepository.createForIsoWeek({
        iso_year: args.iso_year,
        week_of_year: args.week_of_year,
        start_date: args.start_date,
        end_date: args.end_date,
        content,
      });
      logDebug("Summary persisted", { id: persisted.id });
    } catch (persistError) {
      if (persistError instanceof Error && persistError.message === "CREATE_ISO_WEEK_UNSUPPORTED") {
        return {
          ok: false,
          state: "unsupported",
          message: "Arbitrary ISO week persistence unsupported",
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
