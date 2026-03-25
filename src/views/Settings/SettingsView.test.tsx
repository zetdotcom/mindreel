import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/tests/utils/testUtils";
import { SettingsView } from "./SettingsView";

const mockUpdatePopupInterval = vi.fn();
const mockUpdateHistoryGrouping = vi.fn();

const mockHistoryGrouping = {
  active_rule: {
    period_weeks: 1,
    start_weekday: 1,
    effective_start_date: "1970-01-05",
    created_at: "1970-01-05T00:00:00.000Z",
  },
  configured_rule: {
    period_weeks: 1,
    start_weekday: 1,
    effective_start_date: "1970-01-05",
    created_at: "1970-01-05T00:00:00.000Z",
  },
};

const mockUseSettings = vi.fn(() => ({
  settings: { popup_interval_minutes: 60 },
  historyGrouping: mockHistoryGrouping,
  loading: false,
  error: null,
  updatePopupInterval: mockUpdatePopupInterval,
  updateHistoryGrouping: mockUpdateHistoryGrouping,
}));

vi.mock("@/features/settings", () => ({
  useSettings: () => mockUseSettings(),
  PopupIntervalControl: ({
    value,
    onChange,
  }: {
    value: number;
    onChange: (minutes: number) => void;
  }) => (
    <div data-testid="popup-interval-control">
      <div data-testid="current-value">{value}</div>
      <button type="button" onClick={() => onChange(120)} data-testid="change-interval">
        Change to 120
      </button>
    </div>
  ),
  HistoryGroupingControl: ({
    onSave,
  }: {
    onSave: (input: { period_weeks: number; start_weekday: 1 | 2 | 3 | 4 | 5 | 6 | 7 }) => void;
  }) => (
    <div data-testid="history-grouping-control">
      <button
        type="button"
        onClick={() => onSave({ period_weeks: 2, start_weekday: 3 })}
        data-testid="change-history-grouping"
      >
        Change grouping
      </button>
    </div>
  ),
}));

vi.mock("@/components/ui/alert", () => ({
  Alert: ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
    <div data-testid="alert" data-variant={variant}>
      {children}
    </div>
  ),
}));

describe("SettingsView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSettings.mockReturnValue({
      settings: { popup_interval_minutes: 60 },
      historyGrouping: mockHistoryGrouping,
      loading: false,
      error: null,
      updatePopupInterval: mockUpdatePopupInterval,
      updateHistoryGrouping: mockUpdateHistoryGrouping,
    });
  });

  describe("Rendering", () => {
    it("should render settings page header", () => {
      render(<SettingsView />);

      expect(screen.getByText("Settings")).toBeInTheDocument();
      expect(screen.getByText("Configure your MindReel experience")).toBeInTheDocument();
    });

    it("should render all sections", () => {
      render(<SettingsView />);

      expect(screen.getByText("Capture")).toBeInTheDocument();
      expect(screen.getByText("History")).toBeInTheDocument();
    });

    it("should render PopupIntervalControl in Capture section", () => {
      render(<SettingsView />);

      expect(screen.getByTestId("popup-interval-control")).toBeInTheDocument();
      expect(screen.getByTestId("history-grouping-control")).toBeInTheDocument();
    });

    it("should display current popup interval value", () => {
      render(<SettingsView />);

      expect(screen.getByTestId("current-value")).toHaveTextContent("60");
    });
  });

  describe("Loading State", () => {
    it("should show loading message when settings are loading", () => {
      mockUseSettings.mockReturnValue({
        settings: null,
        historyGrouping: null,
        loading: true,
        error: null,
        updatePopupInterval: mockUpdatePopupInterval,
        updateHistoryGrouping: mockUpdateHistoryGrouping,
      });

      render(<SettingsView />);

      expect(screen.getByText("Loading settings...")).toBeInTheDocument();
      expect(screen.getByText("Loading history settings...")).toBeInTheDocument();
      expect(screen.queryByTestId("popup-interval-control")).not.toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should display error alert when there is an error", () => {
      mockUseSettings.mockReturnValue({
        settings: null,
        historyGrouping: null,
        loading: false,
        error: "Failed to load settings",
        updatePopupInterval: mockUpdatePopupInterval,
        updateHistoryGrouping: mockUpdateHistoryGrouping,
      });

      render(<SettingsView />);

      const alert = screen.getByTestId("alert");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveAttribute("data-variant", "destructive");
      expect(screen.getByText("Failed to load settings")).toBeInTheDocument();
    });
  });

  describe("Popup Interval Changes", () => {
    it("should update popup interval when changed", async () => {
      mockUpdatePopupInterval.mockResolvedValue(undefined);
      const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      render(<SettingsView />);

      const changeButton = screen.getByTestId("change-interval");
      changeButton.click();

      await vi.waitFor(() => {
        expect(mockUpdatePopupInterval).toHaveBeenCalledWith(120);
      });

      consoleLogSpy.mockRestore();
    });

    it("should handle update errors gracefully", async () => {
      const error = new Error("Update failed");
      mockUpdatePopupInterval.mockRejectedValue(error);
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      render(<SettingsView />);

      const changeButton = screen.getByTestId("change-interval");
      changeButton.click();

      await vi.waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to update popup interval:", error);
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe("History Grouping Changes", () => {
    it("should update history grouping when changed", async () => {
      mockUpdateHistoryGrouping.mockResolvedValue(undefined);

      render(<SettingsView />);

      screen.getByTestId("change-history-grouping").click();

      await vi.waitFor(() => {
        expect(mockUpdateHistoryGrouping).toHaveBeenCalledWith({
          period_weeks: 2,
          start_weekday: 3,
        });
      });
    });

    it("should handle history grouping update errors gracefully", async () => {
      const error = new Error("Grouping update failed");
      mockUpdateHistoryGrouping.mockRejectedValue(error);
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      render(<SettingsView />);

      screen.getByTestId("change-history-grouping").click();

      await vi.waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to update history grouping:", error);
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Layout", () => {
    it("should have proper layout classes", () => {
      const { container } = render(<SettingsView />);

      const main = container.querySelector("main.min-h-screen.bg-background");
      expect(main).toBeInTheDocument();
    });

    it("should display version in footer", () => {
      render(<SettingsView />);

      expect(screen.getByText("MindReel v1.0.0")).toBeInTheDocument();
    });
  });
});
