// Main export file for MindReel Edge Function API client library
// Provides a clean, organized interface for all API functionality

// Core client and types
export { EdgeFunctionClient, createClient } from './client';
export type {
  WeeklySummaryRequest,
  WeeklySummaryResponse,
  WeeklySummarySuccessResponse,
  WeeklySummaryErrorResponse,
  Entry,
  EdgeFunctionClientConfig,
  RequestOptions,
  QuotaInfo,
  ClientStatus,
  WeekRange,
  SupportedLanguage,
  ValidationResult,
  RetryConfig,
} from './types';

// Error classes
export {
  EdgeFunctionError,
  NetworkError,
  TimeoutError,
} from './types';

// Constants
export {
  QUOTA_LIMITS,
  SUPPORTED_LANGUAGES,
  VALIDATION_RULES,
  DEFAULT_RETRY_CONFIG,
} from './types';

// Validation utilities
export {
  validateWeeklySummaryRequest,
  validateWeekRange,
  validateEntries,
  validateLanguage,
  isValidDateString,
  isMonday,
  isSunday,
  createWeekRange,
  getMondayOfWeek,
  getWeekRangeForDate,
  getCurrentWeekRange,
  getPreviousWeekRange,
  sanitizeEntryText,
  sanitizeEntries,
  preprocessRequest,
} from './validation';

// Retry utilities
export {
  RetryManager,
  defaultRetryManager,
  withRetry,
  createNetworkRetryManager,
  createQuickRetryManager,
  createAggressiveRetryManager,
  isRetryableError,
  calculateRetryDelay,
} from './retry';

// React hooks
export {
  useWeeklySummary,
  useQuotaInfo,
  useWeekRange,
  useValidation,
  useWeeklySummaryComplete,
  useOfflineQueue,
} from './hooks';

// Hook types
export type {
  UseWeeklySummaryState,
  UseWeeklySummaryActions,
  UseWeeklySummaryReturn,
  UseWeeklySummaryOptions,
} from './hooks';

// Test data (for development/testing)
export {
  sampleEntriesEN,
  sampleEntriesPL,
  sampleEntriesWithDuplicates,
  sampleEntriesLongText,
  validRequestEN,
  validRequestPL,
  requestWithoutLanguage,
  invalidRequests,
  mockEnvVars,
  mockOpenRouterResponse,
  mockQuotaStates,
} from './test-data';

// Convenience factory functions
export const createMockClient = EdgeFunctionClient.createMock;
export const createClientFromEnv = EdgeFunctionClient.fromEnv;

/**
 * Default export - the main EdgeFunctionClient class
 */
export default EdgeFunctionClient;
