import type {
  HistoryGroupingRule,
  HistoryGroupingSettings,
  UpdateHistoryGroupingInput,
} from "../lib/historyGrouping";
import { type Database, database } from "./database";
import { getCurrentWeekRange, getWeekRangeForDate, type IsoWeekIdentifier } from "./dateUtils";
import { EntriesRepository } from "./repositories/entriesRepository";
import { HistoryGroupingRepository } from "./repositories/historyGroupingRepository";
import { SettingsRepository } from "./repositories/settingsRepository";
import { SummariesRepository } from "./repositories/summariesRepository";
import type {
  CreateEntryInput,
  CreateSummaryInput,
  Entry,
  EntryFilters,
  Settings,
  Summary,
  UpdateSettingsInput,
} from "./types";

export class DatabaseService {
  private db: Database;
  private entriesRepo: EntriesRepository | null = null;
  private historyGroupingRepo: HistoryGroupingRepository | null = null;
  private summariesRepo: SummariesRepository | null = null;
  private settingsRepo: SettingsRepository | null = null;
  private isInitialized = false;

  constructor(customDatabase?: Database) {
    this.db = customDatabase || database;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    await this.db.init();
    const db = this.db.getDatabase();

    this.entriesRepo = new EntriesRepository(db);
    this.historyGroupingRepo = new HistoryGroupingRepository(db);
    this.summariesRepo = new SummariesRepository(db);
    this.settingsRepo = new SettingsRepository(db);

    // Initialize default settings
    await this.settingsRepo.initializeDefaults();
    await this.historyGroupingRepo.initializeDefaults();

    this.isInitialized = true;
    console.log("Database service initialized successfully");
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    await this.db.close();
    this.entriesRepo = null;
    this.historyGroupingRepo = null;
    this.summariesRepo = null;
    this.settingsRepo = null;
    this.isInitialized = false;
  }

  /**
   * Ensure the service is initialized
   */
  private ensureInitialized(): void {
    if (
      !this.isInitialized ||
      !this.entriesRepo ||
      !this.historyGroupingRepo ||
      !this.summariesRepo ||
      !this.settingsRepo
    ) {
      throw new Error("Database service not initialized. Call initialize() first.");
    }
  }

  private getEntriesRepo(): EntriesRepository {
    this.ensureInitialized();
    return this.entriesRepo;
  }

  private getHistoryGroupingRepo(): HistoryGroupingRepository {
    this.ensureInitialized();
    return this.historyGroupingRepo;
  }

  private getSummariesRepo(): SummariesRepository {
    this.ensureInitialized();
    return this.summariesRepo;
  }

  private getSettingsRepo(): SettingsRepository {
    this.ensureInitialized();
    return this.settingsRepo;
  }

  // =============================================================================
  // ENTRIES METHODS
  // =============================================================================

  /**
   * Create a new entry
   */
  async createEntry(input: CreateEntryInput): Promise<Entry> {
    return this.getEntriesRepo().createEntry(input);
  }

  /**
   * Get entry by ID
   */
  async getEntryById(id: number): Promise<Entry | null> {
    return this.getEntriesRepo().getEntryById(id);
  }

  /**
   * Get all entries with optional filters
   */
  async getEntries(filters?: EntryFilters): Promise<Entry[]> {
    return this.getEntriesRepo().getEntries(filters);
  }

  /**
   * Get entries for today
   */
  async getTodayEntries(): Promise<Entry[]> {
    const today = new Date().toISOString().split("T")[0];
    return this.getEntriesRepo().getEntriesForDate(today);
  }

  /**
   * Get entries for current week
   */
  async getCurrentWeekEntries(): Promise<Entry[]> {
    const { week_of_year, iso_year } = getCurrentWeekRange();
    return this.getEntriesRepo().getEntriesForIsoWeek(iso_year, week_of_year);
  }

  /**
   * Get entries for a specific ISO week
   */
  async getEntriesForIsoWeek(iso_year: number, week_of_year: number): Promise<Entry[]> {
    return this.getEntriesRepo().getEntriesForIsoWeek(iso_year, week_of_year);
  }

