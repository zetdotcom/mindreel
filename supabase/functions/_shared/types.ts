// Shared TypeScript types for MindReel Edge Functions

export interface Entry {
  timestamp: string;
  text: string;
}

export interface RequestPayload {
  week_start: string; // Monday (YYYY-MM-DD)
  week_end: string; // Sunday (YYYY-MM-DD)
  entries: Entry[];
  language?: "pl" | "en";
  client_meta?: Record<string, unknown>;
}

export interface SuccessResponse {
  ok: true;
  summary: string;
  remaining: number;
  cycle_end: string;
}

export interface ErrorResponse {
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

export interface QuotaState {
  user_id: string;
  ai_summaries_count: number;
  cycle_start_at: string;
  updated_at: string;
}

export interface OpenRouterResponse {
  ok: boolean;
  summary?: string;
  error?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface NormalizedEntry {
  timestamp: Date;
  text: string;
  truncated?: boolean;
}

export interface PromptData {
  system: string;
  user: string;
  language: "pl" | "en";
  entryCount: number;
  totalChars: number;
}

// Environment variables interface for type safety
export interface EdgeFunctionEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  OPENROUTER_API_KEY: string;
  OPENROUTER_MODEL: string;
  MAX_PROMPT_CHARS: string;
  ENTRY_TRUNCATION_LIMIT: string;
  LOG_LEVEL?: string;
}

// Database function result types
export interface DatabaseQuotaResult {
  user_id: string;
  ai_summaries_count: number;
  cycle_start_at: string;
  updated_at: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// Constants as const assertions for type safety
export const QUOTA_LIMITS = {
  MAX_SUMMARIES: 5,
  CYCLE_DAYS: 28,
  MAX_ENTRIES: 1000,
  MAX_ENTRY_LENGTH: 10000,
  MAX_TOTAL_CHARS: 50000,
} as const;

export const ERROR_CODES = {
  AUTH_ERROR: "auth_error",
  VALIDATION_ERROR: "validation_error",
  QUOTA_EXCEEDED: "quota_exceeded",
  PROVIDER_ERROR: "provider_error",
  OTHER_ERROR: "other_error",
} as const;

export const SUPPORTED_LANGUAGES = ["pl", "en"] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];
