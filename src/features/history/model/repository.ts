import {
  WeekKey,
  IsoWeekIdentifier,
  RawWeekData,
  LoadWeeksResult,
  PAGE_WEEK_COUNT,
} from "./types";
import {
  makeWeekKey,
  getWeekRange,
  getPreviousIsoWeek,
  getCurrentWeekRange,
} from "../../../sqlite/dateUtils";
import type { Entry, Summary } from "../../../sqlite/types";

/**
 * Repository for history feature ISO week operations
 * Handles loading entries and summaries by ISO week with pagination
 */
export class HistoryRepository {
  /**
   * Load weeks for history view with pagination
   * @param startingFrom Optional starting week identifier for pagination
   * @param count Number of weeks to load (defaults to PAGE_WEEK_COUNT)
   * @returns Promise<LoadWeeksResult>
   */
  async loadWeeks(
    startingFrom?: IsoWeekIdentifier,
    count: number = PAGE_WEEK_COUNT,
  ): Promise<LoadWeeksResult> {
    try {
      // Determine starting point
      let currentWeek = startingFrom;
      if (!currentWeek) {
        // Start from current week
        const current = getCurrentWeekRange();
        currentWeek = {
          iso_year: current.iso_year,
          week_of_year: current.week_of_year,
        };
      }

      const rawWeeks: RawWeekData[] = [];
      let weekToLoad = currentWeek;

      // Load the requested number of weeks
      for (let i = 0; i < count; i++) {
        const weekData = await this.loadSingleWeek(weekToLoad);
        if (weekData) {
          rawWeeks.push(weekData);
        }

        // Move to previous week for next iteration
        weekToLoad = getPreviousIsoWeek(weekToLoad);
      }

      // Check if there are more weeks available
      // We do this by trying to load one more week
      const hasMore = await this.hasEntriesInWeek(weekToLoad);

      return {
        rawWeeks,
        hasMore,
      };
    } catch (error) {
      console.error("Error loading weeks for history:", error);
      throw error;
    }
  }

  /**
   * Load a single week's data (entries and summary)
   * @param week ISO week identifier
   * @returns Promise<RawWeekData | null>
   */
  private async loadSingleWeek(
    week: IsoWeekIdentifier,
  ): Promise<RawWeekData | null> {
    try {
      const weekKey = makeWeekKey(week.iso_year, week.week_of_year);
      const { start_date, end_date } = getWeekRange(
        week.week_of_year,
        week.iso_year,
      );

      // Load entries and summary in parallel
      const [entries, summary] = await Promise.all([
        window.appApi.db.getEntriesForIsoWeek(week.iso_year, week.week_of_year),
        window.appApi.db.getSummaryForIsoWeek(week.iso_year, week.week_of_year),
      ]);

      return {
        iso_year: week.iso_year,
        week_of_year: week.week_of_year,
        weekKey,
        start_date,
        end_date,
        entries: entries || [],
        summary: summary || undefined,
      };
    } catch (error) {
      console.error(
        `Error loading week ${week.iso_year}-W${week.week_of_year}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Check if a week has any entries
   * @param week ISO week identifier
   * @returns Promise<boolean>
   */
  private async hasEntriesInWeek(week: IsoWeekIdentifier): Promise<boolean> {
    try {
      const entries = await window.appApi.db.getEntriesForIsoWeek(
        week.iso_year,
        week.week_of_year,
      );
      return entries && entries.length > 0;
    } catch (error) {
      console.error("Error checking entries in week:", error);
      return false;
    }
  }

  /**
   * Get all ISO weeks that have entries for initial load optimization
   * @returns Promise<IsoWeekIdentifier[]>
   */
  async getWeeksWithEntries(): Promise<IsoWeekIdentifier[]> {
    try {
      return await window.appApi.db.getIsoWeeksWithEntries();
    } catch (error) {
      console.error("Error getting weeks with entries:", error);
      return [];
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
   * Check if summary exists for a specific ISO week
   * @param week ISO week identifier
   * @returns Promise<boolean>
   */
  async summaryExistsForWeek(week: IsoWeekIdentifier): Promise<boolean> {
    try {
      return await window.appApi.db.summaryExistsForIsoWeek(
        week.iso_year,
        week.week_of_year,
      );
    } catch (error) {
      console.error("Error checking summary existence:", error);
      return false;
    }
  }
}

// Singleton instance
export const historyRepository = new HistoryRepository();
