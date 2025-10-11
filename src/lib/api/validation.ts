// Client-side validation helpers for MindReel Edge Function integration
// Provides validation utilities for requests before sending to edge functions

import type {
  Entry,
  WeeklySummaryRequest,
  ValidationResult,
  WeekRange,
  SupportedLanguage,
} from './types';
import { VALIDATION_RULES, SUPPORTED_LANGUAGES } from './types';

/**
 * Validates a date string in YYYY-MM-DD format
 */
export function isValidDateString(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }

  const date = new Date(dateStr + 'T00:00:00.000Z');
  return !isNaN(date.getTime()) && dateStr === date.toISOString().split('T')[0];
}

/**
 * Checks if a date is a Monday
 */
export function isMonday(dateStr: string): boolean {
  if (!isValidDateString(dateStr)) return false;
  const date = new Date(dateStr + 'T00:00:00.000Z');
  return date.getUTCDay() === 1; // Monday = 1
}

/**
 * Checks if a date is a Sunday
 */
export function isSunday(dateStr: string): boolean {
  if (!isValidDateString(dateStr)) return false;
  const date = new Date(dateStr + 'T00:00:00.000Z');
  return date.getUTCDay() === 0; // Sunday = 0
}

/**
 * Validates that week_start and week_end form a valid Monday-Sunday range
 */
