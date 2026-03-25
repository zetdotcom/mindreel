import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentWeekRange, getPreviousIsoWeek } from "../../../sqlite/dateUtils";
import { HistoryRepository } from "./repository";

describe("HistoryRepository", () => {
  const getEntriesForIsoWeek = vi.fn();
  const getSummaryForIsoWeek = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-03-19T12:00:00Z"));

    Object.defineProperty(globalThis.window, "appApi", {
      configurable: true,
      writable: true,
      value: {
        db: {
          getEntriesForIsoWeek,
          getSummaryForIsoWeek,
        },
      },
    });

    getEntriesForIsoWeek.mockResolvedValue([]);
    getSummaryForIsoWeek.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("loads the latest four weeks by default", async () => {
    const repository = new HistoryRepository();

    const result = await repository.loadWeeks();

    const currentWeekRange = getCurrentWeekRange();
    const currentWeek = {
      iso_year: currentWeekRange.iso_year,
      week_of_year: currentWeekRange.week_of_year,
    };
    const previousWeek = getPreviousIsoWeek(currentWeek);
    const twoWeeksAgo = getPreviousIsoWeek(previousWeek);
    const threeWeeksAgo = getPreviousIsoWeek(twoWeeksAgo);
    const fourWeeksAgo = getPreviousIsoWeek(threeWeeksAgo);

    expect(result.rawWeeks).toHaveLength(4);
    expect(
      result.rawWeeks.map(({ iso_year, week_of_year }) => ({
        iso_year,
        week_of_year,
      })),
    ).toEqual([currentWeek, previousWeek, twoWeeksAgo, threeWeeksAgo]);
    expect(result.hasMore).toBe(false);
    expect(getEntriesForIsoWeek).toHaveBeenCalledTimes(5);
    expect(getSummaryForIsoWeek).toHaveBeenCalledTimes(4);
    expect(getEntriesForIsoWeek).toHaveBeenNthCalledWith(
      5,
      fourWeeksAgo.iso_year,
      fourWeeksAgo.week_of_year,
    );
  });
});
