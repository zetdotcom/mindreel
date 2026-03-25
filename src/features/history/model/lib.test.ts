import { describe, expect, it } from "vitest";
import { transformWeekData } from "./lib";
import type { RawWeekData } from "./types";

const baseRawWeek: RawWeekData = {
  weekKey: "2026-03-25:2026-04-07",
  start_date: "2026-03-25",
  end_date: "2026-04-07",
  custom_name: null,
  period_weeks: 2,
  start_weekday: 3,
  effective_start_date: "2026-03-25",
  entries: [],
};

describe("transformWeekData", () => {
  it("shows explicit start and end dates for cross-month history periods", () => {
    const week = transformWeekData(baseRawWeek);

    expect(week.headerLabel).toBe("Mar 25 - Apr 7, 2026");
    expect(week.groupingLabel).toBe("2 weeks, starts Wednesday");
  });

  it("uses the custom grouping name as the title while keeping the date range visible", () => {
    const week = transformWeekData({
      ...baseRawWeek,
      custom_name: "Sprint Atlas",
    });

    expect(week.headerLabel).toBe("Sprint Atlas");
    expect(week.groupingLabel).toBe("Mar 25 - Apr 7, 2026 • 2 weeks, starts Wednesday");
  });
});
