// Test data utilities for MindReel Edge Functions
// Provides sample data for testing and validation

import type { Entry, RequestPayload } from './types.ts';

/**
 * Sample entries for testing - English content
 */
export const sampleEntriesEN: Entry[] = [
  {
    timestamp: "2025-02-10T09:12:00.000Z",
    text: "Refactored authentication module to use new JWT library"
  },
  {
    timestamp: "2025-02-10T11:40:00.000Z",
    text: "Fixed Electron auto-update issue affecting Windows users"
  },
  {
    timestamp: "2025-02-11T10:15:00.000Z",
    text: "Implemented user settings persistence in local storage"
  },
  {
    timestamp: "2025-02-11T14:30:00.000Z",
    text: "Added validation for email input fields in registration form"
  },
  {
    timestamp: "2025-02-12T08:45:00.000Z",
    text: "Optimized database queries for faster dashboard loading"
  },
  {
    timestamp: "2025-02-13T16:20:00.000Z",
    text: "Created unit tests for payment processing module"
  },
  {
    timestamp: "2025-02-14T13:10:00.000Z",
    text: "Updated API documentation with new endpoint specifications"
  }
];

/**
 * Sample entries for testing - Polish content
 */
export const sampleEntriesPL: Entry[] = [
  {
    timestamp: "2025-02-10T09:12:00.000Z",
    text: "Refaktoryzacja modułu uwierzytelniania z nową biblioteką JWT"
  },
  {
    timestamp: "2025-02-10T11:40:00.000Z",
    text: "Naprawiono problem z automatyczną aktualizacją w aplikacji Electron"
  },
  {
    timestamp: "2025-02-11T10:15:00.000Z",
    text: "Zaimplementowano trwałość ustawień użytkownika w lokalnej pamięci"
  },
  {
    timestamp: "2025-02-11T14:30:00.000Z",
    text: "Dodano walidację pól email w formularzu rejestracji"
  },
  {
    timestamp: "2025-02-12T08:45:00.000Z",
    text: "Zoptymalizowano zapytania do bazy danych dla szybszego ładowania dashboardu"
  },
  {
    timestamp: "2025-02-13T16:20:00.000Z",
    text: "Utworzono testy jednostkowe dla modułu przetwarzania płatności"
  },
  {
    timestamp: "2025-02-14T13:10:00.000Z",
    text: "Zaktualizowano dokumentację API z nowymi specyfikacjami endpointów"
  }
];

/**
 * Sample entries with consecutive duplicates for testing deduplication
 */
export const sampleEntriesWithDuplicates: Entry[] = [
  {
    timestamp: "2025-02-10T09:00:00.000Z",
    text: "Working on bug fix"
  },
  {
    timestamp: "2025-02-10T09:15:00.000Z",
    text: "Working on bug fix"
  },
  {
    timestamp: "2025-02-10T09:30:00.000Z",
    text: "Working on bug fix"
  },
  {
    timestamp: "2025-02-10T11:00:00.000Z",
    text: "Code review completed"
  },
  {
    timestamp: "2025-02-10T11:15:00.000Z",
    text: "Code review completed"
  },
  {
    timestamp: "2025-02-10T14:00:00.000Z",
    text: "Meeting with product team"
  }
];

/**
 * Sample entries with very long text for truncation testing
 */
export const sampleEntriesLongText: Entry[] = [
  {
    timestamp: "2025-02-10T09:00:00.000Z",
    text: "This is a very long entry that should be truncated when the text exceeds the maximum allowed length limit. ".repeat(20)
  },
  {
    timestamp: "2025-02-10T10:00:00.000Z",
    text: "Short entry"
  }
];

/**
 * Valid request payload for testing - English
 */
export const validRequestEN: RequestPayload = {
  week_start: "2025-02-10", // Monday
  week_end: "2025-02-16",   // Sunday
  entries: sampleEntriesEN,
  language: "en",
  client_meta: {
    app_version: "0.2.0",
    timezone: "Europe/London",
    locale: "en-US"
  }
};

