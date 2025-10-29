import sqlite3 from "sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { CreateSummaryInput } from "../types";
import { SummariesRepository } from "./summariesRepository";

describe("SummariesRepository", () => {
  let db: sqlite3.Database;
  let repository: SummariesRepository;

  beforeEach(async () => {
    db = new sqlite3.Database(":memory:");
    repository = new SummariesRepository(db);

    await new Promise<void>((resolve, reject) => {
      db.run(
        `
        CREATE TABLE summaries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          content TEXT NOT NULL,
          start_date TEXT NOT NULL,
          end_date TEXT NOT NULL,
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

  describe("createSummary", () => {
    it("should create a new summary with correct data", async () => {
      const input: CreateSummaryInput = {
        content: "Test summary content",
        start_date: "2024-01-01",
        end_date: "2024-01-07",
        week_of_year: 1,
        iso_year: 2024,
      };

      const summary = await repository.createSummary(input);

      expect(summary.id).toBe(1);
      expect(summary.content).toBe("Test summary content");
      expect(summary.start_date).toBe("2024-01-01");
      expect(summary.end_date).toBe("2024-01-07");
      expect(summary.week_of_year).toBe(1);
      expect(summary.iso_year).toBe(2024);
      expect(summary.created_at).toBeDefined();
    });

    it("should create multiple summaries with incrementing IDs", async () => {
      const summary1 = await repository.createSummary({
        content: "Week 1",
        start_date: "2024-01-01",
        end_date: "2024-01-07",
        week_of_year: 1,
        iso_year: 2024,
      });

      const summary2 = await repository.createSummary({
        content: "Week 2",
        start_date: "2024-01-08",
        end_date: "2024-01-14",
        week_of_year: 2,
        iso_year: 2024,
      });

      expect(summary1.id).toBe(1);
      expect(summary2.id).toBe(2);
    });

    it("should handle boundary week 53", async () => {
      const input: CreateSummaryInput = {
        content: "End of year summary",
        start_date: "2024-12-30",
        end_date: "2025-01-05",
        week_of_year: 1,
        iso_year: 2025,
      };

      const summary = await repository.createSummary(input);

      expect(summary.week_of_year).toBe(1);
      expect(summary.iso_year).toBe(2025);
    });
  });

  describe("getSummaryById", () => {
    it("should return summary by ID", async () => {
      const created = await repository.createSummary({
        content: "Test summary",
        start_date: "2024-01-01",
        end_date: "2024-01-07",
        week_of_year: 1,
        iso_year: 2024,
      });

      const summary = await repository.getSummaryById(created.id);

      expect(summary).not.toBeNull();
      expect(summary?.id).toBe(created.id);
      expect(summary?.content).toBe("Test summary");
    });

    it("should return null for non-existent ID", async () => {
      const summary = await repository.getSummaryById(999);
      expect(summary).toBeNull();
    });
  });

  describe("getSummaryByWeek", () => {
    it("should return summary for specific week", async () => {
      await repository.createSummary({
        content: "Week 5 summary",
        start_date: "2024-01-29",
        end_date: "2024-02-04",
        week_of_year: 5,
        iso_year: 2024,
      });

      const summary = await repository.getSummaryByWeek(5);

      expect(summary).not.toBeNull();
      expect(summary?.week_of_year).toBe(5);
      expect(summary?.content).toBe("Week 5 summary");
    });

    it("should return null when no summary exists for week", async () => {
      const summary = await repository.getSummaryByWeek(99);
      expect(summary).toBeNull();
    });
  });

  describe("getSummaryForIsoWeek", () => {
    it("should return summary for specific ISO week", async () => {
      await repository.createSummary({
        content: "ISO week summary",
        start_date: "2024-01-01",
        end_date: "2024-01-07",
        week_of_year: 1,
        iso_year: 2024,
      });

      const summary = await repository.getSummaryForIsoWeek(2024, 1);

      expect(summary).not.toBeNull();
      expect(summary?.iso_year).toBe(2024);
      expect(summary?.week_of_year).toBe(1);
    });

    it("should distinguish between different years with same week", async () => {
      await repository.createSummary({
        content: "2024 Week 1",
        start_date: "2024-01-01",
        end_date: "2024-01-07",
        week_of_year: 1,
        iso_year: 2024,
      });

      await repository.createSummary({
        content: "2025 Week 1",
        start_date: "2024-12-30",
        end_date: "2025-01-05",
        week_of_year: 1,
        iso_year: 2025,
      });

      const summary2024 = await repository.getSummaryForIsoWeek(2024, 1);
      const summary2025 = await repository.getSummaryForIsoWeek(2025, 1);

      expect(summary2024?.content).toBe("2024 Week 1");
      expect(summary2025?.content).toBe("2025 Week 1");
    });

    it("should return null for non-existent ISO week", async () => {
      const summary = await repository.getSummaryForIsoWeek(2024, 99);
      expect(summary).toBeNull();
    });
  });

  describe("getAllSummaries", () => {
    it("should return all summaries ordered by ISO year and week DESC", async () => {
      await repository.createSummary({
        content: "Week 1",
        start_date: "2024-01-01",
        end_date: "2024-01-07",
        week_of_year: 1,
        iso_year: 2024,
      });

      await repository.createSummary({
        content: "Week 5",
        start_date: "2024-01-29",
        end_date: "2024-02-04",
        week_of_year: 5,
        iso_year: 2024,
      });

      await repository.createSummary({
        content: "Week 1 2025",
        start_date: "2024-12-30",
        end_date: "2025-01-05",
        week_of_year: 1,
        iso_year: 2025,
      });

      const summaries = await repository.getAllSummaries();

      expect(summaries).toHaveLength(3);
      expect(summaries[0].content).toBe("Week 1 2025");
      expect(summaries[1].content).toBe("Week 5");
      expect(summaries[2].content).toBe("Week 1");
    });

    it("should return empty array when no summaries exist", async () => {
      const summaries = await repository.getAllSummaries();
      expect(summaries).toEqual([]);
    });
  });

  describe("getSummariesByYear", () => {
    it("should return summaries for specific year", async () => {
      await repository.createSummary({
        content: "2024 Week 1",
        start_date: "2024-01-01",
        end_date: "2024-01-07",
        week_of_year: 1,
        iso_year: 2024,
      });

      await repository.createSummary({
        content: "2023 Week 52",
        start_date: "2023-12-25",
        end_date: "2023-12-31",
        week_of_year: 52,
        iso_year: 2023,
      });

      const summaries2024 = await repository.getSummariesByYear(2024);

      expect(summaries2024).toHaveLength(1);
      expect(summaries2024[0].content).toBe("2024 Week 1");
    });
  });

  describe("updateSummary", () => {
    it("should update summary content", async () => {
      const created = await repository.createSummary({
        content: "Original content",
        start_date: "2024-01-01",
        end_date: "2024-01-07",
        week_of_year: 1,
        iso_year: 2024,
      });

      const updated = await repository.updateSummary(created.id, "Updated content");

      expect(updated).not.toBeNull();
      expect(updated?.content).toBe("Updated content");
      expect(updated?.id).toBe(created.id);
    });

    it("should return null when updating non-existent summary", async () => {
      const updated = await repository.updateSummary(999, "New content");
      expect(updated).toBeNull();
    });

    it("should preserve other fields when updating content", async () => {
      const created = await repository.createSummary({
        content: "Original",
        start_date: "2024-01-01",
        end_date: "2024-01-07",
        week_of_year: 1,
        iso_year: 2024,
      });

      const updated = await repository.updateSummary(created.id, "Updated");

      expect(updated?.start_date).toBe(created.start_date);
      expect(updated?.end_date).toBe(created.end_date);
      expect(updated?.week_of_year).toBe(created.week_of_year);
      expect(updated?.iso_year).toBe(created.iso_year);
    });
  });

  describe("deleteSummary", () => {
    it("should delete existing summary by ID", async () => {
      const created = await repository.createSummary({
        content: "To delete",
        start_date: "2024-01-01",
        end_date: "2024-01-07",
        week_of_year: 1,
        iso_year: 2024,
      });

      const deleted = await repository.deleteSummary(created.id);

      expect(deleted).toBe(true);

      const summary = await repository.getSummaryById(created.id);
      expect(summary).toBeNull();
    });

    it("should return false when deleting non-existent summary", async () => {
      const deleted = await repository.deleteSummary(999);
      expect(deleted).toBe(false);
    });
  });

  describe("deleteSummaryByWeek", () => {
    it("should delete summary by week number", async () => {
      await repository.createSummary({
        content: "Week 10",
        start_date: "2024-03-04",
        end_date: "2024-03-10",
        week_of_year: 10,
        iso_year: 2024,
      });

      const deleted = await repository.deleteSummaryByWeek(10);

      expect(deleted).toBe(true);

      const summary = await repository.getSummaryByWeek(10);
      expect(summary).toBeNull();
    });
  });

  describe("deleteSummaryForIsoWeek", () => {
    it("should delete summary for specific ISO week", async () => {
      await repository.createSummary({
        content: "2024 Week 1",
        start_date: "2024-01-01",
        end_date: "2024-01-07",
        week_of_year: 1,
        iso_year: 2024,
      });

      const deleted = await repository.deleteSummaryForIsoWeek(2024, 1);

      expect(deleted).toBe(true);

      const summary = await repository.getSummaryForIsoWeek(2024, 1);
      expect(summary).toBeNull();
    });
  });

  describe("summaryExistsForWeek", () => {
    it("should return true when summary exists for week", async () => {
      await repository.createSummary({
        content: "Week 15",
        start_date: "2024-04-08",
        end_date: "2024-04-14",
        week_of_year: 15,
        iso_year: 2024,
      });

      const exists = await repository.summaryExistsForWeek(15);
      expect(exists).toBe(true);
    });

    it("should return false when summary does not exist for week", async () => {
      const exists = await repository.summaryExistsForWeek(99);
      expect(exists).toBe(false);
    });
  });

  describe("summaryExistsForIsoWeek", () => {
    it("should return true when summary exists for ISO week", async () => {
      await repository.createSummary({
        content: "2024 Week 20",
        start_date: "2024-05-13",
        end_date: "2024-05-19",
        week_of_year: 20,
        iso_year: 2024,
      });

      const exists = await repository.summaryExistsForIsoWeek(2024, 20);
      expect(exists).toBe(true);
    });

    it("should return false when summary does not exist for ISO week", async () => {
      const exists = await repository.summaryExistsForIsoWeek(2024, 99);
      expect(exists).toBe(false);
    });

    it("should distinguish between different years", async () => {
      await repository.createSummary({
        content: "2024 Week 1",
        start_date: "2024-01-01",
        end_date: "2024-01-07",
        week_of_year: 1,
        iso_year: 2024,
      });

      const exists2024 = await repository.summaryExistsForIsoWeek(2024, 1);
      const exists2025 = await repository.summaryExistsForIsoWeek(2025, 1);

      expect(exists2024).toBe(true);
      expect(exists2025).toBe(false);
    });
  });

  describe("getLatestSummary", () => {
    it("should return the most recent summary", async () => {
      await repository.createSummary({
        content: "First",
        start_date: "2024-01-01",
        end_date: "2024-01-07",
        week_of_year: 1,
        iso_year: 2024,
      });

      await new Promise((resolve) => setTimeout(resolve, 5));

      await repository.createSummary({
        content: "Second",
        start_date: "2024-01-08",
        end_date: "2024-01-14",
        week_of_year: 2,
        iso_year: 2024,
      });

      const latest = await repository.getLatestSummary();

      expect(latest).not.toBeNull();
      expect(latest?.content).toBe("Second");
    });

    it("should return null when no summaries exist", async () => {
      const latest = await repository.getLatestSummary();
      expect(latest).toBeNull();
    });
  });

  describe("getSummariesInDateRange", () => {
    it("should return summaries within date range", async () => {
      await repository.createSummary({
        content: "January Week 1",
        start_date: "2024-01-01",
        end_date: "2024-01-07",
        week_of_year: 1,
        iso_year: 2024,
      });

      await repository.createSummary({
        content: "February Week 5",
        start_date: "2024-01-29",
        end_date: "2024-02-04",
        week_of_year: 5,
        iso_year: 2024,
      });

      await repository.createSummary({
        content: "March Week 10",
        start_date: "2024-03-04",
        end_date: "2024-03-10",
        week_of_year: 10,
        iso_year: 2024,
      });

      const summaries = await repository.getSummariesInDateRange("2024-01-01", "2024-02-28");

      expect(summaries).toHaveLength(2);
      expect(summaries.some((s) => s.content === "January Week 1")).toBe(true);
      expect(summaries.some((s) => s.content === "February Week 5")).toBe(true);
    });

    it("should return empty array when no summaries in range", async () => {
      const summaries = await repository.getSummariesInDateRange("2000-01-01", "2000-12-31");
      expect(summaries).toEqual([]);
    });
  });

  describe("getSummaryCount", () => {
    it("should return total count of summaries", async () => {
      await repository.createSummary({
        content: "Summary 1",
        start_date: "2024-01-01",
        end_date: "2024-01-07",
        week_of_year: 1,
        iso_year: 2024,
      });

      await repository.createSummary({
        content: "Summary 2",
        start_date: "2024-01-08",
        end_date: "2024-01-14",
        week_of_year: 2,
        iso_year: 2024,
      });

      const count = await repository.getSummaryCount();
      expect(count).toBe(2);
    });

    it("should return 0 when no summaries exist", async () => {
      const count = await repository.getSummaryCount();
      expect(count).toBe(0);
    });
  });
});
