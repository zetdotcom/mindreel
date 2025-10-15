import React, { useCallback } from "react";
import { CapturePopup } from "@/features/capture";

/**
 * CaptureWindowView
 *
 * Entry point for the capture popup window.
 * This view wraps the CapturePopup component and handles:
 *  - Entry creation via IPC
 *  - Window lifecycle management
 *
 * Responsibilities:
 *  - Compose the capture feature for standalone window usage
 *  - Handle save operation through database API
 *  - Manage window-level error states
 */
export function CaptureWindowView() {
  const handleSave = useCallback(async (content: string) => {
    try {
      await window.appApi.db.createEntry({ content });
    } catch (error) {
      console.error("Failed to create entry from capture window:", error);
      throw error; // Re-throw to let CapturePopup handle the error state
    }
  }, []);

  const handleClose = useCallback(() => {
    // Optional: cleanup or analytics before close
    console.log("Capture window closing");
  }, []);

  return (
    <CapturePopup
      onSave={handleSave}
      onClose={handleClose}
    />
  );
}

export default CaptureWindowView;
