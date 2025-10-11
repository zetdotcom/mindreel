// React hooks for MindReel Edge Function integration
// Provides easy-to-use React hooks for weekly summary generation

import { useState, useCallback, useRef, useEffect } from "react";
import type {
  WeeklySummaryRequest,
  WeeklySummarySuccessResponse,
  QuotaInfo,
  WeekRange,
} from "./types";
import { EdgeFunctionError } from "./types";
import { EdgeFunctionClient } from "./client";
import { getCurrentWeekRange, getPreviousWeekRange } from "./validation";

// Hook state types
export interface UseWeeklySummaryState {
  loading: boolean;
  error: EdgeFunctionError | null;
  data: WeeklySummarySuccessResponse | null;
  quota: QuotaInfo | null;
}

export interface UseWeeklySummaryActions {
  generateSummary: (request: WeeklySummaryRequest) => Promise<void>;
  clearError: () => void;
  clearData: () => void;
  reset: () => void;
}

export type UseWeeklySummaryReturn = UseWeeklySummaryState &
  UseWeeklySummaryActions;

// Options for the hook
export interface UseWeeklySummaryOptions {
  client?: EdgeFunctionClient;
  onSuccess?: (data: WeeklySummarySuccessResponse) => void;
  onError?: (error: EdgeFunctionError) => void;
  authToken?: string;
}

/**
 * Main hook for generating weekly summaries
 */
export function useWeeklySummary(
  options: UseWeeklySummaryOptions = {},
): UseWeeklySummaryReturn {
  const [state, setState] = useState<UseWeeklySummaryState>({
    loading: false,
    error: null,
    data: null,
    quota: null,
  });

  const clientRef = useRef<EdgeFunctionClient | null>(options.client || null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Update client reference when options change
  useEffect(() => {
    if (options.client) {
      clientRef.current = options.client;
    }
  }, [options.client]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const generateSummary = useCallback(
    async (request: WeeklySummaryRequest) => {
      if (!clientRef.current) {
        const error = new EdgeFunctionError(
          "other_error",
          "EdgeFunctionClient not provided",
        );
        setState((prev) => ({ ...prev, error }));
        options.onError?.(error);
        return;
      }

      if (!options.authToken) {
        const error = new EdgeFunctionError(
          "auth_error",
          "Authentication token not provided",
        );
        setState((prev) => ({ ...prev, error }));
        options.onError?.(error);
        return;
      }

      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        const result = await clientRef.current.generateWeeklySummary(
          request,
          options.authToken,
          { signal: abortControllerRef.current.signal },
        );

        // Update quota info from client
        const quota = clientRef.current.getQuotaInfo();

        setState((prev) => ({
          ...prev,
          loading: false,
          data: result,
          quota,
        }));

        options.onSuccess?.(result);
      } catch (error) {
        const edgeError =
          error instanceof EdgeFunctionError
            ? error
            : new EdgeFunctionError(
                "other_error",
                error instanceof Error ? error.message : String(error),
              );

        // Update quota info even on error (might be quota_exceeded)
        const quota = clientRef.current.getQuotaInfo();

        setState((prev) => ({
          ...prev,
          loading: false,
          error: edgeError,
          quota,
        }));

        options.onError?.(edgeError);
      }
    },
    [options.authToken, options.onSuccess, options.onError],
  );

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const clearData = useCallback(() => {
    setState((prev) => ({ ...prev, data: null }));
  }, []);

  const reset = useCallback(() => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setState({
      loading: false,
      error: null,
      data: null,
      quota: null,
    });
  }, []);

  return {
    ...state,
    generateSummary,
    clearError,
    clearData,
    reset,
  };
}

/**
 * Hook for managing quota information
 */
