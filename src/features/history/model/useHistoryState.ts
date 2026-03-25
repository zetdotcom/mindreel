import { useCallback, useEffect, useState } from "react";
import { filterWeeksWithContent, sortWeeksDescending, transformWeekData } from "./lib";
import { historyRepository } from "./repository";
import {
  type HistoryState,
  PAGE_WEEK_COUNT,
  type PaginationState,
  type RawWeekData,
  type ToastMessage,
  type WeekGroupViewModel,
} from "./types";

/**
 * Core state management hook for the History View
 * Handles loading weeks, pagination, and state management
 */
export function useHistoryState() {
  const [state, setState] = useState<HistoryState>({
    weeks: [],
    loadingInitial: true,
    pagination: {
      loading: false,
      loadedWeekKeys: [],
      hasMore: true,
    },
    deleteModal: { open: false },
    toasts: [],
  });

  /**
   * Remove a toast message
   */
  const removeToast = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      toasts: prev.toasts.filter((toast) => toast.id !== id),
    }));
  }, []);

  /**
   * Add a toast message
   */
  const addToast = useCallback(
    (toast: Omit<ToastMessage, "id">) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast: ToastMessage = { ...toast, id };

      setState((prev) => ({
        ...prev,
        toasts: [...prev.toasts, newToast],
      }));

      // Auto-remove toast after 5 seconds
      setTimeout(() => {
        removeToast(id);
      }, 5000);
    },
    [removeToast],
  );

  /**
   * Update pagination state
   */
  const updatePagination = useCallback((updates: Partial<PaginationState>) => {
    setState((prev) => ({
      ...prev,
      pagination: {
        ...prev.pagination,
        ...updates,
      },
    }));
  }, []);

  /**
   * Process raw weeks data into view models
   */
  const processWeeksData = useCallback((rawWeeks: RawWeekData[]): WeekGroupViewModel[] => {
    const weekViewModels = rawWeeks.map(transformWeekData);
    const filteredWeeks = filterWeeksWithContent(weekViewModels);
    return sortWeeksDescending(filteredWeeks);
  }, []);

  /**
   * Load initial weeks (first PAGE_WEEK_COUNT weeks from current week)
   */
  const loadInitialWeeks = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loadingInitial: true, error: undefined }));

      const result = await historyRepository.loadWeeks(0, PAGE_WEEK_COUNT);
      const processedWeeks = processWeeksData(result.rawWeeks);

      setState((prev) => ({
        ...prev,
        weeks: processedWeeks,
        loadingInitial: false,
        pagination: {
          ...prev.pagination,
          loadedWeekKeys: result.rawWeeks.map((w) => w.weekKey),
          hasMore: result.hasMore,
        },
      }));
    } catch (error) {
      console.error("Error loading initial weeks:", error);
      setState((prev) => ({
        ...prev,
        loadingInitial: false,
        error: error instanceof Error ? error.message : "Failed to load weeks",
      }));
      addToast({
        type: "error",
        text: "Failed to load history. Please try again.",
      });
    }
  }, [processWeeksData, addToast]);

  /**
   * Load more weeks (pagination)
   */
  const loadMoreWeeks = useCallback(async () => {
    if (state.pagination.loading || !state.pagination.hasMore) {
      return;
    }

    try {
      updatePagination({ loading: true });

      // Determine the starting point for pagination
      const result = await historyRepository.loadWeeks(state.weeks.length, PAGE_WEEK_COUNT);
      const newWeeks = processWeeksData(result.rawWeeks);

      setState((prev) => ({
        ...prev,
        weeks: [...prev.weeks, ...newWeeks],
        pagination: {
          ...prev.pagination,
          loading: false,
          loadedWeekKeys: [
            ...prev.pagination.loadedWeekKeys,
            ...result.rawWeeks.map((w) => w.weekKey),
          ],
          hasMore: result.hasMore,
        },
      }));
    } catch (error) {
      console.error("Error loading more weeks:", error);
      updatePagination({ loading: false });
      addToast({
        type: "error",
        text: "Failed to load more weeks. Please try again.",
      });
    }
  }, [state.pagination, state.weeks, processWeeksData, updatePagination, addToast]);

  /**
   * Refresh the current weeks (reload all loaded weeks)
   */
  const refreshWeeks = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, error: undefined }));

      // Reload from the beginning with the same count as currently loaded
      const weekCount = Math.max(state.weeks.length, PAGE_WEEK_COUNT);
      const result = await historyRepository.loadWeeks(0, weekCount);
      const processedWeeks = processWeeksData(result.rawWeeks);

      setState((prev) => ({
        ...prev,
        weeks: processedWeeks,
        pagination: {
          ...prev.pagination,
          loadedWeekKeys: result.rawWeeks.map((w) => w.weekKey),
          hasMore: result.hasMore,
        },
      }));

      addToast({
        type: "success",
        text: "History refreshed successfully.",
      });
    } catch (error) {
      console.error("Error refreshing weeks:", error);
      addToast({
        type: "error",
        text: "Failed to refresh history. Please try again.",
      });
    }
  }, [state.weeks.length, processWeeksData, addToast]);

  /**
   * Toggle week collapsed state
   */
  const toggleWeekCollapsed = useCallback((weekKey: string) => {
    setState((prev) => ({
      ...prev,
      weeks: prev.weeks.map((week) =>
        week.weekKey === weekKey ? { ...week, collapsed: !week.collapsed } : week,
      ),
    }));
  }, []);

  /**
   * Show delete confirmation modal
   */
  const showDeleteModal = useCallback((entryId: number) => {
    setState((prev) => ({
      ...prev,
      deleteModal: { open: true, entryId },
    }));
  }, []);

  /**
   * Hide delete confirmation modal
   */
  const hideDeleteModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      deleteModal: { open: false, entryId: undefined },
    }));
  }, []);

  /**
   * Update a specific week in state
   */
  const updateWeek = useCallback((weekKey: string, updates: Partial<WeekGroupViewModel>) => {
    setState((prev) => ({
      ...prev,
      weeks: prev.weeks.map((week) => (week.weekKey === weekKey ? { ...week, ...updates } : week)),
    }));
  }, []);

  /**
   * Remove a week from state
   */
  const removeWeek = useCallback((weekKey: string) => {
    setState((prev) => ({
      ...prev,
      weeks: prev.weeks.filter((week) => week.weekKey !== weekKey),
      pagination: {
        ...prev.pagination,
        loadedWeekKeys: prev.pagination.loadedWeekKeys.filter((key) => key !== weekKey),
      },
    }));
  }, []);

  // Initialize on mount
  useEffect(() => {
    loadInitialWeeks();
  }, [loadInitialWeeks]);

  return {
    // State
    weeks: state.weeks,
    loading: state.loadingInitial,
    error: state.error,
    pagination: state.pagination,
    deleteModal: state.deleteModal,
    toasts: state.toasts,

    // Actions
    loadMoreWeeks,
    refreshWeeks,
    toggleWeekCollapsed,
    showDeleteModal,
    hideDeleteModal,
    updateWeek,
    removeWeek,
    addToast,
    removeToast,
  };
}
