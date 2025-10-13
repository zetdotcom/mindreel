// Client-side TypeScript types for MindReel Edge Function integration
// Shared between frontend and edge functions for type safety

export interface Entry {
  timestamp: string;
  text: string;
}

export interface WeeklySummaryRequest {
  week_start: string; // Monday (YYYY-MM-DD)
  week_end: string; // Sunday (YYYY-MM-DD)
  entries: Entry[];
  language?: "pl" | "en";
  client_meta?: {
    app_version?: string;
    timezone?: string;
    locale?: string;
    [key: string]: unknown;
  };
}

export interface WeeklySummarySuccessResponse {
  ok: true;
  summary: string;
  remaining: number;
  cycle_end: string;
}

export interface WeeklySummaryErrorResponse {
  ok: false;
  reason:
    | "auth_error"
    | "validation_error"
    | "quota_exceeded"
    | "provider_error"
    | "other_error";
  message?: string;
  remaining?: number;
  cycle_end?: string;
  retryable?: boolean;
}

export type WeeklySummaryResponse =
  | WeeklySummarySuccessResponse
  | WeeklySummaryErrorResponse;

// Client configuration
export interface EdgeFunctionClientConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

// Request options for individual calls
export interface RequestOptions {
  timeout?: number;
  signal?: AbortSignal;
  retryAttempts?: number;
}

// Error classes for better error handling
export class EdgeFunctionError extends Error {
  constructor(
    public readonly reason: WeeklySummaryErrorResponse["reason"],
    message: string,
    public readonly response?: WeeklySummaryErrorResponse,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = "EdgeFunctionError";
  }
}

export class NetworkError extends Error {
  constructor(message: string, public readonly retryable: boolean = true) {
    super(message);
    this.name = "NetworkError";
  }
}

export class TimeoutError extends Error {
  constructor(message: string = "Request timed out") {
    super(message);
    this.name = "TimeoutError";
  }
}

// Validation result types
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Date range utilities
export interface WeekRange {
  start: Date;
  end: Date;
  startString: string; // YYYY-MM-DD
  endString: string; // YYYY-MM-DD
}

// Quota information
export interface QuotaInfo {
  used: number;
  remaining: number;
  limit: number;
  cycleEnd: Date;
  cycleEndString: string;
}

// Client status
export interface ClientStatus {
  authenticated: boolean;
  userId?: string;
  quota?: QuotaInfo;
  lastError?: EdgeFunctionError;
}

// Retry configuration
export interface RetryConfig {
  attempts: number;
  delay: number;
  backoffMultiplier: number;
  maxDelay: number;
  retryableErrors: WeeklySummaryErrorResponse["reason"][];
}

// Default retry configuration
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  attempts: 3,
  delay: 1000, // 1 second
  backoffMultiplier: 2,
  maxDelay: 10000, // 10 seconds
  retryableErrors: ["provider_error", "other_error"]
};

// Constants
export const QUOTA_LIMITS = {
  MAX_SUMMARIES: 5,
  CYCLE_DAYS: 28,
  MAX_ENTRIES: 1000,
  MAX_ENTRY_LENGTH: 10000,
  MAX_TOTAL_CHARS: 50000,
} as const;

export const SUPPORTED_LANGUAGES = ["pl", "en"] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

// Validation constraints
export const VALIDATION_RULES = {
  MAX_ENTRIES: 1000,
  MAX_ENTRY_TEXT_LENGTH: 10000,
  MAX_TOTAL_TEXT_LENGTH: 50000,
  FUTURE_DATE_LIMIT_DAYS: 1,
} as const;
