/**
 * Summaries Repository
 *
 * Thin abstraction over preload-exposed database API for weekly summaries.
 *
 * Responsibilities:
 *  - Encapsulate IPC channel usage (window.appApi.db.*)
 *  - Provide higher-level helper to create a current week summary from entries
 *  - Offer test seam via factory (dependency injection of dbApi + contentBuilder)
 *
 * Out of Scope (handled elsewhere later):
 *  - AI / LLM powered summary generation (will be integrated via a separate feature)
 *  - Caching / memoization (delegate to caller/hooks or a query library)
 *
 * Error Codes (thrown as Error.message):
 *  - SUMMARY_NO_ENTRIES_CURRENT_WEEK: Attempted to create a summary when there are no entries
 *  - SUMMARY_NOT_FOUND: Update/delete target not found
 */
import type { Entry, Summary } from "../../../sqlite/types";

/* ---------- Types & Interfaces ------------------------------------------------ */

export interface WeekInfo {
  start_date: string;
  end_date: string;
  week_of_year: number;
}

import type { CreateIsoWeekSummaryArgs } from "./types";

/**
 * The surface we expect from the preload DB API for summaries & supporting calls.
 * (Matches handlers registered in ipc/databaseHandlers.ts)
 */
export interface SummariesDbApi {
  getCurrentWeekInfo(): Promise<WeekInfo>;
  getCurrentWeekEntries(): Promise<Entry[]>;
  createCurrentWeekSummary(content: string): Promise<Summary>;
  createSummary(input: {
    content: string;
    start_date: string;
    end_date: string;
    week_of_year: number;
    iso_year: number;
  }): Promise<Summary>;
  getCurrentWeekSummary(): Promise<Summary | null>;
  getSummaryByWeek(weekOfYear: number): Promise<Summary | null>;
  getAllSummaries(): Promise<Summary[]>;
  updateSummary(id: number, content: string): Promise<Summary | null>;
  deleteSummary(id: number): Promise<boolean>;
  currentWeekSummaryExists(): Promise<boolean>;
  summaryExistsForWeek(weekOfYear: number): Promise<boolean>;
  summaryExistsForIsoWeek?(iso_year: number, week_of_year: number): Promise<boolean>;
  getLatestSummary(): Promise<Summary | null>;
}

/**
 * Builder that converts week info + entries into summary content.
 * You can inject a more elaborate (AI) builder later without changing callers.
 */
export type SummaryContentBuilder = (args: { week: WeekInfo; entries: Entry[] }) => string;

/* ---------- Default Content Builder ------------------------------------------- */

/**
 * Simple bullet-list summary builder.
 * (Future: move to AI or improved natural language summarizer.)
 */
export const defaultContentBuilder: SummaryContentBuilder = ({ week, entries }) => {
  const header = `Week ${week.week_of_year} (${week.start_date} → ${week.end_date}) Summary\n`;
  const body = entries.map((e) => `• ${e.content}`).join("\n") || "• (No entries)";
  return `${header}\n${body}`;
};

/* ---------- Factory ----------------------------------------------------------- */

/**
 * Create a summaries repository instance.
 *
 * @param dbApi - Optional injected database API (for tests)
 * @param contentBuilder - Optional custom summary content builder
 */