  /**
   * Get entries for a specific date
   */
  async getEntriesForDate(date: string): Promise<Entry[]> {
    return this.getEntriesRepo().getEntriesForDate(date);
  }

  /**
   * Get entries for a specific week
   */
  async getEntriesForWeek(weekOfYear: number): Promise<Entry[]> {
    return this.getEntriesRepo().getEntriesForWeek(weekOfYear);
  }

  /**
   * Get entries for a date range
   */
  async getEntriesForDateRange(startDate: string, endDate: string): Promise<Entry[]> {
    return this.getEntriesRepo().getEntriesForDateRange(startDate, endDate);
  }

  /**
   * Update entry content
   */
  async updateEntry(id: number, content: string): Promise<Entry | null> {
    return this.getEntriesRepo().updateEntry(id, content);
  }

  /**
   * Delete entry
   */
  async deleteEntry(id: number): Promise<boolean> {
    return this.getEntriesRepo().deleteEntry(id);
  }

  /**
   * Get all dates that have entries
   */
  async getDatesWithEntries(): Promise<string[]> {
    return this.getEntriesRepo().getDatesWithEntries();
  }

  /**
   * Get all weeks that have entries
   */
  async getWeeksWithEntries(): Promise<number[]> {
    return this.getEntriesRepo().getWeeksWithEntries();
  }

  /**
   * Get all ISO weeks that have entries
   */
  async getIsoWeeksWithEntries(): Promise<IsoWeekIdentifier[]> {
    return this.getEntriesRepo().getIsoWeeksWithEntries();
  }

  // =============================================================================
  // SUMMARIES METHODS
  // =============================================================================

  /**
   * Create a new summary
   */
  async createSummary(input: CreateSummaryInput): Promise<Summary> {
    return this.getSummariesRepo().createSummary(input);
  }

  /**
   * Create a summary for the current week using existing entries
   */
  async createCurrentWeekSummary(content: string): Promise<Summary> {
    const { start_date, end_date, week_of_year, iso_year } = getCurrentWeekRange();

    return this.getSummariesRepo().createSummary({
      content,
      start_date,
      end_date,
      week_of_year,
      iso_year,
    });
  }

  /**
   * Get summary by ID
   */
  async getSummaryById(id: number): Promise<Summary | null> {
    return this.getSummariesRepo().getSummaryById(id);
  }

  /**
   * Get summary for a specific week
   */
  async getSummaryByWeek(weekOfYear: number): Promise<Summary | null> {
    return this.getSummariesRepo().getSummaryByWeek(weekOfYear);
  }

  /**
   * Get summary for current week
   */
  async getCurrentWeekSummary(): Promise<Summary | null> {
    const { week_of_year, iso_year } = getCurrentWeekRange();
    return this.getSummariesRepo().getSummaryForIsoWeek(iso_year, week_of_year);
  }

  /**
   * Get summary for a specific ISO week
   */
  async getSummaryForIsoWeek(iso_year: number, week_of_year: number): Promise<Summary | null> {
    return this.getSummariesRepo().getSummaryForIsoWeek(iso_year, week_of_year);
  }

  /**
   * Get summary for an exact date range.
   */
  async getSummaryForDateRange(startDate: string, endDate: string): Promise<Summary | null> {
    return this.getSummariesRepo().getSummaryForDateRange(startDate, endDate);
  }

  /**
   * Get all summaries
   */
  async getAllSummaries(): Promise<Summary[]> {
    return this.getSummariesRepo().getAllSummaries();
  }

  /**
   * Get summaries for a specific year
   */
  async getSummariesByYear(year: number): Promise<Summary[]> {
    return this.getSummariesRepo().getSummariesByYear(year);
  }

  /**
   * Update summary content
   */
  async updateSummary(id: number, content: string): Promise<Summary | null> {
    return this.getSummariesRepo().updateSummary(id, content);
  }

  /**
   * Delete summary
   */
  async deleteSummary(id: number): Promise<boolean> {
    return this.getSummariesRepo().deleteSummary(id);
  }