export function validateWeekRange(weekStart: string, weekEnd: string): ValidationResult {
  const errors: string[] = [];

  // Validate date format
  if (!isValidDateString(weekStart)) {
    errors.push('week_start must be in YYYY-MM-DD format');
  }
  if (!isValidDateString(weekEnd)) {
    errors.push('week_end must be in YYYY-MM-DD format');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Check day of week
  if (!isMonday(weekStart)) {
    errors.push('week_start must be a Monday');
  }
  if (!isSunday(weekEnd)) {
    errors.push('week_end must be a Sunday');
  }

  // Check that it's exactly one week
  const startDate = new Date(weekStart + 'T00:00:00.000Z');
  const endDate = new Date(weekEnd + 'T00:00:00.000Z');
  const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff !== 6) {
    errors.push('Week range must be exactly 7 days (Monday to Sunday)');
  }

  // Check if week_start is not too far in the future
  const now = new Date();
  const maxFutureDate = new Date(now.getTime() + VALIDATION_RULES.FUTURE_DATE_LIMIT_DAYS * 24 * 60 * 60 * 1000);

  if (startDate > maxFutureDate) {
    errors.push(`week_start cannot be more than ${VALIDATION_RULES.FUTURE_DATE_LIMIT_DAYS} day(s) in the future`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates an individual entry
 */
export function validateEntry(entry: Entry, index: number, weekStart: string, weekEnd: string): string[] {
  const errors: string[] = [];
  const prefix = `Entry ${index + 1}`;

  // Check required fields
  if (!entry.timestamp || typeof entry.timestamp !== 'string') {
    errors.push(`${prefix}: timestamp is required and must be a string`);
  }
  if (!entry.text || typeof entry.text !== 'string') {
    errors.push(`${prefix}: text is required and must be a string`);
  }

  if (errors.length > 0) return errors;

  // Validate timestamp format
  const entryDate = new Date(entry.timestamp);
  if (isNaN(entryDate.getTime())) {
    errors.push(`${prefix}: invalid timestamp format`);
    return errors;
  }

  // Check if timestamp is within week range
  const weekStartTime = new Date(weekStart + 'T00:00:00.000Z').getTime();
  const weekEndTime = new Date(weekEnd + 'T23:59:59.999Z').getTime();
  const entryTime = entryDate.getTime();

  if (entryTime < weekStartTime || entryTime > weekEndTime) {
    errors.push(`${prefix}: timestamp must be within the specified week range`);
  }

  // Check text length
  if (entry.text.length > VALIDATION_RULES.MAX_ENTRY_TEXT_LENGTH) {
    errors.push(`${prefix}: text too long (max ${VALIDATION_RULES.MAX_ENTRY_TEXT_LENGTH} characters)`);
  }

  // Check for empty text after trimming
  if (entry.text.trim().length === 0) {
    errors.push(`${prefix}: text cannot be empty`);
  }

  return errors;
}

/**
 * Validates an array of entries
 */
export function validateEntries(entries: Entry[], weekStart: string, weekEnd: string): ValidationResult {
  const errors: string[] = [];

  // Check if entries array exists and is not empty
  if (!Array.isArray(entries)) {
    errors.push('entries must be an array');
    return { valid: false, errors };
  }

  if (entries.length === 0) {
    errors.push('entries array cannot be empty');
    return { valid: false, errors };
  }

  // Check entries count limit
  if (entries.length > VALIDATION_RULES.MAX_ENTRIES) {
    errors.push(`Too many entries (max ${VALIDATION_RULES.MAX_ENTRIES})`);
  }

  // Validate each entry
  for (let i = 0; i < entries.length; i++) {
    const entryErrors = validateEntry(entries[i], i, weekStart, weekEnd);
    errors.push(...entryErrors);
  }

  // Check total text length
  const totalTextLength = entries.reduce((sum, entry) => sum + (entry.text?.length || 0), 0);
  if (totalTextLength > VALIDATION_RULES.MAX_TOTAL_TEXT_LENGTH) {
    errors.push(`Total text content too large (max ${VALIDATION_RULES.MAX_TOTAL_TEXT_LENGTH} characters)`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates language parameter
 */
export function validateLanguage(language?: string): ValidationResult {
  const errors: string[] = [];

  if (language !== undefined) {
    if (typeof language !== 'string') {
      errors.push('language must be a string');
    } else if (!SUPPORTED_LANGUAGES.includes(language as SupportedLanguage)) {
      errors.push(`language must be one of: ${SUPPORTED_LANGUAGES.join(', ')}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates the complete weekly summary request
 */
export function validateWeeklySummaryRequest(request: WeeklySummaryRequest): ValidationResult {
  const errors: string[] = [];

  // Validate required fields
  if (!request.week_start || typeof request.week_start !== 'string') {
    errors.push('week_start is required and must be a string');
  }
  if (!request.week_end || typeof request.week_end !== 'string') {
    errors.push('week_end is required and must be a string');
  }
  if (!request.entries) {
    errors.push('entries is required');
  }

  // If basic validation fails, return early
  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Validate week range
  const weekRangeValidation = validateWeekRange(request.week_start, request.week_end);
  errors.push(...weekRangeValidation.errors);

  // Validate entries
  const entriesValidation = validateEntries(request.entries, request.week_start, request.week_end);
  errors.push(...entriesValidation.errors);

  // Validate language
  const languageValidation = validateLanguage(request.language);
  errors.push(...languageValidation.errors);

  return { valid: errors.length === 0, errors };
}

/**
 * Creates a week range object for the given Monday date
 */
export function createWeekRange(mondayDate: Date): WeekRange {
  const start = new Date(mondayDate);
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6); // Sunday
  end.setUTCHours(23, 59, 59, 999);

  return {
    start,
    end,
    startString: start.toISOString().split('T')[0],
    endString: end.toISOString().split('T')[0]
  };
}

/**
 * Gets the Monday of the week containing the given date
 */
export function getMondayOfWeek(date: Date): Date {
  const monday = new Date(date);
  const dayOfWeek = monday.getUTCDay();
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Handle Sunday (0) and other days
  monday.setUTCDate(monday.getUTCDate() - daysToSubtract);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

/**
 * Gets the week range for the week containing the given date
 */
export function getWeekRangeForDate(date: Date): WeekRange {
  const monday = getMondayOfWeek(date);
  return createWeekRange(monday);
}

/**
 * Gets the current week range
 */
export function getCurrentWeekRange(): WeekRange {
  return getWeekRangeForDate(new Date());
}

/**
 * Gets the previous week range
 */
export function getPreviousWeekRange(): WeekRange {
  const lastWeek = new Date();
  lastWeek.setUTCDate(lastWeek.getUTCDate() - 7);
  return getWeekRangeForDate(lastWeek);
}

/**
 * Sanitizes entry text by trimming and removing excessive whitespace
 */
export function sanitizeEntryText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .replace(/\n{3,}/g, '\n\n'); // Limit consecutive newlines to 2
}

/**
 * Sanitizes entries array by cleaning text and removing duplicates
 */
export function sanitizeEntries(entries: Entry[]): Entry[] {
  return entries
    .map(entry => ({
      ...entry,
      text: sanitizeEntryText(entry.text)
    }))
    .filter(entry => entry.text.length > 0) // Remove empty entries
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()); // Sort chronologically
}

/**
 * Pre-processes a request by sanitizing and validating it
 */
export function preprocessRequest(request: WeeklySummaryRequest): {
  request: WeeklySummaryRequest;
  validation: ValidationResult;
} {
  const sanitizedRequest: WeeklySummaryRequest = {
    ...request,
    entries: sanitizeEntries(request.entries)
  };

  const validation = validateWeeklySummaryRequest(sanitizedRequest);

  return {
    request: sanitizedRequest,
    validation
  };
}
