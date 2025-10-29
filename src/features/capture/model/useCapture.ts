import { useCallback, useEffect, useState } from "react";
import { getRecentUniqueEntries } from "./repository";

/**
 * useCapture
 *
 * Hook for managing capture popup state.
 * Provides:
 *  - Recent unique entries for prefill
 *  - Loading state during fetch
 */
export function useCapture() {
  const [recentEntries, setRecentEntries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecentEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const entries = await getRecentUniqueEntries(4);
      setRecentEntries(entries);
    } catch (err) {
      console.error("Failed to load recent entries:", err);
      setError("Failed to load recent entries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecentEntries();
  }, [loadRecentEntries]);

  return {
    recentEntries,
    loading,
    error,
    refresh: loadRecentEntries,
  };
}
