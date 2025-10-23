import { format, parseISO } from "date-fns";
import {
  WeekKey,
  IsoWeekIdentifier,
  EntryViewModel,
  DuplicateGroupViewModel,
  DayGroupViewModel,
  WeekGroupViewModel,
  SummaryViewModel,
  RawWeekData,
  DuplicateDetectionResult,
  SummaryCardState,
} from "./types";
import { makeWeekKey, getWeekRange, parseWeekKey } from "../../../sqlite/dateUtils";
import type { Entry, Summary } from "../../../sqlite/types";

/**
 * Transform raw week data into WeekGroupViewModel
 * Handles grouping by day and duplicate detection
 */
export function transformWeekData(rawWeek: RawWeekData): WeekGroupViewModel {
  const weekKey = makeWeekKey(rawWeek.iso_year, rawWeek.week_of_year);

  // Group entries by date
  const entriesByDate = groupEntriesByDate(rawWeek.entries, weekKey);

  // Transform each day group
  const days = Object.entries(entriesByDate)
    .map(([date, entries]) => transformDayGroup(date, entries, weekKey))
    .sort((a, b) => b.date.localeCompare(a.date)); // Newest day first (Sunday -> Monday)

  // Calculate total entries across all days
  const totalEntries = days.reduce((sum, day) => sum + day.totalEntries, 0);

  // Transform summary if exists
  const summaryViewModel = rawWeek.summary ? transformSummary(rawWeek.summary, weekKey) : undefined;

  // Determine summary state
  const summaryState = determineSummaryState(summaryViewModel, totalEntries);

  // Create week header label
  const headerLabel = createWeekHeaderLabel(rawWeek);

  return {
    iso_year: rawWeek.iso_year,
    week_of_year: rawWeek.week_of_year,
    weekKey,
    start_date: rawWeek.start_date,
    end_date: rawWeek.end_date,
    headerLabel,
    days,
    summary: summaryViewModel,
    summaryState,
    collapsed: false, // Default to expanded
    totalEntries,
    orderIndex: 0, // Will be set by caller based on sort order
  };
}

/**
 * Group entries by date and transform to EntryViewModel
 */
function groupEntriesByDate(entries: Entry[], weekKey: WeekKey): Record<string, EntryViewModel[]> {
  const grouped: Record<string, EntryViewModel[]> = {};

  entries.forEach((entry) => {
    const date = entry.date;
    if (!grouped[date]) {
      grouped[date] = [];
    }

    grouped[date].push(transformEntry(entry, weekKey));
  });

  return grouped;
}

/**
 * Transform Entry to EntryViewModel
 */
function transformEntry(entry: Entry, weekKey: WeekKey): EntryViewModel {
  return {
    ...entry,
    isEditing: false,
    isSaving: false,
    dayKey: entry.date,
    // duplicateGroupId will be set by duplicate detection
  };
}

/**
 * Transform day group with duplicate detection
 */
function transformDayGroup(
  date: string,
  entries: EntryViewModel[],
  weekKey: WeekKey,
): DayGroupViewModel {
  // Detect and group duplicates
  // Detect duplicates (returns items oldest -> newest). Reverse for newest-first display.
  let { items } = detectDuplicates(entries, weekKey);
  items = items.slice().reverse();

  // Create weekday and header labels
  const weekdayLabel = format(parseISO(date), "EEEE"); // e.g., "Monday"
  const headerLabel = format(parseISO(date), "EEEE, MMM d"); // e.g., "Monday, Jan 15"

  // Count total entries (including those in duplicate groups)
  const totalEntries = items.reduce((sum, item) => {
    return sum + (isDuplicateGroup(item) ? item.count : 1);
  }, 0);

  return {
    date,
    weekdayLabel,
    headerLabel,
    items,
    totalEntries,
    weekKey,
  };
}

/**
 * Detect consecutive duplicate entries and group them
 * Based on the algorithm from the implementation plan
 */
