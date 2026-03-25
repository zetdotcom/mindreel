import sqlite3 from "sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { HistoryGroupingRepository } from "./historyGroupingRepository";

describe("HistoryGroupingRepository", () => {
  let db: sqlite3.Database;
  let repository: HistoryGroupingRepository;

  beforeEach(async () => {
    db = new sqlite3.Database(":memory:");
    repository = new HistoryGroupingRepository(db);

    await new Promise<void>((resolve, reject) => {
      db.run(
        `
          CREATE TABLE history_grouping_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            period_weeks INTEGER NOT NULL,
            start_weekday INTEGER NOT NULL,
            custom_name TEXT NULL,
            effective_start_date TEXT NOT NULL,
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

  it("initializes with the default weekly Monday rule", async () => {
    const rules = await repository.initializeDefaults();

    expect(rules).toHaveLength(1);
    expect(rules[0]).toMatchObject({
      period_weeks: 1,
      start_weekday: 1,
      custom_name: null,
      effective_start_date: "1970-01-05",
    });
  });

  it("returns default grouping settings when no custom rule exists", async () => {
    const settings = await repository.getGroupingSettings(new Date("2026-03-24T09:00:00Z"));

    expect(settings.active_rule.period_weeks).toBe(1);
    expect(settings.configured_rule.start_weekday).toBe(1);
    expect(settings.configured_rule.custom_name).toBeNull();
  });

  it("schedules a future rule on the next selected weekday", async () => {
    const settings = await repository.updateGrouping(
      { period_weeks: 2, start_weekday: 5 },
      new Date("2026-03-24T09:00:00Z"),
    );

    expect(settings.active_rule).toMatchObject({
      period_weeks: 1,
      start_weekday: 1,
    });
    expect(settings.configured_rule).toMatchObject({
      period_weeks: 2,
      start_weekday: 5,
      effective_start_date: "2026-03-27",
    });
  });

  it("starts immediately when the selected weekday is today", async () => {
    const settings = await repository.updateGrouping(
      { period_weeks: 2, start_weekday: 2 },
      new Date("2026-03-24T09:00:00Z"),
    );

    expect(settings.active_rule).toMatchObject({
      period_weeks: 2,
      start_weekday: 2,
      effective_start_date: "2026-03-24",
    });
    expect(settings.configured_rule.effective_start_date).toBe("2026-03-24");
  });

  it("stores a trimmed custom grouping name with the effective-dated rule", async () => {
    const settings = await repository.updateGrouping(
      { period_weeks: 2, start_weekday: 5, custom_name: "  Sprint Atlas  " },
      new Date("2026-03-24T09:00:00Z"),
    );

    expect(settings.configured_rule).toMatchObject({
      period_weeks: 2,
      start_weekday: 5,
      custom_name: "Sprint Atlas",
      effective_start_date: "2026-03-27",
    });
  });

  it("cancels a pending future change when switching back to the active rule", async () => {
    await repository.updateGrouping(
      { period_weeks: 2, start_weekday: 5 },
      new Date("2026-03-24T09:00:00Z"),
    );

    const reverted = await repository.updateGrouping(
      { period_weeks: 1, start_weekday: 1 },
      new Date("2026-03-25T09:00:00Z"),
    );

    expect(reverted.active_rule).toMatchObject({
      period_weeks: 1,
      start_weekday: 1,
      effective_start_date: "1970-01-05",
    });
    expect(reverted.configured_rule).toMatchObject({
      period_weeks: 1,
      start_weekday: 1,
      effective_start_date: "1970-01-05",
    });
  });
});
