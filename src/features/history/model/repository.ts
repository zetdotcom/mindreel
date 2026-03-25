import {
  buildHistoryPeriods,
  formatDateOnly,
  getHistoryGroupKey,
  type HistoryPeriodDescriptor,
} from "../../../lib/historyGrouping";
import { getWeekRange } from "../../../sqlite/dateUtils";
import type { Entry, Summary } from "../../../sqlite/types";
import { type LoadWeeksResult, PAGE_WEEK_COUNT, type RawWeekData } from "./types";

function sortPeriodsDescending<T extends { end_date: string; start_date: string }>(
  periods: T[],
): T[] {
  return [...periods].sort((left, right) => {
    if (left.end_date !== right.end_date) {
      return right.end_date.localeCompare(left.end_date);
    }

    return right.start_date.localeCompare(left.start_date);
  });
}

export class HistoryRepository {
  /**
   * Load history groups for the current effective-dated grouping rules.
   * Pagination is offset-based because groups can change length over time.
   */
  async loadWeeks(offset = 0, count: number = PAGE_WEEK_COUNT): Promise<LoadWeeksResult> {
    try {
      const [rules, datesWithEntries, summaries] = await Promise.all([
        window.appApi.db.getHistoryGroupingRules(),
        window.appApi.db.getDatesWithEntries(),
        window.appApi.db.getAllSummaries(),
      ]);

      const summaryMap = this.createSummaryMap(summaries);
      const allRelevantDates = [
        ...datesWithEntries,
        ...summaries.map((summary) => summary.start_date),
      ].sort();

      if (allRelevantDates.length === 0) {
        return {
          rawWeeks: [],
          hasMore: false,
        };
      }

      const earliestDate = allRelevantDates[0];
      const latestDate = formatDateOnly(new Date());

      const periods = sortPeriodsDescending(
        buildHistoryPeriods(rules, earliestDate, latestDate),
      ).filter((period) => {
        const periodKey = getHistoryGroupKey(period.start_date, period.end_date);
        const hasEntries = datesWithEntries.some(
          (date) => date >= period.start_date && date <= period.end_date,
        );

        return hasEntries || summaryMap.has(periodKey);
      });

      const selectedPeriods = periods.slice(offset, offset + count);
      const rawWeeks = await Promise.all(
        selectedPeriods.map((period) => this.loadSingleGroup(period, summaryMap)),
      );

      return {
        rawWeeks,
        hasMore: offset + count < periods.length,
      };
    } catch (error) {
      console.error("Error loading history groups:", error);
      throw error;
    }
  }

  /**
   * Create a new entry
   * @param content Entry content
   * @returns Promise<Entry>
   */
  async createEntry(content: string): Promise<Entry> {
    try {
      return await window.appApi.db.createEntry({ content });
    } catch (error) {
      console.error("Error creating entry:", error);
      throw error;
    }
  }

  /**
   * Update an existing entry
   * @param id Entry ID
   * @param content New content
   * @returns Promise<Entry | null>
   */
  async updateEntry(id: number, content: string): Promise<Entry | null> {
    try {
      return await window.appApi.db.updateEntry(id, content);
    } catch (error) {
      console.error("Error updating entry:", error);
      throw error;
    }
  }

  /**
   * Delete an entry
   * @param id Entry ID
   * @returns Promise<boolean>
   */
  async deleteEntry(id: number): Promise<boolean> {
    try {
      return await window.appApi.db.deleteEntry(id);
    } catch (error) {
      console.error("Error deleting entry:", error);
      throw error;
    }
  }

  /**
   * Update a summary
   * @param id Summary ID
   * @param content New content
   * @returns Promise<Summary | null>
   */
  async updateSummary(id: number, content: string): Promise<Summary | null> {
    try {
      return await window.appApi.db.updateSummary(id, content);
    } catch (error) {
      console.error("Error updating summary:", error);
      throw error;
    }
  }

  /**
   * Check if summary exists for an exact period.
   */
  async summaryExistsForRange(startDate: string, endDate: string): Promise<boolean> {
    try {
      return await window.appApi.db.summaryExistsForDateRange(startDate, endDate);
    } catch (error) {
      console.error("Error checking summary existence:", error);
      return false;
    }
  }

  /**
   * Legacy week-based existence check used by older summary hooks.
   */
  async summaryExistsForWeek(week: { iso_year: number; week_of_year: number }): Promise<boolean> {
    const { start_date, end_date } = getWeekRange(week.week_of_year, week.iso_year);
    return this.summaryExistsForRange(start_date, end_date);
  }

  private async loadSingleGroup(
    period: HistoryPeriodDescriptor,
    summaryMap: Map<string, Summary>,
  ): Promise<RawWeekData> {
    const weekKey = getHistoryGroupKey(period.start_date, period.end_date);
    const entries = await window.appApi.db.getEntriesForDateRange(
      period.start_date,
      period.end_date,
    );

    return {
      ...period,
      weekKey,
      entries: entries || [],
      summary: summaryMap.get(weekKey),
    };
  }

  private createSummaryMap(summaries: Summary[]): Map<string, Summary> {
    return summaries.reduce((map, summary) => {
      const key = getHistoryGroupKey(summary.start_date, summary.end_date);
      const existing = map.get(key);

      if (!existing || existing.created_at < summary.created_at) {
        map.set(key, summary);
      }

      return map;
    }, new Map<string, Summary>());
  }
}

// Singleton instance
export const historyRepository = new HistoryRepository();