function detectDuplicates(entries: EntryViewModel[], weekKey: WeekKey): DuplicateDetectionResult {
  const items: (EntryViewModel | DuplicateGroupViewModel)[] = [];

  // Sort entries by creation time
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  let i = 0;
  while (i < sortedEntries.length) {
    const currentEntry = sortedEntries[i];
    const duplicates = [currentEntry];

    // Find consecutive entries with same content (trimmed and normalized)
    const normalizedContent = normalizeContent(currentEntry.content);
    let j = i + 1;

    while (j < sortedEntries.length) {
      const nextEntry = sortedEntries[j];
      const nextNormalizedContent = normalizeContent(nextEntry.content);

      if (normalizedContent === nextNormalizedContent) {
        duplicates.push(nextEntry);
        j++;
      } else {
        break;
      }
    }

    if (duplicates.length > 1) {
      // Create duplicate group
      const firstEntry = duplicates[0];
      const groupId = `dup:${weekKey}:${firstEntry.id}`;

      // Mark all entries as part of this duplicate group
      duplicates.forEach((entry) => {
        entry.duplicateGroupId = groupId;
      });

      const duplicateGroup: DuplicateGroupViewModel = {
        id: groupId,
        weekKey,
        content: firstEntry.content,
        count: duplicates.length,
        entryIds: duplicates.map((e) => e.id!).filter(Boolean),
        firstEntry,
        expanded: false, // Default to collapsed
      };

      items.push(duplicateGroup);
    } else {
      // Single entry
      items.push(currentEntry);
    }

    i = j;
  }

  return { items };
}

/**
 * Normalize entry content for duplicate detection
 */
function normalizeContent(content: string): string {
  return content.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Transform Summary to SummaryViewModel
 */
function transformSummary(summary: Summary, weekKey: WeekKey): SummaryViewModel {
  return {
    ...summary,
    isEditing: false,
    isSaving: false,
    state: "success", // Summary exists so it's successful
    weekKey,
  };
}

/**
 * Determine summary state based on various conditions
 */
function determineSummaryState(
  summary: SummaryViewModel | undefined,
  totalEntries: number,
): SummaryCardState {
  if (summary) {
    return "success";
  }

  if (totalEntries === 0) {
    return "pending"; // No entries to summarize yet
  }

  // TODO: Add authentication and quota checks
  // For now, assume we can generate summaries
  return "pending";
}

/**
 * Create week header label
 */
function createWeekHeaderLabel(rawWeek: RawWeekData): string {
  const startDate = parseISO(rawWeek.start_date);
  const endDate = parseISO(rawWeek.end_date);

  const startFormat = format(startDate, "MMM d");
  const endFormat = format(endDate, "MMM d, yyyy");

  // Handle year boundary
  if (startDate.getFullYear() !== endDate.getFullYear()) {
    return `${format(startDate, "MMM d, yyyy")} - ${endFormat} (Week ${rawWeek.week_of_year})`;
  }

  // Handle month boundary
  if (startDate.getMonth() !== endDate.getMonth()) {
    return `${startFormat} - ${endFormat} (Week ${rawWeek.week_of_year})`;
  }

  // Same month
  return `${startFormat} - ${format(endDate, "d, yyyy")} (Week ${rawWeek.week_of_year})`;
}

/**
 * Type guard to check if item is a duplicate group
 */
export function isDuplicateGroup(
  item: EntryViewModel | DuplicateGroupViewModel,
): item is DuplicateGroupViewModel {
  return "count" in item && "entryIds" in item;
}

/**
 * Type guard to check if item is an entry
 */
export function isEntry(item: EntryViewModel | DuplicateGroupViewModel): item is EntryViewModel {
  return !isDuplicateGroup(item);
}

/**
 * Get all entries from a day group (including those in duplicate groups)
 */
export function getAllEntriesFromDay(day: DayGroupViewModel): EntryViewModel[] {
  const allEntries: EntryViewModel[] = [];

  day.items.forEach((item) => {
    if (isEntry(item)) {
      allEntries.push(item);
    } else {
      // For duplicate groups, we only have access to the first entry in the UI
      // The actual entries would need to be fetched separately if needed
      allEntries.push(item.firstEntry);
    }
  });

  return allEntries;
}

/**
 * Calculate total entries for a week (including duplicates)
 */
export function calculateWeekTotalEntries(week: WeekGroupViewModel): number {
  return week.days.reduce((sum, day) => sum + day.totalEntries, 0);
}

/**
 * Sort weeks by ISO year and week number (descending - newest first)
 */
export function sortWeeksDescending(weeks: WeekGroupViewModel[]): WeekGroupViewModel[] {
  return weeks
    .sort((a, b) => {
      if (a.iso_year !== b.iso_year) {
        return b.iso_year - a.iso_year; // Newer year first
      }
      return b.week_of_year - a.week_of_year; // Higher week number first
    })
    .map((week, index) => ({
      ...week,
      orderIndex: index,
    }));
}

/**
 * Filter weeks to only show those with entries or summaries
 */
export function filterWeeksWithContent(weeks: WeekGroupViewModel[]): WeekGroupViewModel[] {
  return weeks.filter((week) => week.totalEntries > 0 || week.summary);
}
