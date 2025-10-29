import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/tests/utils/testUtils";
import { CaptureWindowView } from "./CaptureWindowView";

const mockCreateEntry = vi.fn();

Object.defineProperty(globalThis, "window", {
  value: {
    ...globalThis.window,
    appApi: {
      db: {
        createEntry: mockCreateEntry,
      },
    },
  },
  writable: true,
});

vi.mock("@/features/capture", () => ({
  CapturePopup: ({
    onSave,
    onClose,
  }: {
    onSave: (content: string) => Promise<void>;
    onClose?: () => void;
  }) => (
    <div data-testid="capture-popup">
      <button
        onClick={() => {
          onSave("Test entry").catch(() => {
            // Errors are handled by parent
          });
        }}
        data-testid="save-button"
      >
        Save
      </button>
      <button onClick={() => onClose?.()} data-testid="close-button">
        Close
      </button>
    </div>
  ),
}));

describe("CaptureWindowView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render CapturePopup component", () => {
    render(<CaptureWindowView />);
    expect(screen.getByTestId("capture-popup")).toBeInTheDocument();
  });

  describe("Save Handling", () => {
    it("should save entry through database API", async () => {
      mockCreateEntry.mockResolvedValue({ id: 1 });

      render(<CaptureWindowView />);

      const saveButton = screen.getByTestId("save-button");
      saveButton.click();

      await vi.waitFor(() => {
        expect(mockCreateEntry).toHaveBeenCalledWith({ content: "Test entry" });
      });
    });

    it("should handle save errors and log them", async () => {
      const error = new Error("Database error");
      mockCreateEntry.mockRejectedValue(error);

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      render(<CaptureWindowView />);

      const saveButton = screen.getByTestId("save-button");
      saveButton.click();

      await vi.waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Failed to create entry from capture window:",
          error,
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Close Handling", () => {
    it("should log when capture window is closing", () => {
      const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      render(<CaptureWindowView />);

      const closeButton = screen.getByTestId("close-button");
      closeButton.click();

      expect(consoleLogSpy).toHaveBeenCalledWith("Capture window closing");

      consoleLogSpy.mockRestore();
    });
  });
});
