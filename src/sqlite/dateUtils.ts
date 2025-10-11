/**
 * Date utility functions for handling week calculations and date formatting
 * Used for the MindReel SQLite database operations
 */

/**
 * Get the ISO week number for a given date
 * @param date Date object or ISO string
 * @returns ISO week number (1-53)
 */
export function getISOWeekNumber(date: Date | string): number {
  const d = new Date(date);

  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));

  // Get first day of year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));

  // Calculate full weeks to nearest Thursday
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );

  return weekNo;
}

/**
 * Get the start and end dates for a given ISO week
 * @param weekNumber ISO week number (1-53)
 * @param year Year
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
 * Get the current week range
 * @returns Object with start_date, end_date, and week_of_year
 */
export function getCurrentWeekRange(): {
  start_date: string;
  end_date: string;
  week_of_year: number;
} {
  const now = new Date();
  const weekNumber = getISOWeekNumber(now);
  const { start_date, end_date } = getWeekRange(weekNumber, now.getFullYear());

  return {
    start_date,
    end_date,
    week_of_year: weekNumber,
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
 * Get the week range for a specific date
 * @param date Date object or ISO string
 * @returns Object with start_date, end_date, and week_of_year
 */
export function getWeekRangeForDate(date: Date | string): {
  start_date: string;
  end_date: string;
  week_of_year: number;
} {
  const d = new Date(date);
  const weekNumber = getISOWeekNumber(d);
  const { start_date, end_date } = getWeekRange(weekNumber, d.getFullYear());

  return {
    start_date,
    end_date,
    week_of_year: weekNumber,
  };
}