/**
 * Valid request payload for testing - Polish
 */
export const validRequestPL: RequestPayload = {
  week_start: "2025-02-10", // Monday
  week_end: "2025-02-16",   // Sunday
  entries: sampleEntriesPL,
  language: "pl",
  client_meta: {
    app_version: "0.2.0",
    timezone: "Europe/Warsaw",
    locale: "pl-PL"
  }
};

/**
 * Request with no language specified (for auto-detection testing)
 */
export const requestWithoutLanguage: RequestPayload = {
  week_start: "2025-02-10",
  week_end: "2025-02-16",
  entries: sampleEntriesPL // Polish entries without language specified
};

/**
 * Invalid request payloads for validation testing
 */
export const invalidRequests = {
  // Wrong week range (not Monday-Sunday)
  invalidWeekRange: {
    week_start: "2025-02-11", // Tuesday
    week_end: "2025-02-17",   // Monday
    entries: sampleEntriesEN
  },

  // Future date
  futureDate: {
    week_start: "2025-12-01", // Far in future
    week_end: "2025-12-07",
    entries: sampleEntriesEN
  },

  // Empty entries
  emptyEntries: {
    week_start: "2025-02-10",
    week_end: "2025-02-16",
    entries: []
  },

  // Entry outside date range
  entryOutsideRange: {
    week_start: "2025-02-10",
    week_end: "2025-02-16",
    entries: [
      {
        timestamp: "2025-02-09T12:00:00.000Z", // Before week_start
        text: "This entry is outside the week range"
      }
    ]
  },

  // Invalid language
  invalidLanguage: {
    week_start: "2025-02-10",
    week_end: "2025-02-16",
    entries: sampleEntriesEN,
    language: "fr" // Not supported
  }
};

/**
 * Mock environment variables for testing
 */
export const mockEnvVars = {
  SUPABASE_URL: "https://test-project.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.test-key",
  OPENROUTER_API_KEY: "sk-or-v1-test-key-12345",
  OPENROUTER_MODEL: "openai/gpt-4o-mini",
  MAX_PROMPT_CHARS: "10000",
  ENTRY_TRUNCATION_LIMIT: "500",
  LOG_LEVEL: "debug"
};

/**
 * Mock successful OpenRouter API response
 */
export const mockOpenRouterResponse = {
  choices: [
    {
      message: {
        content: `- Completed authentication module refactoring with JWT integration
- Fixed critical Electron auto-update issue for Windows platform
- Implemented persistent user settings using local storage
- Added comprehensive email validation for registration forms
- Optimized database queries improving dashboard load times by 40%
- Developed unit test suite for payment processing functionality
- Updated API documentation with detailed endpoint specifications`
      },
      finish_reason: "stop"
    }
  ],
  usage: {
    prompt_tokens: 245,
    completion_tokens: 120,
    total_tokens: 365
  }
};

/**
 * Mock quota state for testing
 */
export const mockQuotaStates = {
  newUser: {
    user_id: "00000000-0000-0000-0000-000000000001",
    ai_summaries_count: 0,
    cycle_start_at: "2025-02-01T00:00:00.000Z",
    updated_at: "2025-02-01T00:00:00.000Z"
  },

  activeUser: {
    user_id: "00000000-0000-0000-0000-000000000002",
    ai_summaries_count: 3,
    cycle_start_at: "2025-02-01T00:00:00.000Z",
    updated_at: "2025-02-10T12:00:00.000Z"
  },

  limitReached: {
    user_id: "00000000-0000-0000-0000-000000000003",
    ai_summaries_count: 5,
    cycle_start_at: "2025-02-01T00:00:00.000Z",
    updated_at: "2025-02-15T18:30:00.000Z"
  },

  expiredCycle: {
    user_id: "00000000-0000-0000-0000-000000000004",
    ai_summaries_count: 4,
    cycle_start_at: "2025-01-01T00:00:00.000Z", // 28+ days ago
    updated_at: "2025-01-15T10:00:00.000Z"
  }
};
