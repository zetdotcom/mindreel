import { contextBridge, ipcRenderer } from "electron";
import {
  CreateEntryInput,
  CreateSummaryInput,
  UpdateSettingsInput,
  EntryFilters,
} from "./sqlite/types";

// Database API for renderer process
const databaseApi = {
  // Entries
  createEntry: (input: CreateEntryInput) =>
    ipcRenderer.invoke("db:createEntry", input),
  getEntryById: (id: number) => ipcRenderer.invoke("db:getEntryById", id),
  getEntries: (filters?: EntryFilters) =>
    ipcRenderer.invoke("db:getEntries", filters),
  getTodayEntries: () => ipcRenderer.invoke("db:getTodayEntries"),
  getCurrentWeekEntries: () => ipcRenderer.invoke("db:getCurrentWeekEntries"),
  getEntriesForDate: (date: string) =>
    ipcRenderer.invoke("db:getEntriesForDate", date),
  getEntriesForWeek: (weekOfYear: number) =>
    ipcRenderer.invoke("db:getEntriesForWeek", weekOfYear),
  getEntriesForDateRange: (startDate: string, endDate: string) =>
    ipcRenderer.invoke("db:getEntriesForDateRange", startDate, endDate),
  updateEntry: (id: number, content: string) =>
    ipcRenderer.invoke("db:updateEntry", id, content),
  deleteEntry: (id: number) => ipcRenderer.invoke("db:deleteEntry", id),
  getDatesWithEntries: () => ipcRenderer.invoke("db:getDatesWithEntries"),
  getWeeksWithEntries: () => ipcRenderer.invoke("db:getWeeksWithEntries"),

  // Summaries
  createSummary: (input: CreateSummaryInput) =>
    ipcRenderer.invoke("db:createSummary", input),
  createCurrentWeekSummary: (content: string) =>
    ipcRenderer.invoke("db:createCurrentWeekSummary", content),
  getSummaryById: (id: number) => ipcRenderer.invoke("db:getSummaryById", id),
  getSummaryByWeek: (weekOfYear: number) =>
    ipcRenderer.invoke("db:getSummaryByWeek", weekOfYear),
  getCurrentWeekSummary: () => ipcRenderer.invoke("db:getCurrentWeekSummary"),
  getAllSummaries: () => ipcRenderer.invoke("db:getAllSummaries"),
  getSummariesByYear: (year: number) =>
    ipcRenderer.invoke("db:getSummariesByYear", year),
  updateSummary: (id: number, content: string) =>
    ipcRenderer.invoke("db:updateSummary", id, content),
  deleteSummary: (id: number) => ipcRenderer.invoke("db:deleteSummary", id),
  currentWeekSummaryExists: () =>
    ipcRenderer.invoke("db:currentWeekSummaryExists"),
  summaryExistsForWeek: (weekOfYear: number) =>
    ipcRenderer.invoke("db:summaryExistsForWeek", weekOfYear),
  getLatestSummary: () => ipcRenderer.invoke("db:getLatestSummary"),

  // Settings
  getSettings: () => ipcRenderer.invoke("db:getSettings"),
  updateSettings: (input: UpdateSettingsInput) =>
    ipcRenderer.invoke("db:updateSettings", input),
  updatePopupInterval: (minutes: number) =>
    ipcRenderer.invoke("db:updatePopupInterval", minutes),
  updateGlobalShortcut: (shortcut: string | null) =>
    ipcRenderer.invoke("db:updateGlobalShortcut", shortcut),
  resetSettings: () => ipcRenderer.invoke("db:resetSettings"),

  // Utilities
  getDatabasePath: () => ipcRenderer.invoke("db:getDatabasePath"),
  getCurrentWeekInfo: () => ipcRenderer.invoke("db:getCurrentWeekInfo"),
  getWeekInfoForDate: (date: string) =>
    ipcRenderer.invoke("db:getWeekInfoForDate", date),
  getDashboardData: () => ipcRenderer.invoke("db:getDashboardData"),
};

// Expose APIs to renderer process
contextBridge.exposeInMainWorld("appApi", {
  ping: () => ipcRenderer.invoke("ping"),
  db: databaseApi,
  supabase: {
    // Privileged quota operations routed through main process
    incrementQuota: (userId: string) =>
      ipcRenderer.invoke("supabase:quota:increment", { userId }),
    getQuota: (userId: string) =>
      ipcRenderer.invoke("supabase:quota:get", userId),
  },
});
