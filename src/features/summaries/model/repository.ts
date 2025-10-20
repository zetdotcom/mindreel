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
import type { Summary, Entry } from "../../../sqlite/types";

/* ---------- Types & Interfaces ------------------------------------------------ */

export interface WeekInfo {
  start_date: string;
  end_date: string;
  week_of_year: number;
}

/**
 * The surface we expect from the preload DB API for summaries & supporting calls.
 * (Matches handlers registered in ipc/databaseHandlers.ts)
 */
export interface SummariesDbApi {
  getCurrentWeekInfo(): Promise<WeekInfo>;
  getCurrentWeekEntries(): Promise<Entry[]>;
  createCurrentWeekSummary(content: string): Promise<Summary>;
  getCurrentWeekSummary(): Promise<Summary | null>;
  getSummaryByWeek(weekOfYear: number): Promise<Summary | null>;
  getAllSummaries(): Promise<Summary[]>;
  updateSummary(id: number, content: string): Promise<Summary | null>;
  deleteSummary(id: number): Promise<boolean>;
  currentWeekSummaryExists(): Promise<boolean>;
  summaryExistsForWeek(weekOfYear: number): Promise<boolean>;
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
     * Create a summary for an arbitrary ISO week with externally supplied content.
     * Requires caller to provide full week range meta (avoid recomputing here).
     */
    async createForIsoWeek(args: {
      iso_year: number;
      week_of_year: number;
      start_date: string;
      end_date: string;
      content: string;
    }): Promise<Summary> {
      // Underlying preload API currently exposes only createCurrentWeekSummary.
      // For now: if target week is current week delegate; otherwise throw to signal
      // missing backend capability (future IPC handler addition).
      const current = await resolved.getCurrentWeekInfo();
      const isCurrent =
        current.week_of_year === args.week_of_year &&
        // NOTE: iso_year may not be available on WeekInfo; assume current year if absent.
        ("iso_year" in current ? (current as any).iso_year === args.iso_year : true);
      if (!isCurrent) {
        throw new Error("CREATE_ISO_WEEK_UNSUPPORTED");
      }
      return resolved.createCurrentWeekSummary(args.content);
    },

    /**
     * Check existence for arbitrary ISO week (fallback when iso_year missing server-side).
     */
    async existsForIsoWeek(iso_year: number, week_of_year: number): Promise<boolean> {
      // If only week-based check exists we cannot distinguish years without iso_year column.
      // Use summaryExistsForWeek as coarse fallback and assume true only if current year matches.
      if (typeof (resolved as any).summaryExistsForIsoWeek === "function") {
        try {
          // @ts-ignore runtime optional
          return await (resolved as any).summaryExistsForIsoWeek(iso_year, week_of_year);
        } catch {
          // Fallback path below
        }
      }
      const exists = await resolved.summaryExistsForWeek(week_of_year);
      // Cannot disambiguate year; return exists but caller may choose to ignore.
      return exists;
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
