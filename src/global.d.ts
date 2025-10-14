import {
  Entry,
  Summary,
  Settings,
  CreateEntryInput,
  CreateSummaryInput,
  UpdateSettingsInput,
  EntryFilters,
} from "./sqlite/types";

// Vite environment variables for Electron Forge
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

declare global {
  interface Window {
    appApi: {
      ping: () => Promise<string>;
      /*
       * SQLite-backed database API
       */
      db: {
        // Entries
        createEntry: (input: CreateEntryInput) => Promise<Entry>;
        getEntryById: (id: number) => Promise<Entry | null>;
        getEntries: (filters?: EntryFilters) => Promise<Entry[]>;
        getTodayEntries: () => Promise<Entry[]>;
        getCurrentWeekEntries: () => Promise<Entry[]>;
        getEntriesForDate: (date: string) => Promise<Entry[]>;
        getEntriesForWeek: (weekOfYear: number) => Promise<Entry[]>;
        getEntriesForDateRange: (
          startDate: string,
          endDate: string,
        ) => Promise<Entry[]>;
        updateEntry: (id: number, content: string) => Promise<Entry | null>;
        deleteEntry: (id: number) => Promise<boolean>;
        getDatesWithEntries: () => Promise<string[]>;
        getWeeksWithEntries: () => Promise<number[]>;

        // Summaries
        createSummary: (input: CreateSummaryInput) => Promise<Summary>;
        createCurrentWeekSummary: (content: string) => Promise<Summary>;
        getSummaryById: (id: number) => Promise<Summary | null>;
        getSummaryByWeek: (weekOfYear: number) => Promise<Summary | null>;
        getCurrentWeekSummary: () => Promise<Summary | null>;
        getAllSummaries: () => Promise<Summary[]>;
        getSummariesByYear: (year: number) => Promise<Summary[]>;
        updateSummary: (id: number, content: string) => Promise<Summary | null>;
        deleteSummary: (id: number) => Promise<boolean>;
        currentWeekSummaryExists: () => Promise<boolean>;
        summaryExistsForWeek: (weekOfYear: number) => Promise<boolean>;
        getLatestSummary: () => Promise<Summary | null>;

        // Settings
        getSettings: () => Promise<Settings | null>;
        updateSettings: (input: UpdateSettingsInput) => Promise<Settings>;
        updatePopupInterval: (minutes: number) => Promise<Settings>;
        updateGlobalShortcut: (shortcut: string | null) => Promise<Settings>;
        resetSettings: () => Promise<Settings>;

        // Utilities
        getDatabasePath: () => Promise<string>;
        getCurrentWeekInfo: () => Promise<{
          start_date: string;
          end_date: string;
          week_of_year: number;
        }>;
        getWeekInfoForDate: (date: string) => Promise<{
          start_date: string;
          end_date: string;
          week_of_year: number;
        }>;
        getDashboardData: () => Promise<{
          todayEntries: Entry[];
          currentWeekSummary: Summary | null;
          recentSummaries: Summary[];
          settings: Settings | null;
        }>;
      };
      // Optional capture popup API (to be implemented)
      capture?: {
        openCapturePopup: () => void;
      };
    };
  }
}
