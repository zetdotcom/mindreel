import { useCallback, useState } from "react";
import {
  getCurrentWeekRange,
  getNextIsoWeek,
  getPreviousIsoWeek,
  getWeekRange,
  getWeekRangeForDate,
  getWeeksInISOYear,
  makeWeekKey,
  parseWeekKey,
} from "../../../sqlite/dateUtils";
import type { IsoWeekIdentifier, WeekKey } from "./types";

/**
 * Hook for ISO week navigation utilities
 * Provides functions for navigating between weeks safely across year boundaries
 */
export function useIsoWeekNavigation() {
  /**
   * Get the current ISO week identifier
   */
  const getCurrentWeek = useCallback((): IsoWeekIdentifier => {
    const current = getCurrentWeekRange();
    return {
      iso_year: current.iso_year,
      week_of_year: current.week_of_year,
    };
  }, []);

  /**
   * Get the previous ISO week
   */
  const getPreviousWeek = useCallback((week: IsoWeekIdentifier): IsoWeekIdentifier => {
    return getPreviousIsoWeek(week);
  }, []);

  /**
   * Get the next ISO week
   */
  const getNextWeek = useCallback((week: IsoWeekIdentifier): IsoWeekIdentifier => {
    if (week.week_of_year < getWeeksInISOYear(week.iso_year)) {
      return {
        iso_year: week.iso_year,
        week_of_year: week.week_of_year + 1,
      };
    } else {
      // Move to first week of next ISO year
      return {
        iso_year: week.iso_year + 1,
        week_of_year: 1,
      };
    }
  }, []);

  /**
   * Get week range for a given ISO week
   */
  const getWeekDates = useCallback((week: IsoWeekIdentifier) => {
    return getWeekRange(week, week.iso_year);
  }, []);

  /**
   * Create a week key from ISO week identifier
   */
  const createWeekKey = useCallback((week: IsoWeekIdentifier): WeekKey => {
    return makeWeekKey(week.iso_year, week.week_of_year);
  }, []);

  /**
   * Parse a week key into ISO week identifier
   */
  const parseWeekKeyToIdentifier = useCallback((weekKey: WeekKey): IsoWeekIdentifier => {
    return parseWeekKey(weekKey);
  }, []);

  /**
   * Check if two ISO weeks are equal
   */
  const areWeeksEqual = useCallback(
    (week1: IsoWeekIdentifier, week2: IsoWeekIdentifier): boolean => {
      return week1.iso_year === week2.iso_year && week1.week_of_year === week2.week_of_year;
    },
    [],
  );

  /**
   * Compare two ISO weeks (-1 if week1 < week2, 0 if equal, 1 if week1 > week2)
   */
  const compareWeeks = useCallback((week1: IsoWeekIdentifier, week2: IsoWeekIdentifier): number => {
    if (week1.iso_year !== week2.iso_year) {
      return week1.iso_year - week2.iso_year;
    }
    return week1.week_of_year - week2.week_of_year;
  }, []);

  /**
   * Check if a week is the current week
   */
  const isCurrentWeek = useCallback(
    (week: IsoWeekIdentifier): boolean => {
      const current = getCurrentWeek();
      return areWeeksEqual(week, current);
    },
    [getCurrentWeek, areWeeksEqual],
  );

  /**
   * Get a range of weeks (useful for pagination)
   */
  const getWeekRange = useCallback(
    (
      startWeek: IsoWeekIdentifier,
      count: number,
      direction: "forward" | "backward" = "backward",
    ): IsoWeekIdentifier[] => {
      const weeks: IsoWeekIdentifier[] = [];
      let currentWeek = startWeek;

      for (let i = 0; i < count; i++) {
        weeks.push({ ...currentWeek });

        if (direction === "backward") {
          currentWeek = getPreviousWeek(currentWeek);
        } else {
          currentWeek = getNextWeek(currentWeek);
        }
      }

      return weeks;
    },
    [getPreviousWeek, getNextWeek],
  );

  /**
   * Get weeks between two ISO weeks (inclusive)
   */
  const getWeeksBetween = useCallback(
    (startWeek: IsoWeekIdentifier, endWeek: IsoWeekIdentifier): IsoWeekIdentifier[] => {
      const weeks: IsoWeekIdentifier[] = [];
      let currentWeek = startWeek;

      // Ensure startWeek is before or equal to endWeek
      if (compareWeeks(startWeek, endWeek) > 0) {
        return weeks;
      }

      while (compareWeeks(currentWeek, endWeek) <= 0) {
        weeks.push({ ...currentWeek });

        if (areWeeksEqual(currentWeek, endWeek)) {
          break;
        }

        currentWeek = getNextWeek(currentWeek);

        // Safety check to prevent infinite loops
        if (weeks.length > 105) {
          // ~2 years worth of weeks
          console.warn("getWeeksBetween: Too many weeks, breaking to prevent infinite loop");
          break;
        }
      }

      return weeks;
    },
    [compareWeeks, areWeeksEqual, getNextWeek],
  );

  /**
   * Format ISO week for display
   */
  const formatWeekDisplay = useCallback(
    (week: IsoWeekIdentifier, showYear = true): string => {
      const current = getCurrentWeek();
      const weekStr = `Week ${week.week_of_year}`;

      if (!showYear || week.iso_year === current.iso_year) {
        return weekStr;
      }

      return `${weekStr}, ${week.iso_year}`;
    },
    [getCurrentWeek],
  );

  /**
   * Get the week identifier for a specific date
   */
  const getWeekForDate = useCallback((date: Date | string): IsoWeekIdentifier => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    // const weekRange = getCurrentWeekRange(); // This will compute for the given date
    // Note: We need to adjust this to work with any date, not just current
    const { week_of_year, iso_year } = getWeekRangeForDate(dateObj.toISOString().split("T")[0]);

    return {
      iso_year,
      week_of_year,
    };
  }, []);

  return {
    getCurrentWeek,
    getPreviousWeek,
    getNextWeek,
    getWeekDates,
    createWeekKey,
    parseWeekKeyToIdentifier,
    areWeeksEqual,
    compareWeeks,
    isCurrentWeek,
    getWeekRange,
    getWeeksBetween,
    formatWeekDisplay,
    getWeekForDate,
  };
}
