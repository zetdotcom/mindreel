import sqlite3 from "sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { formatDate, getISOWeekNumber, getISOYear } from "../dateUtils";
import type { CreateEntryInput } from "../types";
import { EntriesRepository } from "./entriesRepository";

describe("EntriesRepository", () => {
  let db: sqlite3.Database;
  let repository: EntriesRepository;

  beforeEach(async () => {
    db = new sqlite3.Database(":memory:");
    repository = new EntriesRepository(db);

    await new Promise<void>((resolve, reject) => {
      db.run(
        `
        CREATE TABLE entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          content TEXT NOT NULL,
          date TEXT NOT NULL,
          week_of_year INTEGER NOT NULL,
          iso_year INTEGER NOT NULL,
          created_at TEXT NOT NULL
        )
      `,
        (err) => {
          if (err) reject(err);
          else resolve();
        },
      );
    });
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => {
      db.close(() => resolve());
    });
  });

  describe("createEntry", () => {
    it("should create a new entry with auto-generated fields", async () => {
      const input: CreateEntryInput = {
        content: "Test entry content",
      };

      const entry = await repository.createEntry(input);

      expect(entry.id).toBe(1);
      expect(entry.content).toBe("Test entry content");
      expect(entry.date).toBeDefined();
      expect(entry.week_of_year).toBeGreaterThan(0);
      expect(entry.iso_year).toBeGreaterThan(2020);
      expect(entry.created_at).toBeDefined();
    });

    it("should create multiple entries with incrementing IDs", async () => {
      const entry1 = await repository.createEntry({ content: "Entry 1" });
      const entry2 = await repository.createEntry({ content: "Entry 2" });

      expect(entry1.id).toBe(1);
      expect(entry2.id).toBe(2);
    });

    it("should set correct date format (YYYY-MM-DD)", async () => {
      const entry = await repository.createEntry({ content: "Test" });
      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("should set ISO 8601 timestamp for created_at", async () => {
      const entry = await repository.createEntry({ content: "Test" });
      expect(entry.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe("getEntryById", () => {
    it("should return entry by ID", async () => {
      const created = await repository.createEntry({ content: "Test entry" });
      const entry = await repository.getEntryById(created.id);

      expect(entry).not.toBeNull();
      expect(entry?.id).toBe(created.id);
      expect(entry?.content).toBe("Test entry");
    });

    it("should return null for non-existent ID", async () => {
      const entry = await repository.getEntryById(999);
      expect(entry).toBeNull();
    });
  });

  describe("getEntries", () => {
    beforeEach(async () => {
      await repository.createEntry({ content: "Entry 1" });
      await new Promise((resolve) => setTimeout(resolve, 5));
      await repository.createEntry({ content: "Entry 2" });
      await new Promise((resolve) => setTimeout(resolve, 5));
      await repository.createEntry({ content: "Entry 3" });
    });

    it("should return all entries ordered by created_at DESC", async () => {
      const entries = await repository.getEntries();

      expect(entries).toHaveLength(3);
      expect(entries[0].content).toBe("Entry 3");
      expect(entries[2].content).toBe("Entry 1");
    });

    it("should filter entries by date", async () => {
      const todayDate = formatDate(new Date());
      const entries = await repository.getEntries({ date: todayDate });

      expect(entries.length).toBeGreaterThan(0);
      expect(entries.every((e) => e.date === todayDate)).toBe(true);
    });

    it("should filter entries by week_of_year", async () => {
      const currentWeek = getISOWeekNumber(new Date());
      const entries = await repository.getEntries({
        week_of_year: currentWeek,
      });

      expect(entries.length).toBeGreaterThan(0);
      expect(entries.every((e) => e.week_of_year === currentWeek)).toBe(true);
    });

    it("should filter entries by date range", async () => {
      const today = new Date();
      const startDate = formatDate(new Date(today.getTime() - 86400000));
      const endDate = formatDate(new Date(today.getTime() + 86400000));

      const entries = await repository.getEntries({
        start_date: startDate,
        end_date: endDate,
      });

      expect(entries.length).toBeGreaterThan(0);
    });

    it("should return empty array when no entries match filters", async () => {
      const entries = await repository.getEntries({ date: "2000-01-01" });
      expect(entries).toEqual([]);
    });
  });

  describe("getEntriesForDate", () => {
    it("should return entries for specific date", async () => {
      await repository.createEntry({ content: "Today's entry" });
      const todayDate = formatDate(new Date());
      const entries = await repository.getEntriesForDate(todayDate);

      expect(entries.length).toBeGreaterThan(0);
      expect(entries.every((e) => e.date === todayDate)).toBe(true);
    });
  });

  describe("getEntriesForWeek", () => {
    it("should return entries for specific week", async () => {
      await repository.createEntry({ content: "This week's entry" });
      const currentWeek = getISOWeekNumber(new Date());
      const entries = await repository.getEntriesForWeek(currentWeek);

      expect(entries.length).toBeGreaterThan(0);
      expect(entries.every((e) => e.week_of_year === currentWeek)).toBe(true);
    });
  });

  describe("getEntriesForIsoWeek", () => {
    it("should return entries for specific ISO week", async () => {
      await repository.createEntry({ content: "ISO week entry" });
      const currentYear = getISOYear(new Date());
      const currentWeek = getISOWeekNumber(new Date());

      const entries = await repository.getEntriesForIsoWeek(currentYear, currentWeek);

      expect(entries.length).toBeGreaterThan(0);
      expect(
        entries.every((e) => e.iso_year === currentYear && e.week_of_year === currentWeek),
      ).toBe(true);
    });
  });

  describe("getEntriesForDateRange", () => {
    it("should return entries within date range", async () => {
      await repository.createEntry({ content: "Range entry" });
      const today = new Date();
      const startDate = formatDate(new Date(today.getTime() - 86400000));
      const endDate = formatDate(new Date(today.getTime() + 86400000));

      const entries = await repository.getEntriesForDateRange(startDate, endDate);

      expect(entries.length).toBeGreaterThan(0);
    });
  });

  describe("updateEntry", () => {
    it("should update entry content", async () => {
      const created = await repository.createEntry({
        content: "Original content",
      });
      const updated = await repository.updateEntry(created.id, "Updated content");

      expect(updated).not.toBeNull();
      expect(updated?.content).toBe("Updated content");
      expect(updated?.id).toBe(created.id);
    });

    it("should return null when updating non-existent entry", async () => {
      const updated = await repository.updateEntry(999, "New content");
      expect(updated).toBeNull();
    });

    it("should preserve other fields when updating content", async () => {
      const created = await repository.createEntry({ content: "Original" });
      const updated = await repository.updateEntry(created.id, "Updated");

      expect(updated?.date).toBe(created.date);
      expect(updated?.week_of_year).toBe(created.week_of_year);
      expect(updated?.created_at).toBe(created.created_at);
    });
  });

  describe("deleteEntry", () => {
    it("should delete existing entry", async () => {
      const created = await repository.createEntry({ content: "To delete" });
      const deleted = await repository.deleteEntry(created.id);

      expect(deleted).toBe(true);

      const entry = await repository.getEntryById(created.id);
      expect(entry).toBeNull();
    });

    it("should return false when deleting non-existent entry", async () => {
      const deleted = await repository.deleteEntry(999);
      expect(deleted).toBe(false);
    });
  });

  describe("getEntryCountForDate", () => {
    it("should return count of entries for specific date", async () => {
      await repository.createEntry({ content: "Entry 1" });
      await repository.createEntry({ content: "Entry 2" });

      const todayDate = formatDate(new Date());
      const count = await repository.getEntryCountForDate(todayDate);

      expect(count).toBe(2);
    });

    it("should return 0 for date with no entries", async () => {
      const count = await repository.getEntryCountForDate("2000-01-01");
      expect(count).toBe(0);
    });
  });

  describe("getEntryCountForWeek", () => {
    it("should return count of entries for specific week", async () => {
      await repository.createEntry({ content: "Entry 1" });
      await repository.createEntry({ content: "Entry 2" });

      const currentWeek = getISOWeekNumber(new Date());
      const count = await repository.getEntryCountForWeek(currentWeek);

      expect(count).toBe(2);
    });
  });

  describe("getDatesWithEntries", () => {
    it("should return all unique dates with entries", async () => {
      await repository.createEntry({ content: "Entry 1" });
      await repository.createEntry({ content: "Entry 2" });

      const dates = await repository.getDatesWithEntries();

      expect(dates.length).toBeGreaterThan(0);
      expect(dates).toContain(formatDate(new Date()));
    });

    it("should return dates in descending order", async () => {
      await repository.createEntry({ content: "Entry" });
      const dates = await repository.getDatesWithEntries();

      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i] >= dates[i + 1]).toBe(true);
      }
    });

    it("should return empty array when no entries exist", async () => {
      const dates = await repository.getDatesWithEntries();
      expect(dates).toEqual([]);
    });
  });

  describe("getWeeksWithEntries", () => {
    it("should return all unique weeks with entries", async () => {
      await repository.createEntry({ content: "Entry 1" });
      await repository.createEntry({ content: "Entry 2" });

      const weeks = await repository.getWeeksWithEntries();

      expect(weeks.length).toBeGreaterThan(0);
      expect(weeks).toContain(getISOWeekNumber(new Date()));
    });

    it("should return empty array when no entries exist", async () => {
      const weeks = await repository.getWeeksWithEntries();
      expect(weeks).toEqual([]);
    });
  });

  describe("getIsoWeeksWithEntries", () => {
    it("should return all unique ISO weeks with entries", async () => {
      await repository.createEntry({ content: "Entry 1" });

      const isoWeeks = await repository.getIsoWeeksWithEntries();

      expect(isoWeeks.length).toBeGreaterThan(0);
      expect(isoWeeks[0]).toHaveProperty("iso_year");
      expect(isoWeeks[0]).toHaveProperty("week_of_year");
    });

    it("should return ISO weeks in descending order", async () => {
      await repository.createEntry({ content: "Entry" });
      const isoWeeks = await repository.getIsoWeeksWithEntries();

      for (let i = 0; i < isoWeeks.length - 1; i++) {
        const current = isoWeeks[i].iso_year * 100 + isoWeeks[i].week_of_year;
        const next = isoWeeks[i + 1].iso_year * 100 + isoWeeks[i + 1].week_of_year;
        expect(current >= next).toBe(true);
      }
    });

    it("should return empty array when no entries exist", async () => {
      const isoWeeks = await repository.getIsoWeeksWithEntries();
      expect(isoWeeks).toEqual([]);
    });
  });
});
