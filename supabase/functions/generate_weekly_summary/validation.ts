// Validation functions for the weekly summary edge function

import type { Entry } from "../_shared/types.ts";

// Constants
const MAX_ENTRIES = 1000; // Prevent abuse
const MAX_ENTRY_LENGTH = 10000; // Per entry character limit

/**
 * Validates the week range (Monday to Sunday) and ensures it's not too far in the future
 */
export function validateWeekRange(
  weekStart: string,
  weekEnd: string,
  serverNow: Date,
): string | null {
  // Parse dates as UTC
  const startDate = new Date(weekStart + "T00:00:00.000Z");
  const endDate = new Date(weekEnd + "T23:59:59.999Z");

  // Check if dates are valid
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return "Invalid date format. Use YYYY-MM-DD";
  }

  // Check if week_start is Monday (1) and week_end is Sunday (0)
  if (startDate.getUTCDay() !== 1) {
    return "week_start must be a Monday";
  }
  if (endDate.getUTCDay() !== 0) {
    return "week_end must be a Sunday";
  }

  // Check if the range is exactly 6 days (Monday to Sunday)
  const daysDiff = Math.floor(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (daysDiff !== 6) {
    return "Week range must be exactly 7 days (Monday to Sunday)";
  }

  // Check if week_start is not more than 1 day in the future
  const oneDayFromNow = new Date(serverNow.getTime() + 24 * 60 * 60 * 1000);
  if (startDate > oneDayFromNow) {
    return "week_start cannot be more than 1 day in the future";
  }

  return null; // Valid
}

/**
 * Validates the entries array including content, timestamps, and size limits
 */
export function validateEntries(
  entries: Entry[],
  weekStart: string,
  weekEnd: string,
): string | null {
  if (!Array.isArray(entries) || entries.length === 0) {
    return "entries array cannot be empty";
  }

  if (entries.length > MAX_ENTRIES) {
    return `Too many entries. Maximum allowed: ${MAX_ENTRIES}`;
  }

  const weekStartTime = new Date(weekStart + "T00:00:00.000Z").getTime();
  const weekEndTime = new Date(weekEnd + "T23:59:59.999Z").getTime();

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    // Check required fields
    if (!entry.timestamp || typeof entry.timestamp !== "string") {
      return `Entry ${i + 1}: timestamp is required and must be a string`;
    }
    if (!entry.text || typeof entry.text !== "string") {
      return `Entry ${i + 1}: text is required and must be a string`;
    }

    // Check text length
    if (entry.text.length > MAX_ENTRY_LENGTH) {
      return `Entry ${i + 1}: text too long. Maximum ${MAX_ENTRY_LENGTH} characters`;
    }

    // Validate timestamp format and range
    const entryTime = new Date(entry.timestamp);
    if (isNaN(entryTime.getTime())) {
      return `Entry ${i + 1}: invalid timestamp format`;
    }

    const entryTimeMs = entryTime.getTime();
    if (entryTimeMs < weekStartTime || entryTimeMs > weekEndTime) {
      return `Entry ${i + 1}: timestamp outside week range`;
    }
  }

  // Check total payload size (rough estimate)
  const totalChars = entries.reduce((sum, entry) => sum + entry.text.length, 0);
  if (totalChars > 50000) {
    // Conservative limit for all entries combined
    return "Total content too large. Please reduce entry text or count";
  }

  return null; // Valid
}

/**
 * Validates the language parameter
 */
export function validateLanguage(language?: string): string | null {
  if (language && !["pl", "en"].includes(language)) {
    return 'language must be either "pl" or "en"';
  }
  return null;
}
