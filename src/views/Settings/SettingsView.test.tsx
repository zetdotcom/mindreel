import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/tests/utils/testUtils";
import { SettingsView } from "./SettingsView";

const mockUpdatePopupInterval = vi.fn();

const mockUseSettings = vi.fn(() => ({
  settings: { popup_interval_minutes: 60 },
  loading: false,
  error: null,
  updatePopupInterval: mockUpdatePopupInterval,
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
      <button onClick={() => onChange(120)} data-testid="change-interval">
        Change to 120
      </button>
    </div>
  ),
}));

vi.mock("@/components/ui/alert", () => ({
  Alert: ({
    children,
    variant,
  }: {
    children: React.ReactNode;
    variant?: string;
  }) => (
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
      loading: false,
      error: null,
      updatePopupInterval: mockUpdatePopupInterval,
    });
  });

  describe("Rendering", () => {
    it("should render settings page header", () => {
      render(<SettingsView />);

      expect(screen.getByText("Settings")).toBeInTheDocument();
      expect(
        screen.getByText("Configure your MindReel experience"),
      ).toBeInTheDocument();
    });

    it("should render all sections", () => {
      render(<SettingsView />);

      expect(screen.getByText("Capture")).toBeInTheDocument();
    });

    it("should render PopupIntervalControl in Capture section", () => {
      render(<SettingsView />);

      expect(screen.getByTestId("popup-interval-control")).toBeInTheDocument();
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
        loading: true,
        error: null,
        updatePopupInterval: mockUpdatePopupInterval,
      });

      render(<SettingsView />);

      expect(screen.getByText("Loading settings...")).toBeInTheDocument();
      expect(
        screen.queryByTestId("popup-interval-control"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should display error alert when there is an error", () => {
      mockUseSettings.mockReturnValue({
        settings: null,
        loading: false,
        error: "Failed to load settings",
        updatePopupInterval: mockUpdatePopupInterval,
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
      const consoleLogSpy = vi
        .spyOn(console, "log")
        .mockImplementation(() => {});

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
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      render(<SettingsView />);

      const changeButton = screen.getByTestId("change-interval");
      changeButton.click();

      await vi.waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Failed to update popup interval:",
          error,
        );
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