export function createSummariesRepository(
  dbApi?: SummariesDbApi,
  contentBuilder: SummaryContentBuilder = defaultContentBuilder,
) {
  // Resolve runtime API
  const resolved: SummariesDbApi | undefined =
    dbApi ||
    (typeof window !== "undefined"
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((window as any)?.appApi?.db as SummariesDbApi | undefined)
      : undefined);

  if (!resolved) {
    throw new Error("Summaries DB API not available. Ensure preload exposes window.appApi.db.");
  }

  return {
    /**
     * Fetch summary for the current week (null if not present).
     */
    async getCurrent(): Promise<Summary | null> {
      return resolved.getCurrentWeekSummary();
    },

    /**
     * Fetch summary for a given ISO week number.
     */
    async getByWeek(weekOfYear: number): Promise<Summary | null> {
      return resolved.getSummaryByWeek(weekOfYear);
    },

    /**
     * List all summaries (most recent first according to main-side ordering).
     */
    async listAll(): Promise<Summary[]> {
      return resolved.getAllSummaries();
    },

    /**
     * Return the latest summary by creation timestamp (or null).
     */
    async getLatest(): Promise<Summary | null> {
      return resolved.getLatestSummary();
    },

    /**
     * Return up to `limit` most recent summaries (default 5).
     * Implemented client-side for now (can optimize server-side later).
     */
    async listRecent(limit = 5): Promise<Summary[]> {
      const all = await resolved.getAllSummaries();
      return all.slice(0, limit);
    },

    /**
     * Check if a summary already exists for the current week.
     */
    async existsForCurrentWeek(): Promise<boolean> {
      return resolved.currentWeekSummaryExists();
    },

    /**
     * Check if a summary exists for a specific week number.
     */
    async existsForWeek(weekOfYear: number): Promise<boolean> {
      return resolved.summaryExistsForWeek(weekOfYear);
    },

    /**
     * Create a summary for the current week using a builder over the week's entries.
     * Throws:
     *  - SUMMARY_NO_ENTRIES_CURRENT_WEEK if there are no entries
     */
    async createForCurrentWeek(): Promise<Summary> {
      const [week, entries] = await Promise.all([
        resolved.getCurrentWeekInfo(),
        resolved.getCurrentWeekEntries(),
      ]);

      if (!entries.length) {
        throw new Error("SUMMARY_NO_ENTRIES_CURRENT_WEEK");
      }

      const content = contentBuilder({ week, entries });
      return resolved.createCurrentWeekSummary(content);
    },

    /**
     * Create a summary for the current week with externally supplied content
     * (e.g. AI generated). Skips contentBuilder.
     */
    async createForCurrentWeekWithContent(content: string): Promise<Summary> {
      return resolved.createCurrentWeekSummary(content);
    },

    /**
     * Create summary for arbitrary ISO week (full support).
     * Uses underlying createSummary API (requires IPC handler).
     * Throws CREATE_ISO_WEEK_UNSUPPORTED if createSummary not exposed.
     */
    async createForIsoWeek(args: CreateIsoWeekSummaryArgs): Promise<Summary> {
      if (typeof (resolved as any).createSummary !== "function") {
        throw new Error("CREATE_ISO_WEEK_UNSUPPORTED");
      }
      return resolved.createSummary({
        content: args.content,
        start_date: args.start_date,
        end_date: args.end_date,
        week_of_year: args.week_of_year,
        iso_year: args.iso_year,
      });
    },

    /**
     * Check existence for arbitrary ISO week (fallback when iso_year missing server-side).
     */
    async existsForIsoWeek(iso_year: number, week_of_year: number): Promise<boolean> {
      if (typeof resolved.summaryExistsForIsoWeek === "function") {
        return (resolved as any).summaryExistsForIsoWeek(iso_year, week_of_year);
      }
      return resolved.summaryExistsForWeek(week_of_year);
    },

    /**
     * Fetch summary for an ISO week (year + week). Falls back to week-only lookup
     * when iso-specific API is unavailable. Returns null if mismatch.
     */
    async getByIsoWeek(iso_year: number, week_of_year: number): Promise<Summary | null> {
      if (typeof (resolved as any).getSummaryByIsoWeek === "function") {
        return (resolved as any).getSummaryByIsoWeek(iso_year, week_of_year);
      }
      // Fallback: week-only lookup then verify iso_year if available
      const summary = await resolved.getSummaryByWeek(week_of_year);
      if (!summary) return null;
      if (typeof (summary as any).iso_year === "number" && summary.iso_year !== iso_year) {
        return null; // Week collision across ISO years (edge case)
      }
      return summary;
    },

    /**
     * Update summary content by ID; throws if not found.
     */
    async update(id: number, content: string): Promise<Summary> {
      const updated = await resolved.updateSummary(id, content);
      if (!updated) {
        throw new Error("SUMMARY_NOT_FOUND");
      }
      return updated;
    },

    /**
     * Delete summary by ID. Returns true if deleted, false if not found.
     * (Consider restricting deletes if business rule forbids removing summaries.)
     */
    async delete(id: number): Promise<boolean> {
      return resolved.deleteSummary(id);
    },
  };
}

/* ---------- Singleton Export -------------------------------------------------- */

/**
 * Default repository instance. Prefer factory for tests or alternate builders.
 */
export const summariesRepository = createSummariesRepository();

/* ---------- Types Re-exports -------------------------------------------------- */

export type { Summary };
