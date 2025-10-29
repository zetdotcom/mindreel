import { type Database, database } from "./database";
import { getCurrentWeekRange, getWeekRangeForDate, type IsoWeekIdentifier } from "./dateUtils";
import { EntriesRepository } from "./repositories/entriesRepository";
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
    this.summariesRepo = new SummariesRepository(db);
    this.settingsRepo = new SettingsRepository(db);

    // Initialize default settings
    await this.settingsRepo.initializeDefaults();

    this.isInitialized = true;
    console.log("Database service initialized successfully");
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    await this.db.close();
    this.entriesRepo = null;
    this.summariesRepo = null;
    this.settingsRepo = null;
    this.isInitialized = false;
  }

  /**
   * Ensure the service is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized || !this.entriesRepo || !this.summariesRepo || !this.settingsRepo) {
      throw new Error("Database service not initialized. Call initialize() first.");
    }
  }

  // =============================================================================
  // ENTRIES METHODS
  // =============================================================================

  /**
   * Create a new entry
   */
  async createEntry(input: CreateEntryInput): Promise<Entry> {
    this.ensureInitialized();
    return this.entriesRepo!.createEntry(input);
  }

  /**
   * Get entry by ID
   */
  async getEntryById(id: number): Promise<Entry | null> {
    this.ensureInitialized();
    return this.entriesRepo!.getEntryById(id);
  }

  /**
   * Get all entries with optional filters
   */
  async getEntries(filters?: EntryFilters): Promise<Entry[]> {
    this.ensureInitialized();
    return this.entriesRepo!.getEntries(filters);
  }

  /**
   * Get entries for today
   */
  async getTodayEntries(): Promise<Entry[]> {
    this.ensureInitialized();
    const today = new Date().toISOString().split("T")[0];
    return this.entriesRepo!.getEntriesForDate(today);
  }

  /**
   * Get entries for current week
   */
  async getCurrentWeekEntries(): Promise<Entry[]> {
    this.ensureInitialized();
    const { week_of_year, iso_year } = getCurrentWeekRange();
    return this.entriesRepo!.getEntriesForIsoWeek(iso_year, week_of_year);
  }

  /**
   * Get entries for a specific ISO week
   */
  async getEntriesForIsoWeek(iso_year: number, week_of_year: number): Promise<Entry[]> {
    this.ensureInitialized();
    return this.entriesRepo!.getEntriesForIsoWeek(iso_year, week_of_year);
  }

  /**
   * Get entries for a specific date
   */
  async getEntriesForDate(date: string): Promise<Entry[]> {
    this.ensureInitialized();
    return this.entriesRepo!.getEntriesForDate(date);
  }

  /**
   * Get entries for a specific week
   */
  async getEntriesForWeek(weekOfYear: number): Promise<Entry[]> {
    this.ensureInitialized();
    return this.entriesRepo!.getEntriesForWeek(weekOfYear);
  }

  /**
   * Get entries for a date range
   */
  async getEntriesForDateRange(startDate: string, endDate: string): Promise<Entry[]> {
    this.ensureInitialized();
    return this.entriesRepo!.getEntriesForDateRange(startDate, endDate);
  }

  /**
   * Update entry content
   */
  async updateEntry(id: number, content: string): Promise<Entry | null> {
    this.ensureInitialized();
    return this.entriesRepo!.updateEntry(id, content);
  }

  /**
   * Delete entry
   */
  async deleteEntry(id: number): Promise<boolean> {
    this.ensureInitialized();
    return this.entriesRepo!.deleteEntry(id);
  }

  /**
   * Get all dates that have entries
   */
  async getDatesWithEntries(): Promise<string[]> {
    this.ensureInitialized();
    return this.entriesRepo!.getDatesWithEntries();
  }

  /**
   * Get all weeks that have entries
   */
  async getWeeksWithEntries(): Promise<number[]> {
    this.ensureInitialized();
    return this.entriesRepo!.getWeeksWithEntries();
  }

  /**
   * Get all ISO weeks that have entries
   */
  async getIsoWeeksWithEntries(): Promise<IsoWeekIdentifier[]> {
    this.ensureInitialized();
    return this.entriesRepo!.getIsoWeeksWithEntries();
  }

  // =============================================================================
  // SUMMARIES METHODS
  // =============================================================================

  /**
   * Create a new summary
   */
  async createSummary(input: CreateSummaryInput): Promise<Summary> {
    this.ensureInitialized();
    return this.summariesRepo!.createSummary(input);
  }

  /**
   * Create a summary for the current week using existing entries
   */
  async createCurrentWeekSummary(content: string): Promise<Summary> {
    this.ensureInitialized();
    const { start_date, end_date, week_of_year, iso_year } = getCurrentWeekRange();

    return this.summariesRepo!.createSummary({
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
    this.ensureInitialized();
    return this.summariesRepo!.getSummaryById(id);
  }

  /**
   * Get summary for a specific week
   */
  async getSummaryByWeek(weekOfYear: number): Promise<Summary | null> {
    this.ensureInitialized();
    return this.summariesRepo!.getSummaryByWeek(weekOfYear);
  }

  /**
   * Get summary for current week
   */
  async getCurrentWeekSummary(): Promise<Summary | null> {
    this.ensureInitialized();
    const { week_of_year, iso_year } = getCurrentWeekRange();
    return this.summariesRepo!.getSummaryForIsoWeek(iso_year, week_of_year);
  }

  /**
   * Get summary for a specific ISO week
   */
  async getSummaryForIsoWeek(iso_year: number, week_of_year: number): Promise<Summary | null> {
    this.ensureInitialized();
    return this.summariesRepo!.getSummaryForIsoWeek(iso_year, week_of_year);
  }

  /**
   * Get all summaries
   */
  async getAllSummaries(): Promise<Summary[]> {
    this.ensureInitialized();
    return this.summariesRepo!.getAllSummaries();
  }

  /**
   * Get summaries for a specific year
   */
  async getSummariesByYear(year: number): Promise<Summary[]> {
    this.ensureInitialized();
    return this.summariesRepo!.getSummariesByYear(year);
  }

  /**
   * Update summary content
   */
  async updateSummary(id: number, content: string): Promise<Summary | null> {
    this.ensureInitialized();
    return this.summariesRepo!.updateSummary(id, content);
  }

  /**
   * Delete summary
   */
  async deleteSummary(id: number): Promise<boolean> {
    this.ensureInitialized();
    return this.summariesRepo!.deleteSummary(id);
  }

  /**
   * Check if summary exists for current week
   */
  async currentWeekSummaryExists(): Promise<boolean> {
    this.ensureInitialized();
    const { week_of_year, iso_year } = getCurrentWeekRange();
    return this.summariesRepo!.summaryExistsForIsoWeek(iso_year, week_of_year);
  }

  /**
   * Check if summary exists for a specific ISO week
   */
  async summaryExistsForIsoWeek(iso_year: number, week_of_year: number): Promise<boolean> {
    this.ensureInitialized();
    return this.summariesRepo!.summaryExistsForIsoWeek(iso_year, week_of_year);
  }

  /**
   * Check if summary exists for a specific week
   */
  async summaryExistsForWeek(weekOfYear: number): Promise<boolean> {
    this.ensureInitialized();
    return this.summariesRepo!.summaryExistsForWeek(weekOfYear);
  }

  /**
   * Get the most recent summary
   */
  async getLatestSummary(): Promise<Summary | null> {
    this.ensureInitialized();
    return this.summariesRepo!.getLatestSummary();
  }

  // =============================================================================
  // SETTINGS METHODS
  // =============================================================================

  /**
   * Get current settings
   */
  async getSettings(): Promise<Settings | null> {
    this.ensureInitialized();
    return this.settingsRepo!.getSettings();
  }

  /**
   * Update settings
   */
  async updateSettings(input: UpdateSettingsInput): Promise<Settings> {
    this.ensureInitialized();
    return this.settingsRepo!.updateSettings(input);
  }

  /**
   * Update popup interval
   */
  async updatePopupInterval(minutes: number): Promise<Settings> {
    this.ensureInitialized();
    return this.settingsRepo!.updatePopupInterval(minutes);
  }

  /**
   * Update global shortcut
   */
  async updateGlobalShortcut(shortcut: string | null): Promise<Settings> {
    this.ensureInitialized();
    return this.settingsRepo!.updateGlobalShortcut(shortcut);
  }

  /**
   * Reset settings to defaults
   */
  async resetSettings(): Promise<Settings> {
    this.ensureInitialized();
    return this.settingsRepo!.resetSettings();
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
    this.ensureInitialized();

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
