import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/tests/utils/testUtils";
import { HistoryPageView } from "./HistoryPageView";
import * as onboardingModule from "@/features/onboarding";
import * as captureModule from "@/features/capture";

vi.mock("@/features/onboarding", () => ({
  hasSeenOnboarding: vi.fn(),
  setOnboardingSeen: vi.fn(),
  OnboardingModal: ({ open, onConfirm }: { open: boolean; onConfirm: () => void }) =>
    open ? (
      <div data-testid="onboarding-modal">
        <button onClick={onConfirm} data-testid="confirm-onboarding">
          Confirm
        </button>
      </div>
    ) : null,
}));

vi.mock("@/features/capture", () => ({
  openCaptureWindow: vi.fn(),
}));

vi.mock("@/features/history", () => ({
  HistoryView: () => <div data-testid="history-view">History View</div>,
}));

describe("HistoryPageView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Onboarding", () => {
    it("should display onboarding modal on first launch", () => {
      vi.mocked(onboardingModule.hasSeenOnboarding).mockReturnValue(false);

      render(<HistoryPageView />);

      expect(screen.getByTestId("onboarding-modal")).toBeInTheDocument();
    });

    it("should not display onboarding modal if already seen", () => {
      vi.mocked(onboardingModule.hasSeenOnboarding).mockReturnValue(true);

      render(<HistoryPageView />);

      expect(screen.queryByTestId("onboarding-modal")).not.toBeInTheDocument();
    });

    it("should close onboarding modal and trigger capture popup after confirmation", async () => {
      vi.mocked(onboardingModule.hasSeenOnboarding).mockReturnValue(false);
      vi.mocked(captureModule.openCaptureWindow).mockResolvedValue();

      render(<HistoryPageView />);

      const confirmButton = screen.getByTestId("confirm-onboarding");
      confirmButton.click();

      await waitFor(() => {
        expect(onboardingModule.setOnboardingSeen).toHaveBeenCalled();
        expect(screen.queryByTestId("onboarding-modal")).not.toBeInTheDocument();
      });

      await waitFor(
        () => {
          expect(captureModule.openCaptureWindow).toHaveBeenCalled();
        },
        { timeout: 200 },
      );
    });
  });

  describe("Layout", () => {
    it("should render HistoryView component", () => {
      vi.mocked(onboardingModule.hasSeenOnboarding).mockReturnValue(true);

      render(<HistoryPageView />);

      expect(screen.getByTestId("history-view")).toBeInTheDocument();
    });

    it("should apply correct layout classes", () => {
      vi.mocked(onboardingModule.hasSeenOnboarding).mockReturnValue(true);

      const { container } = render(<HistoryPageView />);

      const layoutDiv = container.querySelector(".min-h-screen.bg-background");
      expect(layoutDiv).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should handle capture window open failure gracefully", async () => {
      vi.mocked(onboardingModule.hasSeenOnboarding).mockReturnValue(false);
      vi.mocked(captureModule.openCaptureWindow).mockRejectedValue(
        new Error("Failed to open window"),
      );

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      render(<HistoryPageView />);

      const confirmButton = screen.getByTestId("confirm-onboarding");
      confirmButton.click();

      await waitFor(
        () => {
          expect(consoleErrorSpy).toHaveBeenCalledWith(
            "Failed to open capture window",
            expect.any(Error),
          );
        },
        { timeout: 200 },
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
