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
  getEntriesForIsoWeek: (iso_year: number, week_of_year: number) =>
    ipcRenderer.invoke("db:getEntriesForIsoWeek", iso_year, week_of_year),
  getEntriesForDateRange: (startDate: string, endDate: string) =>
    ipcRenderer.invoke("db:getEntriesForDateRange", startDate, endDate),
  updateEntry: (id: number, content: string) =>
    ipcRenderer.invoke("db:updateEntry", id, content),
  deleteEntry: (id: number) => ipcRenderer.invoke("db:deleteEntry", id),
  getDatesWithEntries: () => ipcRenderer.invoke("db:getDatesWithEntries"),
  getWeeksWithEntries: () => ipcRenderer.invoke("db:getWeeksWithEntries"),
  getIsoWeeksWithEntries: () => ipcRenderer.invoke("db:getIsoWeeksWithEntries"),

  // Summaries
  createSummary: (input: CreateSummaryInput) =>
    ipcRenderer.invoke("db:createSummary", input),
  createCurrentWeekSummary: (content: string) =>
    ipcRenderer.invoke("db:createCurrentWeekSummary", content),
  getSummaryById: (id: number) => ipcRenderer.invoke("db:getSummaryById", id),
  getSummaryByWeek: (weekOfYear: number) =>
    ipcRenderer.invoke("db:getSummaryByWeek", weekOfYear),
  getSummaryForIsoWeek: (iso_year: number, week_of_year: number) =>
    ipcRenderer.invoke("db:getSummaryForIsoWeek", iso_year, week_of_year),
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
  summaryExistsForIsoWeek: (iso_year: number, week_of_year: number) =>
    ipcRenderer.invoke("db:summaryExistsForIsoWeek", iso_year, week_of_year),
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

// Capture window API
const captureApi = {
  openCapturePopup: () => ipcRenderer.invoke("capture:openPopup"),
  closeCapturePopup: () => ipcRenderer.invoke("capture:closePopup"),
};

// Expose APIs to renderer process
contextBridge.exposeInMainWorld("appApi", {
  ping: () => ipcRenderer.invoke("ping"),
  db: databaseApi,
  capture: captureApi,
});
