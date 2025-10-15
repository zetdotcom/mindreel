import { ipcMain } from "electron";
import { databaseService } from "../sqlite/databaseService";
import {
  CreateEntryInput,
  CreateSummaryInput,
  UpdateSettingsInput,
  EntryFilters,
} from "../sqlite/types";
import { IsoWeekIdentifier } from "../sqlite/dateUtils";

/**
 * Register all database-related IPC handlers
 */
export function registerDatabaseHandlers(): void {
  // =============================================================================
  // ENTRIES HANDLERS
  // =============================================================================

  ipcMain.handle("db:createEntry", async (_event, input: CreateEntryInput) => {
    try {
      return await databaseService.createEntry(input);
    } catch (error) {
      console.error("Error creating entry:", error);
      throw error;
    }
  });

  ipcMain.handle("db:getEntryById", async (_event, id: number) => {
    try {
      return await databaseService.getEntryById(id);
    } catch (error) {
      console.error("Error getting entry by ID:", error);
      throw error;
    }
  });

  ipcMain.handle("db:getEntries", async (_event, filters?: EntryFilters) => {
    try {
      return await databaseService.getEntries(filters);
    } catch (error) {
      console.error("Error getting entries:", error);
      throw error;
    }
  });

  ipcMain.handle("db:getTodayEntries", async (_event) => {
    try {
      return await databaseService.getTodayEntries();
    } catch (error) {
      console.error("Error getting today entries:", error);
      throw error;
    }
  });

  ipcMain.handle("db:getCurrentWeekEntries", async (_event) => {
    try {
      return await databaseService.getCurrentWeekEntries();
    } catch (error) {
      console.error("Error getting current week entries:", error);
      throw error;
    }
  });

  ipcMain.handle("db:getEntriesForDate", async (_event, date: string) => {
    try {
      return await databaseService.getEntriesForDate(date);
    } catch (error) {
      console.error("Error getting entries for date:", error);
      throw error;
    }
  });

  ipcMain.handle("db:getEntriesForWeek", async (_event, weekOfYear: number) => {
    try {
      return await databaseService.getEntriesForWeek(weekOfYear);
    } catch (error) {
      console.error("Error getting entries for week:", error);
      throw error;
    }
  });

  ipcMain.handle(
    "db:getEntriesForIsoWeek",
    async (_event, iso_year: number, week_of_year: number) => {
      try {
        return await databaseService.getEntriesForIsoWeek(
          iso_year,
          week_of_year,
        );
      } catch (error) {
        console.error("Error getting entries for ISO week:", error);
        throw error;
      }
    },
  );

  ipcMain.handle(
    "db:getEntriesForDateRange",
    async (_event, startDate: string, endDate: string) => {
      try {
        return await databaseService.getEntriesForDateRange(startDate, endDate);
      } catch (error) {
        console.error("Error getting entries for date range:", error);
        throw error;
      }
    },
  );

  ipcMain.handle(
    "db:updateEntry",
    async (_event, id: number, content: string) => {
      try {
        return await databaseService.updateEntry(id, content);
      } catch (error) {
        console.error("Error updating entry:", error);
        throw error;
      }
    },
  );

  ipcMain.handle("db:deleteEntry", async (_event, id: number) => {
    try {
      return await databaseService.deleteEntry(id);
    } catch (error) {
      console.error("Error deleting entry:", error);
      throw error;
    }
  });

  ipcMain.handle("db:getDatesWithEntries", async (_event) => {
    try {
      return await databaseService.getDatesWithEntries();
    } catch (error) {
      console.error("Error getting dates with entries:", error);
      throw error;
    }
  });

  ipcMain.handle("db:getWeeksWithEntries", async (_event) => {
    try {
      return await databaseService.getWeeksWithEntries();
    } catch (error) {
      console.error("Error getting weeks with entries:", error);
      throw error;
    }
  });

  ipcMain.handle("db:getIsoWeeksWithEntries", async (_event) => {
    try {
      return await databaseService.getIsoWeeksWithEntries();
    } catch (error) {
      console.error("Error getting ISO weeks with entries:", error);
      throw error;
    }
  });

  // =============================================================================
  // SUMMARIES HANDLERS
  // =============================================================================

  ipcMain.handle(
    "db:createSummary",
    async (_event, input: CreateSummaryInput) => {
      try {
        return await databaseService.createSummary(input);
      } catch (error) {
        console.error("Error creating summary:", error);
        throw error;
      }
    },
  );

  ipcMain.handle(
    "db:createCurrentWeekSummary",
    async (_event, content: string) => {
      try {
        return await databaseService.createCurrentWeekSummary(content);
      } catch (error) {
        console.error("Error creating current week summary:", error);
        throw error;
      }
    },
  );

  ipcMain.handle("db:getSummaryById", async (_event, id: number) => {
    try {
      return await databaseService.getSummaryById(id);
    } catch (error) {
      console.error("Error getting summary by ID:", error);
      throw error;
    }
  });

  ipcMain.handle("db:getSummaryByWeek", async (_event, weekOfYear: number) => {
    try {
      return await databaseService.getSummaryByWeek(weekOfYear);
    } catch (error) {
      console.error("Error getting summary by week:", error);
      throw error;
    }
  });

  ipcMain.handle(
    "db:getSummaryForIsoWeek",
    async (_event, iso_year: number, week_of_year: number) => {
      try {
        return await databaseService.getSummaryForIsoWeek(
          iso_year,
          week_of_year,
        );
      } catch (error) {
        console.error("Error getting summary for ISO week:", error);
        throw error;
      }
    },
  );

  ipcMain.handle("db:getCurrentWeekSummary", async (_event) => {
    try {
      return await databaseService.getCurrentWeekSummary();
    } catch (error) {
      console.error("Error getting current week summary:", error);
      throw error;
    }
  });

  ipcMain.handle("db:getAllSummaries", async (_event) => {
    try {
      return await databaseService.getAllSummaries();
    } catch (error) {
      console.error("Error getting all summaries:", error);
      throw error;
    }
  });

  ipcMain.handle("db:getSummariesByYear", async (_event, year: number) => {
    try {
      return await databaseService.getSummariesByYear(year);
    } catch (error) {
      console.error("Error getting summaries by year:", error);
      throw error;
    }
  });

  ipcMain.handle(
    "db:updateSummary",
    async (_event, id: number, content: string) => {
      try {
        return await databaseService.updateSummary(id, content);
      } catch (error) {
        console.error("Error updating summary:", error);
        throw error;
      }
    },
  );

  ipcMain.handle("db:deleteSummary", async (_event, id: number) => {
    try {
      return await databaseService.deleteSummary(id);
    } catch (error) {
      console.error("Error deleting summary:", error);
      throw error;
    }
  });

  ipcMain.handle("db:currentWeekSummaryExists", async (_event) => {
    try {
      return await databaseService.currentWeekSummaryExists();
    } catch (error) {
      console.error("Error checking if current week summary exists:", error);
      throw error;
    }
  });

  ipcMain.handle(
    "db:summaryExistsForIsoWeek",
    async (_event, iso_year: number, week_of_year: number) => {
      try {
        return await databaseService.summaryExistsForIsoWeek(
          iso_year,
          week_of_year,
        );
      } catch (error) {
        console.error("Error checking if summary exists for ISO week:", error);
        throw error;
      }
    },
  );

  ipcMain.handle(
    "db:summaryExistsForWeek",
    async (_event, weekOfYear: number) => {
      try {
        return await databaseService.summaryExistsForWeek(weekOfYear);
      } catch (error) {
        console.error("Error checking if summary exists for week:", error);
        throw error;
      }
    },
  );

  ipcMain.handle("db:getLatestSummary", async (_event) => {
    try {
      return await databaseService.getLatestSummary();
    } catch (error) {
      console.error("Error getting latest summary:", error);
      throw error;
    }
  });

  // =============================================================================
  // SETTINGS HANDLERS
  // =============================================================================

  ipcMain.handle("db:getSettings", async (_event) => {
    try {
      return await databaseService.getSettings();
    } catch (error) {
      console.error("Error getting settings:", error);
      throw error;
    }
  });

  ipcMain.handle(
    "db:updateSettings",
    async (_event, input: UpdateSettingsInput) => {
      try {
        return await databaseService.updateSettings(input);
      } catch (error) {
        console.error("Error updating settings:", error);
        throw error;
      }
    },
  );

  ipcMain.handle("db:updatePopupInterval", async (_event, minutes: number) => {
    try {
      return await databaseService.updatePopupInterval(minutes);
    } catch (error) {
      console.error("Error updating popup interval:", error);
      throw error;
    }
  });

  ipcMain.handle(
    "db:updateGlobalShortcut",
    async (_event, shortcut: string | null) => {
      try {
        return await databaseService.updateGlobalShortcut(shortcut);
      } catch (error) {
        console.error("Error updating global shortcut:", error);
        throw error;
      }
    },
  );

  ipcMain.handle("db:resetSettings", async (_event) => {
    try {
      return await databaseService.resetSettings();
    } catch (error) {
      console.error("Error resetting settings:", error);
      throw error;
    }
  });

  // =============================================================================
  // UTILITY HANDLERS
  // =============================================================================

  ipcMain.handle("db:getDatabasePath", async (_event) => {
    try {
      return databaseService.getDatabasePath();
    } catch (error) {
      console.error("Error getting database path:", error);
      throw error;
    }
  });

  ipcMain.handle("db:getCurrentWeekInfo", async (_event) => {
    try {
      return databaseService.getCurrentWeekInfo();
    } catch (error) {
      console.error("Error getting current week info:", error);
      throw error;
    }
  });

  ipcMain.handle("db:getWeekInfoForDate", async (_event, date: string) => {
    try {
      return databaseService.getWeekInfoForDate(date);
    } catch (error) {
      console.error("Error getting week info for date:", error);
      throw error;
    }
  });

  ipcMain.handle("db:getDashboardData", async (_event) => {
    try {
      return await databaseService.getDashboardData();
    } catch (error) {
      console.error("Error getting dashboard data:", error);
      throw error;
    }
  });

  console.log("Database IPC handlers registered successfully");
}

/**
 * Initialize the database service
 */
export async function initializeDatabase(): Promise<void> {
  try {
    await databaseService.initialize();
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}

/**
 * Close the database connection
 */
export async function closeDatabase(): Promise<void> {
  try {
    await databaseService.close();
    console.log("Database closed successfully");
  } catch (error) {
    console.error("Error closing database:", error);
    throw error;
  }
}