export function useQuotaInfo(client?: EdgeFunctionClient) {
  const [quota, setQuota] = useState<QuotaInfo | null>(null);

  const updateQuota = useCallback(() => {
    if (client) {
      const quotaInfo = client.getQuotaInfo();
      setQuota(quotaInfo);
    }
  }, [client]);

  // Update quota when client changes
  useEffect(() => {
    updateQuota();
  }, [updateQuota]);

  const isAvailable = quota ? quota.remaining > 0 : true;
  const isNearLimit = quota ? quota.remaining <= 1 : false;
  const daysUntilReset = quota
    ? Math.ceil((quota.cycleEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return {
    quota,
    isAvailable,
    isNearLimit,
    daysUntilReset,
    updateQuota,
  };
}

/**
 * Hook for managing week ranges
 */
export function useWeekRange(initialWeek?: WeekRange) {
  const [currentWeek, setCurrentWeek] = useState<WeekRange>(
    initialWeek || getCurrentWeekRange(),
  );

  const goToCurrentWeek = useCallback(() => {
    setCurrentWeek(getCurrentWeekRange());
  }, []);

  const goToPreviousWeek = useCallback(() => {
    setCurrentWeek(getPreviousWeekRange());
  }, []);

  const goToWeek = useCallback((week: WeekRange) => {
    setCurrentWeek(week);
  }, []);

  const isCurrentWeek = useCallback(() => {
    const current = getCurrentWeekRange();
    return currentWeek.startString === current.startString;
  }, [currentWeek.startString]);

  return {
    currentWeek,
    goToCurrentWeek,
    goToPreviousWeek,
    goToWeek,
    isCurrentWeek,
  };
}

/**
 * Hook for validation state
 */
export function useValidation() {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validate = useCallback(
    (client: EdgeFunctionClient, request: WeeklySummaryRequest) => {
      const result = client.validateRequest(request);
      setValidationErrors(result.errors);
      return result.valid;
    },
    [],
  );

  const clearValidation = useCallback(() => {
    setValidationErrors([]);
  }, []);

  const hasErrors = validationErrors.length > 0;

  return {
    validationErrors,
    hasErrors,
    validate,
    clearValidation,
  };
}

/**
 * Combined hook that provides all functionality
 */
export function useWeeklySummaryComplete(
  client: EdgeFunctionClient,
  authToken?: string,
) {
  const summary = useWeeklySummary({ client, authToken });
  const quota = useQuotaInfo(client);
  const weekRange = useWeekRange();
  const validation = useValidation();

  // Auto-clear validation errors when request succeeds
  useEffect(() => {
    if (summary.data) {
      validation.clearValidation();
    }
  }, [summary.data, validation.clearValidation]);

  const generateSummaryWithValidation = useCallback(
    async (request: WeeklySummaryRequest) => {
      const isValid = validation.validate(client, request);
      if (isValid) {
        await summary.generateSummary(request);
      }
    },
    [client, validation.validate, summary.generateSummary],
  );

  return {
    // Summary state and actions
    ...summary,
    generateSummary: generateSummaryWithValidation,

    // Quota information
    quota: quota.quota,
    isQuotaAvailable: quota.isAvailable,
    isNearQuotaLimit: quota.isNearLimit,
    daysUntilQuotaReset: quota.daysUntilReset,
    updateQuota: quota.updateQuota,

    // Week range management
    currentWeek: weekRange.currentWeek,
    goToCurrentWeek: weekRange.goToCurrentWeek,
    goToPreviousWeek: weekRange.goToPreviousWeek,
    goToWeek: weekRange.goToWeek,
    isCurrentWeek: weekRange.isCurrentWeek,

    // Validation
    validationErrors: validation.validationErrors,
    hasValidationErrors: validation.hasErrors,
    clearValidation: validation.clearValidation,
  };
}

/**
 * Hook for offline queue functionality (future enhancement)
 */
export function useOfflineQueue() {
  const [queue, setQueue] = useState<WeeklySummaryRequest[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const addToQueue = useCallback((request: WeeklySummaryRequest) => {
    setQueue((prev) => [...prev, request]);
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  return {
    queue,
    isOnline,
    queueLength: queue.length,
    addToQueue,
    removeFromQueue,
    clearQueue,
  };
}
