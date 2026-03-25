import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { HistoryGroupingSettings } from "@/lib/historyGrouping";
import { render, screen } from "@/tests/utils/testUtils";
import { HistoryGroupingControl } from "./HistoryGroupingControl";

const historyGrouping: HistoryGroupingSettings = {
  active_rule: {
    period_weeks: 2,
    start_weekday: 3,
    custom_name: null,
    effective_start_date: "2026-03-25",
    created_at: "2026-03-25T09:00:00.000Z",
  },
  configured_rule: {
    period_weeks: 2,
    start_weekday: 3,
    custom_name: null,
    effective_start_date: "2026-03-25",
    created_at: "2026-03-25T09:00:00.000Z",
  },
};

describe("HistoryGroupingControl", () => {
  it("saves a trimmed custom group name", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(<HistoryGroupingControl value={historyGrouping} onSave={onSave} />);

    await user.type(screen.getByLabelText("Custom group name"), "  Sprint Atlas  ");
    await user.click(screen.getByRole("button", { name: "Save History Grouping" }));

    expect(onSave).toHaveBeenCalledWith({
      period_weeks: 2,
      start_weekday: 3,
      custom_name: "Sprint Atlas",
    });
  });
});
