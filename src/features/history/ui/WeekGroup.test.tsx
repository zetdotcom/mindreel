import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@/tests/utils/testUtils";
import type { WeekGroupViewModel } from "../model/types";
import { WeekGroup } from "./WeekGroup";

const baseWeek: WeekGroupViewModel = {
  weekKey: "2026-03-16_2026-03-22",
  start_date: "2026-03-16",
  end_date: "2026-03-22",
  custom_name: null,
  headerLabel: "Mar 16 - Mar 22, 2026",
  groupingLabel: "Weekly",
  period_weeks: 1,
  start_weekday: 1,
  effective_start_date: "2026-03-16",
  daysCollapsed: false,
  summaryCollapsed: false,
  totalEntries: 1,
  orderIndex: 0,
  days: [
    {
      date: "2026-03-18",
      weekdayLabel: "Wednesday",
      headerLabel: "Wednesday, Mar 18",
      totalEntries: 1,
      weekKey: "2026-03-16_2026-03-22",
      collapsed: false,
      items: [
        {
          id: 1,
          content: "Worked on collapse controls",
          date: "2026-03-18",
          week_of_year: 12,
          iso_year: 2026,
          created_at: "2026-03-18T09:30:00.000Z",
          isEditing: false,
          isSaving: false,
          dayKey: "2026-03-18",
        },
      ],
    },
  ],
  summaryState: "success",
  summary: {
    id: 2,
    content: "Shipped separate collapse controls for days and summary.",
    start_date: "2026-03-16",
    end_date: "2026-03-22",
    week_of_year: 12,
    iso_year: 2026,
    created_at: "2026-03-22T21:00:00.000Z",
    isEditing: false,
    isSaving: false,
    draftContent: "Shipped separate collapse controls for days and summary.",
    state: "success",
    weekKey: "2026-03-16_2026-03-22",
  },
};

function WeekGroupHarness() {
  const [week, setWeek] = React.useState(baseWeek);

  return (
    <WeekGroup
      week={week}
      onToggleDaysCollapsed={() =>
        setWeek((current) => ({ ...current, daysCollapsed: !current.daysCollapsed }))
      }
      onWeekUpdate={(updates) =>
        setWeek((current) => ({
          ...current,
          ...updates,
        }))
      }
    />
  );
}

describe("WeekGroup", () => {
  it("keeps the summary visible when the group days are collapsed", async () => {
    const user = userEvent.setup();

    render(<WeekGroupHarness />);

    expect(screen.getByText("Wednesday, Mar 18")).toBeInTheDocument();
    expect(
      screen.getByText("Shipped separate collapse controls for days and summary."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Collapse days" }));

    expect(screen.queryByText("Wednesday, Mar 18")).not.toBeInTheDocument();
    expect(screen.getByText("1 entries across 1 days")).toBeInTheDocument();
    expect(
      screen.getByText("Shipped separate collapse controls for days and summary."),
    ).toBeInTheDocument();
  });

  it("collapses the summary independently from the day list", async () => {
    const user = userEvent.setup();

    render(<WeekGroupHarness />);

    expect(
      screen.getByText("Shipped separate collapse controls for days and summary."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Collapse summary" }));

    expect(
      screen.queryByText("Shipped separate collapse controls for days and summary."),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Wednesday, Mar 18")).toBeInTheDocument();
    expect(screen.getByText("Period Summary")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Expand summary" }));

    expect(
      screen.getByText("Shipped separate collapse controls for days and summary."),
    ).toBeInTheDocument();
  });
});
