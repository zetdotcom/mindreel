import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentWeekRange, getPreviousIsoWeek, getWeekRange } from "../../../sqlite/dateUtils";
import { HistoryRepository } from "./repository";

describe("HistoryRepository", () => {
  const getEntriesForDateRange = vi.fn();
  const getHistoryGroupingRules = vi.fn();
  const getDatesWithEntries = vi.fn();
  const getAllSummaries = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-03-19T12:00:00Z"));

    Object.defineProperty(globalThis.window, "appApi", {
      configurable: true,
      writable: true,
      value: {
        db: {
          getEntriesForDateRange,
          getHistoryGroupingRules,
          getDatesWithEntries,
          getAllSummaries,
        },
      },
    });

    getEntriesForDateRange.mockResolvedValue([]);
    getAllSummaries.mockResolvedValue([]);
    getHistoryGroupingRules.mockResolvedValue([
      {
        period_weeks: 1,
        start_weekday: 1,
        custom_name: null,
        effective_start_date: "1970-01-05",
        created_at: "1970-01-05T00:00:00.000Z",
      },
    ]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("loads the latest four weeks by default", async () => {
    const repository = new HistoryRepository();
    const currentWeekRange = getCurrentWeekRange();
    const currentWeek = {
      iso_year: currentWeekRange.iso_year,
      week_of_year: currentWeekRange.week_of_year,
    };
    const previousWeek = getPreviousIsoWeek(currentWeek);
    const twoWeeksAgo = getPreviousIsoWeek(previousWeek);
    const threeWeeksAgo = getPreviousIsoWeek(twoWeeksAgo);
    const fourWeeksAgo = getPreviousIsoWeek(threeWeeksAgo);
    const previousWeekRange = getWeekRange(previousWeek.week_of_year, previousWeek.iso_year);
    const twoWeeksAgoRange = getWeekRange(twoWeeksAgo.week_of_year, twoWeeksAgo.iso_year);
    const threeWeeksAgoRange = getWeekRange(threeWeeksAgo.week_of_year, threeWeeksAgo.iso_year);
    const fourWeeksAgoRange = getWeekRange(fourWeeksAgo.week_of_year, fourWeeksAgo.iso_year);

    getDatesWithEntries.mockResolvedValue([
      currentWeekRange.start_date,
      previousWeekRange.start_date,
      twoWeeksAgoRange.start_date,
      threeWeeksAgoRange.start_date,
      fourWeeksAgoRange.start_date,
    ]);

    const result = await repository.loadWeeks();

    expect(result.rawWeeks).toHaveLength(4);
    expect(
      result.rawWeeks.map(({ start_date, end_date }) => ({
        start_date,
        end_date,
      })),
    ).toEqual([
      {
        start_date: currentWeekRange.start_date,
        end_date: currentWeekRange.end_date,
      },
      previousWeekRange,
      twoWeeksAgoRange,
      threeWeeksAgoRange,
    ]);
    expect(result.hasMore).toBe(true);
    expect(getHistoryGroupingRules).toHaveBeenCalledTimes(1);
    expect(getDatesWithEntries).toHaveBeenCalledTimes(1);
    expect(getAllSummaries).toHaveBeenCalledTimes(1);
    expect(getEntriesForDateRange).toHaveBeenCalledTimes(4);
    expect(getEntriesForDateRange).toHaveBeenNthCalledWith(
      4,
      threeWeeksAgoRange.start_date,
      threeWeeksAgoRange.end_date,
    );
  });

  it("keeps the full configured end date for an in-progress multi-week period", async () => {
    vi.setSystemTime(new Date("2026-03-25T12:00:00Z"));

    getHistoryGroupingRules.mockResolvedValue([
      {
        period_weeks: 2,
        start_weekday: 3,
        custom_name: "Sprint Atlas",
        effective_start_date: "2026-03-25",
        created_at: "2026-03-25T00:00:00.000Z",
      },
    ]);
    getDatesWithEntries.mockResolvedValue(["2026-03-25"]);

    const repository = new HistoryRepository();
    const result = await repository.loadWeeks();

    expect(result.rawWeeks).toHaveLength(1);
    expect(result.rawWeeks[0]).toMatchObject({
      start_date: "2026-03-25",
      end_date: "2026-04-07",
      custom_name: "Sprint Atlas",
      period_weeks: 2,
      start_weekday: 3,
    });
    expect(getEntriesForDateRange).toHaveBeenCalledWith("2026-03-25", "2026-04-07");
  });
});
