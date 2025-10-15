import React, { useCallback, useEffect, useState } from "react";
import { HistoryView } from "@/features/history";
import {
  hasSeenOnboarding,
  setOnboardingSeen,
  OnboardingModal,
} from "@/features/onboarding";
import { openCaptureWindow } from "@/features/capture";

/**
 * HistoryPageView - Route-level component for the History page
 * Provides layout and orchestrates the HistoryView feature component
 * Includes onboarding modal integration and capture functionality
 */
export function HistoryPageView() {
  // --- Onboarding -------------------------------------------------------------
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSeenOnboarding()) {
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingConfirm = useCallback(() => {
    setOnboardingSeen();
    setShowOnboarding(false);
    // Trigger first capture popup after a brief delay
    setTimeout(() => {
      handleOpenCapturePopup();
    }, 120);
  }, []);

  // --- Utility: open capture popup -------------------------------------------
  const handleOpenCapturePopup = useCallback(async () => {
    try {
      await openCaptureWindow();
    } catch (e) {
      console.error("Failed to open capture window", e);
      setGlobalError("Unable to open capture window");
    }
  }, []);

  return (
    <>
      <OnboardingModal
        open={showOnboarding}
        onConfirm={handleOnboardingConfirm}
      />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-6 px-4">
          <HistoryView />
        </div>
      </div>
    </>
  );
}