  /**
   * Check if summary exists for current week
   */
  async currentWeekSummaryExists(): Promise<boolean> {
    const { week_of_year, iso_year } = getCurrentWeekRange();
    return this.getSummariesRepo().summaryExistsForIsoWeek(iso_year, week_of_year);
  }

  /**
   * Check if summary exists for a specific ISO week
   */
  async summaryExistsForIsoWeek(iso_year: number, week_of_year: number): Promise<boolean> {
    return this.getSummariesRepo().summaryExistsForIsoWeek(iso_year, week_of_year);
  }

  /**
   * Check if summary exists for an exact date range.
   */
  async summaryExistsForDateRange(startDate: string, endDate: string): Promise<boolean> {
    return this.getSummariesRepo().summaryExistsForDateRange(startDate, endDate);
  }

  /**
   * Check if summary exists for a specific week
   */
  async summaryExistsForWeek(weekOfYear: number): Promise<boolean> {
    return this.getSummariesRepo().summaryExistsForWeek(weekOfYear);
  }

  /**
   * Get the most recent summary
   */
  async getLatestSummary(): Promise<Summary | null> {
    return this.getSummariesRepo().getLatestSummary();
  }

  // =============================================================================
  // SETTINGS METHODS
  // =============================================================================

  /**
   * Get current settings
   */
  async getSettings(): Promise<Settings | null> {
    return this.getSettingsRepo().getSettings();
  }

  /**
   * Update settings
   */
  async updateSettings(input: UpdateSettingsInput): Promise<Settings> {
    return this.getSettingsRepo().updateSettings(input);
  }

  /**
   * Update popup interval
   */
  async updatePopupInterval(minutes: number): Promise<Settings> {
    return this.getSettingsRepo().updatePopupInterval(minutes);
  }

  /**
   * Update global shortcut
   */
  async updateGlobalShortcut(shortcut: string | null): Promise<Settings> {
    return this.getSettingsRepo().updateGlobalShortcut(shortcut);
  }

  /**
   * Reset settings to defaults
   */
  async resetSettings(): Promise<Settings> {
    return this.getSettingsRepo().resetSettings();
  }

  /**
   * Get effective-dated history grouping rules.
   */
  async getHistoryGroupingRules(): Promise<HistoryGroupingRule[]> {
    return this.getHistoryGroupingRepo().getRules();
  }

  /**
   * Get the current and configured history grouping settings.
   */
  async getHistoryGroupingSettings(): Promise<HistoryGroupingSettings> {
    return this.getHistoryGroupingRepo().getGroupingSettings();
  }

  /**
   * Update history grouping settings and schedule them from the next matching day.
   */
  async updateHistoryGrouping(input: UpdateHistoryGroupingInput): Promise<HistoryGroupingSettings> {
    return this.getHistoryGroupingRepo().updateGrouping(input);
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Get database file path
   */
  getDatabasePath(): string {
    return this.db.getDatabasePath();
  }

  /**
   * Get current week information
   */
  getCurrentWeekInfo(): {
    start_date: string;
    end_date: string;
    week_of_year: number;
  } {
    return getCurrentWeekRange();
  }

  /**
   * Get week information for a specific date
   */
  getWeekInfoForDate(date: string): {
    start_date: string;
    end_date: string;
    week_of_year: number;
  } {
    return getWeekRangeForDate(date);
  }

  /**
   * Get dashboard data (today's entries, current week summary, recent summaries)
   */
  async getDashboardData(): Promise<{
    todayEntries: Entry[];
    currentWeekSummary: Summary | null;
    recentSummaries: Summary[];
    settings: Settings | null;
  }> {
    const [todayEntries, currentWeekSummary, recentSummaries, settings] = await Promise.all([
      this.getTodayEntries(),
      this.getCurrentWeekSummary(),
      this.getAllSummaries().then((summaries) => summaries.slice(0, 5)), // Get last 5 summaries
      this.getSettings(),
    ]);

    return {
      todayEntries,
      currentWeekSummary,
      recentSummaries,
      settings,
    };
  }
}

// Singleton instance
export const databaseService = new DatabaseService();
