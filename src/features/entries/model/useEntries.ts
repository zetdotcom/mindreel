import { useState, useCallback, useEffect, useRef } from "react";
import { entriesRepository, type Entry } from "./repository";

/**
 * useEntries
 *
 * Stateful hook managing a collection of Entry records plus CRUD helpers.
 * By default it manages *today's* entries, but you can opt into a specific
 * date or week. You can also bypass auto-loading and invoke load functions
 * manually.
 *
 * Example:
 *   const {
 *     entries, loading, error,
 *     loadToday, loadByDate, createEntry, updateEntry, deleteEntry
 *   } = useEntries();
 *
 * Design Principles:
 *  - Repository handles IPC & normalization; this hook deals only with view state.
 *  - No global cache: integrate with React Query later if needed.
 *  - Optimistic updates for create / delete (minimal; rollback via reload on failure if you extend).
 */

export interface UseEntriesConfig {
  /**
   * Initial mode to auto-load.
   * "today" (default) | "date" | "week" | "none"
   */
  initialMode?: "today" | "date" | "week" | "none";
  /**
   * Date string (YYYY-MM-DD) used when initialMode === "date".
   */
  date?: string;
  /**
   * ISO week number used when initialMode === "week".
   */
  weekOfYear?: number;
  /**
   * Auto-load immediately on mount (default true unless initialMode === "none").
   */
  autoLoad?: boolean;
}

export interface UseEntriesResult {
  entries: Entry[];
  loading: boolean;
  error: string | null;

  // Loaders
  loadToday: () => Promise<Entry[]>;
  loadByDate: (date: string) => Promise<Entry[]>;
  loadByWeek: (week: number) => Promise<Entry[]>;
  reload: () => Promise<Entry[]>; // Re-run last successful load criteria

  // Mutations
  createEntry: (content: string) => Promise<Entry>;
  updateEntry: (id: number, content: string) => Promise<Entry>;
  deleteEntry: (id: number) => Promise<boolean>;

  // Meta
  lastLoadMode: "today" | "date" | "week" | null;
  lastLoadKey: string | number | null;
}

interface LastCriteria {
  mode: "today" | "date" | "week" | null;
  key: string | number | null;
}

export function useEntries(config: UseEntriesConfig = {}): UseEntriesResult {
  const {
    initialMode = "today",
    date,
    weekOfYear,
    autoLoad = initialMode !== "none",
  } = config;

  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastCriteriaRef = useRef<LastCriteria>({ mode: null, key: null });
  const mountedRef = useRef(true);

  const setLastCriteria = (
    mode: LastCriteria["mode"],
    key: LastCriteria["key"],
  ) => {
    lastCriteriaRef.current = { mode, key };
  };

  const loadWrapper = useCallback(
    async <T extends any[]>(
      loader: (...args: T) => Promise<Entry[]>,
      mode: LastCriteria["mode"],
      key: LastCriteria["key"],
      ...args: T
    ): Promise<Entry[]> => {
      setLoading(true);
      setError(null);
      try {
        const data = await loader(...args);
        if (!mountedRef.current) return data;
        setEntries(data);
        setLastCriteria(mode, key);
        return data;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load entries";
        if (mountedRef.current) setError(msg);
        throw e;
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [],
  );

  const loadToday = useCallback(
    () => loadWrapper(entriesRepository.listToday, "today", "today"),
    [loadWrapper],
  );

  const loadByDate = useCallback(
    (d: string) => loadWrapper(entriesRepository.listByDate, "date", d, d),
    [loadWrapper],
  );

  const loadByWeek = useCallback(
    (w: number) => loadWrapper(entriesRepository.listByWeek, "week", w, w),
    [loadWrapper],
  );

  const reload = useCallback(async () => {
    const { mode, key } = lastCriteriaRef.current;
    if (!mode) {
      // No previous load - fall back to today
      return loadToday();
    }
    if (mode === "today") return loadToday();
    if (mode === "date" && typeof key === "string") return loadByDate(key);
    if (mode === "week" && typeof key === "number") return loadByWeek(key);
    return loadToday();
  }, [loadByDate, loadByWeek, loadToday]);

  // Mutations
  const createEntry = useCallback(async (content: string) => {
    const created = await entriesRepository.create(content);
    // Optimistic append only if current set logically includes "today"
    const { mode } = lastCriteriaRef.current;
    const isTodayContext =
      mode === "today" ||
      (mode === "date" &&
        new Date().toISOString().slice(0, 10) === lastCriteriaRef.current.key);
    if (isTodayContext) {
      setEntries((prev) => [...prev, created]);
    }
    return created;
  }, []);

  const updateEntry = useCallback(async (id: number, content: string) => {
    const updated = await entriesRepository.update(id, content);
    setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    return updated;
  }, []);

  const deleteEntry = useCallback(async (id: number) => {
    const ok = await entriesRepository.remove(id);
    if (ok) {
      setEntries((prev) => prev.filter((e) => e.id !== id));
    }
    return ok;
  }, []);

  // Initial auto-load
  useEffect(() => {
    if (!autoLoad) return;
    let cancelled = false;

    const boot = async () => {
      try {
        if (initialMode === "today") {
          await loadToday();
        } else if (initialMode === "date" && date) {
          await loadByDate(date);
        } else if (initialMode === "week" && typeof weekOfYear === "number") {
          await loadByWeek(weekOfYear);
        }
      } catch {
        if (!cancelled) {
          // error state already set by loader
        }
      }
    };

    boot();
    return () => {
      cancelled = true;
    };
  }, [
    autoLoad,
    initialMode,
    date,
    weekOfYear,
    loadToday,
    loadByDate,
    loadByWeek,
  ]);

  // Track mount status to avoid state updates after unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    entries,
    loading,
    error,
    loadToday,
    loadByDate,
    loadByWeek,
    reload,
    createEntry,
    updateEntry,
    deleteEntry,
    lastLoadMode: lastCriteriaRef.current.mode,
    lastLoadKey: lastCriteriaRef.current.key,
  };
}
