/**
 * Entries Repository
 *
 * Thin abstraction over the Electron preload API (window.appApi.db.*)
 * that exposes CRUD + query operations for "Entry" records.
 *
 * Goals:
 *  - Centralize all IPC channel usages (single place to change names / params)
 *  - Provide lightweight validation & normalization (e.g. trimming content)
 *  - Offer a test seam (can inject a mock dbApi in unit tests)
 *
 * NOTE:
 *  - We intentionally do NOT introduce any global caching layer here.
 *    Higher-level hooks (useEntries, React Query, etc.) decide on memoization.
 */

import type { Entry } from "../../../sqlite/types";

/**
 * The minimal surface we expect from the preload-exposed DB API.
 * This allows easy mocking in tests without a real Electron environment.
 */
export interface EntriesDbApi {
  createEntry(input: { content: string }): Promise<Entry>;
  getTodayEntries(): Promise<Entry[]>;
  getEntriesForDate(date: string): Promise<Entry[]>;
  getEntriesForWeek(weekOfYear: number): Promise<Entry[]>;
  getEntriesForDateRange(start: string, end: string): Promise<Entry[]>;
  updateEntry(id: number, content: string): Promise<Entry | null>;
  deleteEntry(id: number): Promise<boolean>;
  getDatesWithEntries(): Promise<string[]>;
  getWeeksWithEntries(): Promise<number[]>;
}

/**
 * Normalization / validation helpers
 */
function normalizeContent(raw: string): string {
  return raw.trim();
}

function assertNonEmpty(content: string): void {
  if (!content) {
    throw new Error("ENTRY_EMPTY_CONTENT");
  }
}

/**
 * Factory to create a repository instance.
 * You can inject a stub for tests:
 *   const repo = createEntriesRepository(mockDbApi);
 */
export function createEntriesRepository(dbApi?: EntriesDbApi) {
  // Resolve runtime API from global if not provided
  // (Guard for SSR / tests without window)
  const resolved: EntriesDbApi | undefined =
    dbApi ||
    (typeof window !== "undefined" ? (window as any)?.appApi?.db : undefined);

  if (!resolved) {
    throw new Error(
      "Entries DB API not available. Ensure preload exposes window.appApi.db.",
    );
  }

  return {
    /**
     * Create a new entry (content trimmed; rejects empty)
     */
    async create(rawContent: string): Promise<Entry> {
      const content = normalizeContent(rawContent);
      assertNonEmpty(content);
      return resolved.createEntry({ content });
    },

    /**
     * Update an existing entry. Returns updated entry or throws if not found.
     * (Current main-side API returns null when not found; we convert to error.)
     */
    async update(id: number, rawContent: string): Promise<Entry> {
      const content = normalizeContent(rawContent);
      assertNonEmpty(content);
      const updated = await resolved.updateEntry(id, content);
      if (!updated) {
        throw new Error("ENTRY_NOT_FOUND");
      }
      return updated;
    },

    /**
     * Delete entry by id. Returns true if deleted; false if not found.
     */
    async remove(id: number): Promise<boolean> {
      return resolved.deleteEntry(id);
    },

    /**
     * Today entries (delegated fully to main; no client-side filtering).
     */
    async listToday(): Promise<Entry[]> {
      return resolved.getTodayEntries();
    },

    /**
     * Entries for a specific YYYY-MM-DD date.
     */
    async listByDate(date: string): Promise<Entry[]> {
      return resolved.getEntriesForDate(date);
    },

    /**
     * Entries by ISO week number.
     */
    async listByWeek(weekOfYear: number): Promise<Entry[]> {
      return resolved.getEntriesForWeek(weekOfYear);
    },

    /**
     * Entries in an inclusive date range (YYYY-MM-DD).
     */
    async listRange(startDate: string, endDate: string): Promise<Entry[]> {
      return resolved.getEntriesForDateRange(startDate, endDate);
    },

    /**
     * Distinct dates that contain at least one entry (DESC order main-side).
     */
    async listDatesWithEntries(): Promise<string[]> {
      return resolved.getDatesWithEntries();
    },

    /**
     * Distinct weeks that contain entries.
     */
    async listWeeksWithEntries(): Promise<number[]> {
      return resolved.getWeeksWithEntries();
    },
  };
}

/**
 * Default singleton repository instance.
 * Prefer importing the factory for advanced scenarios (tests / multi-db).
 */
export const entriesRepository = createEntriesRepository();

/**
 * (Optional) Convenience type export if higher layers want to re-export.
 */
export type { Entry };

/**
 * Error code reference (centralize strings):
 *  - ENTRY_EMPTY_CONTENT: Provided content after trim was empty.
 *  - ENTRY_NOT_FOUND: Update attempted on non-existent ID.
 */
