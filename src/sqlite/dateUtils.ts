/**
 * Date utility functions for handling week calculations and date formatting
 * Used for the MindReel SQLite database operations
 */

import { getISOWeek, getISOWeekYear } from "date-fns";

// Types for ISO week handling
export type WeekKey = `${number}-W${string}`;

export interface IsoWeekIdentifier {
  iso_year: number;
  week_of_year: number;
}

/**
 * Get the ISO week number for a given date
 * @param date Date object or ISO string
 * @returns ISO week number (1-53)
 */
export function getISOWeekNumber(date: Date | string): number {
  const d = new Date(date);
  return getISOWeek(d);
}

/**
 * Get the ISO year for a given date
 * @param date Date object or ISO string
 * @returns ISO year
 */
export function getISOYear(date: Date | string): number {
  const d = new Date(date);
  return getISOWeekYear(d);
}

/**
 * Create a week key from ISO year and week number
 * @param iso_year ISO year
 * @param week_of_year ISO week number
 * @returns WeekKey string like "2025-W01"
 */
export function makeWeekKey(iso_year: number, week_of_year: number): WeekKey {
  return `${iso_year}-W${week_of_year.toString().padStart(2, "0")}`;
}

/**
 * Parse a week key into ISO year and week number
 * @param weekKey WeekKey string like "2025-W01"
 * @returns IsoWeekIdentifier
 */
export function parseWeekKey(weekKey: WeekKey): IsoWeekIdentifier {
  const match = weekKey.match(/^(\d{4})-W(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid week key format: ${weekKey}`);
  }
  return {
    iso_year: parseInt(match[1], 10),
    week_of_year: parseInt(match[2], 10),
  };
}

/**
 * Get ISO week identifier for a given date
 * @param date Date object or ISO string
 * @returns IsoWeekIdentifier
 */
export function getIsoWeekIdentifier(date: Date | string): IsoWeekIdentifier {
  const d = new Date(date);
  return {
    iso_year: getISOWeekYear(d),
    week_of_year: getISOWeek(d),
  };
}

/**
 * Get the start and end dates for a given ISO week
 * @param weekNumber ISO week number (1-53)
 * @param year ISO year
 * @returns Object with start_date (Monday) and end_date (Sunday) in ISO format
 */
export function getWeekRange(
  weekNumber: number,
  year: number,
): { start_date: string; end_date: string } {
  // January 4th is always in week 1
  const jan4 = new Date(Date.UTC(year, 0, 4));

  // Find the Monday of week 1
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() + 6) % 7));

  // Calculate the Monday of the target week
  const targetMonday = new Date(week1Monday);
  targetMonday.setUTCDate(week1Monday.getUTCDate() + (weekNumber - 1) * 7);

  // Calculate the Sunday of the target week
  const targetSunday = new Date(targetMonday);
  targetSunday.setUTCDate(targetMonday.getUTCDate() + 6);

  return {
    start_date: targetMonday.toISOString().split("T")[0],
    end_date: targetSunday.toISOString().split("T")[0],
  };
}

/**
 * Get the current week range with ISO year
 * @returns Object with start_date, end_date, week_of_year, and iso_year
 */
export function getCurrentWeekRange(): {
  start_date: string;
  end_date: string;
  week_of_year: number;
  iso_year: number;
} {
  const now = new Date();
  const weekNumber = getISOWeekNumber(now);
  const isoYear = getISOYear(now);
  const { start_date, end_date } = getWeekRange(weekNumber, isoYear);

  return {
    start_date,
    end_date,
    week_of_year: weekNumber,
    iso_year: isoYear,
  };
}

/**
 * Format a date to YYYY-MM-DD format
 * @param date Date object or ISO string
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}

/**
 * Get the week range for a specific date with ISO year
 * @param date Date object or ISO string
 * @returns Object with start_date, end_date, week_of_year, and iso_year
 */
export function getWeekRangeForDate(date: Date | string): {
  start_date: string;
  end_date: string;
  week_of_year: number;
  iso_year: number;
} {
  const d = new Date(date);
  const weekNumber = getISOWeekNumber(d);
  const isoYear = getISOYear(d);
  const { start_date, end_date } = getWeekRange(weekNumber, isoYear);

  return {
    start_date,
    end_date,
    week_of_year: weekNumber,
    iso_year: isoYear,
  };
}

/**
 * Get the previous ISO week identifier
 * @param current Current ISO week identifier
 * @returns Previous ISO week identifier
 */
export function getPreviousIsoWeek(
  current: IsoWeekIdentifier,
): IsoWeekIdentifier {
  if (current.week_of_year > 1) {
    return {
      iso_year: current.iso_year,
      week_of_year: current.week_of_year - 1,
    };
  } else {
    // Go to last week of previous ISO year
    const prevYear = current.iso_year - 1;
    const lastWeekOfPrevYear = getWeeksInISOYear(prevYear);
    return {
      iso_year: prevYear,
      week_of_year: lastWeekOfPrevYear,
    };
  }
}

/**
 * Get the next ISO week identifier
 * @param current Current ISO week identifier
 * @returns Next ISO week identifier
 */
export function getNextIsoWeek(current: IsoWeekIdentifier): IsoWeekIdentifier {
  const maxWeeks = getWeeksInISOYear(current.iso_year);

  if (current.week_of_year < maxWeeks) {
    return {
      iso_year: current.iso_year,
      week_of_year: current.week_of_year + 1,
    };
  } else {
    // Move to first week of next ISO year
    return {
      iso_year: current.iso_year + 1,
      week_of_year: 1,
    };
  }
}

/**
 * Get the number of weeks in an ISO year
 * @param isoYear ISO year
 * @returns Number of weeks (52 or 53)
 */
export function getWeeksInISOYear(isoYear: number): number {
  // January 4th is always in week 1
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  // December 28th is always in the last week
  const dec28 = new Date(Date.UTC(isoYear, 11, 28));
  return getISOWeek(dec28);
}
