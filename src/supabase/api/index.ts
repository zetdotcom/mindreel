// Main export file for MindReel Edge Function API client library
// Provides a clean, organized interface for all API functionality

import EdgeFunctionClient from "./client";

// Core client and types
export { createClient, EdgeFunctionClient } from "./client";
// Hook types
export type {
  UseWeeklySummaryActions,
  UseWeeklySummaryOptions,
  UseWeeklySummaryReturn,
  UseWeeklySummaryState,
} from "./hooks";
// React hooks
export {
  useOfflineQueue,
  useQuotaInfo,
  useValidation,
  useWeeklySummary,
  useWeeklySummaryComplete,
  useWeekRange,
} from "./hooks";
// Retry utilities
export {
  calculateRetryDelay,
  createAggressiveRetryManager,
  createNetworkRetryManager,
  createQuickRetryManager,
  defaultRetryManager,
  isRetryableError,
  RetryManager,
  withRetry,
} from "./retry";
export type {
  ClientStatus,
  EdgeFunctionClientConfig,
  Entry,
  QuotaInfo,
  RequestOptions,
  RetryConfig,
  SupportedLanguage,
  ValidationResult,
  WeeklySummaryErrorResponse,
  WeeklySummaryRequest,
  WeeklySummaryResponse,
  WeeklySummarySuccessResponse,
  WeekRange,
} from "./types";
// Error classes
// Constants
export {
  DEFAULT_RETRY_CONFIG,
  EdgeFunctionError,
  NetworkError,
  QUOTA_LIMITS,
  SUPPORTED_LANGUAGES,
  TimeoutError,
  VALIDATION_RULES,
} from "./types";
// Validation utilities
export {
  createWeekRange,
  getCurrentWeekRange,
  getMondayOfWeek,
  getPreviousWeekRange,
  getWeekRangeForDate,
  isMonday,
  isSunday,
  isValidDateString,
  preprocessRequest,
  sanitizeEntries,
  sanitizeEntryText,
  validateEntries,
  validateLanguage,
  validateWeeklySummaryRequest,
  validateWeekRange,
} from "./validation";

// Test data (for development/testing)
// export {
//   sampleEntriesEN,
//   sampleEntriesPL,
//   sampleEntriesWithDuplicates,
//   sampleEntriesLongText,
//   validRequestEN,
//   validRequestPL,
//   requestWithoutLanguage,
//   invalidRequests,
//   mockEnvVars,
//   mockOpenRouterResponse,
//   mockQuotaStates,
// } from "./test-data";

// Convenience factory functions
export const createMockClient = EdgeFunctionClient.createMock;
export const createClientFromEnv = EdgeFunctionClient.fromEnv;

/**
 * Default export - the main EdgeFunctionClient class
 */
export default EdgeFunctionClient;
