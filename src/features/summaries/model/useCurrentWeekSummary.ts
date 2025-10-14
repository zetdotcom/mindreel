import { useState, useCallback, useEffect, useRef } from "react";
import { summariesRepository, type Summary } from "./repository";

/**
 * useCurrentWeekSummary
 *
 * Stateful hook that loads (and optionally creates) the summary for the current week.
 * It encapsulates:
 *  - Initial fetch (optional auto-load)
 *  - Creation (builds content from entries via repository createForCurrentWeek)
 *  - Loading / creating / error states
 *  - Optional retrieval of recent summaries
 *
 * Out of scope:
 *  - AI generation (will plug into repository via createForCurrentWeekWithContent in future)
 *  - Cross-component caching (introduce React Query later if warranted)
 *
 * Usage:
 *   const {
 *     summary, loading, creating, error,
 *     load, create,
 *     recentSummaries, loadRecent
 *   } = useCurrentWeekSummary();
 *
 * Design Notes:
 *  - We track a simple optimistic state: after successful creation we set summary immediately.
 *  - Error messages are stringified for presentational convenience.
 *  - All repository calls are awaited; no race cancellation (small surface; can extend later).
 */

export interface UseCurrentWeekSummaryOptions {
  /**
   * Automatically load the summary on mount (default true)
   */
  autoLoad?: boolean;
  /**
   * Automatically load recent summaries on mount (default false)
   */
  autoLoadRecent?: boolean;
  /**
   * How many recent summaries to load when calling loadRecent (default 5)
   */
  recentLimit?: number;
  /**
   * Callback fired after a successful creation
   */
  onCreated?: (summary: Summary) => void;
  /**
   * Swallow (do not set) errors for load/create (default false)
   * If true, the hook won't put the message into `error`; caller can inspect thrown value.
   */
  suppressErrorState?: boolean;
}

export interface UseCurrentWeekSummaryResult {
  summary: Summary | null;
  loading: boolean;
  creating: boolean;
  error: string | null;

  load: () => Promise<Summary | null>;
  refresh: () => Promise<Summary | null>; // alias
  create: () => Promise<Summary>;

  recentSummaries: Summary[] | null;
  recentLoading: boolean;
  loadRecent: (limit?: number) => Promise<Summary[]>;

  /**
   * Manually clear stored error
   */
  clearError: () => void;
}

export function useCurrentWeekSummary(
  {
    autoLoad = true,
    autoLoadRecent = false,
    recentLimit = 5,
    onCreated,
    suppressErrorState = false,
  }: UseCurrentWeekSummaryOptions = {},
): UseCurrentWeekSummaryResult {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [recentSummaries, setRecentSummaries] = useState<Summary[] | null>(null);
  const [recentLoading, setRecentLoading] = useState(false);

  const mountedRef = useRef(true);

  const setErrorMaybe = useCallback(
    (err: unknown) => {
      if (suppressErrorState) return;
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "Unknown error";
      setError(msg);
    },
    [suppressErrorState],
  );

  const clearError = useCallback(() => setError(null), []);

  const load = useCallback(async () => {
    setLoading(true);
    clearError();
    try {
      const s = await summariesRepository.getCurrent();
      if (mountedRef.current) setSummary(s);
      return s;
    } catch (e) {
      if (mountedRef.current) setErrorMaybe(e);
      throw e;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [setErrorMaybe, clearError]);

  const create = useCallback(async () => {
    setCreating(true);
    clearError();
    try {
      // Avoid duplicate creation if one already exists.
      const exists = await summariesRepository.existsForCurrentWeek();
      if (exists) {
        const current = await summariesRepository.getCurrent();
        if (current) {
          if (mountedRef.current) setSummary(current);
          return current;
        }
      }
      const created = await summariesRepository.createForCurrentWeek();
      if (mountedRef.current) setSummary(created);
      onCreated?.(created);
      return created;
    } catch (e) {
      if (mountedRef.current) setErrorMaybe(e);
      throw e;
    } finally {
      if (mountedRef.current) setCreating(false);
    }
  }, [onCreated, setErrorMaybe, clearError]);

  const loadRecent = useCallback(
    async (limit?: number) => {
      setRecentLoading(true);
      try {
        const rec = await summariesRepository.listRecent(limit ?? recentLimit);
        if (mountedRef.current) setRecentSummaries(rec);
        return rec;
      } catch (e) {
        // Do not override main error state with a recent fetch failure; log silently.
        console.warn("Failed to load recent summaries:", e);
        return [];
      } finally {
        if (mountedRef.current) setRecentLoading(false);
      }
    },
    [recentLimit],
  );

  // Auto-load effects
  useEffect(() => {
    if (autoLoad) {
      load().catch((e) => {
        console.error("Auto load current week summary failed:", e);
      });
    }
    if (autoLoadRecent) {
      loadRecent().catch((e) => {
        console.error("Auto load recent summaries failed:", e);
      });
    }
  }, [autoLoad, autoLoadRecent, load, loadRecent]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    summary,
    loading,
    creating,
    error,
    load,
    refresh: load,
    create,
    recentSummaries,
    recentLoading,
    loadRecent,
    clearError,
  };
}

export default useCurrentWeekSummary;
