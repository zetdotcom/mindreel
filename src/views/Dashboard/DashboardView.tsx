import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { openCaptureWindow } from "@/features/capture";
import { useEntries } from "@/features/entries/model/useEntries";
import { EntryForm } from "@/features/entries/ui/EntryForm";
import { EntryList } from "@/features/entries/ui/EntryList";
import { OnboardingModal } from "@/features/onboarding";
import { hasSeenOnboarding, setOnboardingSeen } from "@/features/onboarding/model/onboardingState";
import { CurrentWeekSummarySection } from "@/features/summaries/ui/CurrentWeekSummarySection";
import { ErrorDisplay } from "@/shared/ui/ErrorDisplay";

/**
 * DashboardView
 *
 * Primary application view composing:
 *  - Onboarding (first‑run modal)
 *  - Entry creation & listing (today)
 *  - Current week summary (with generation)
 *  - Recent / meta sections (database info, settings placeholder)
 *
 * Responsibilities:
 *  - High-level orchestration of feature components
 *  - Local UI-level error handling (non-fatal)
 *  - Minimal layout & styling
 *
 * What it intentionally does NOT do:
 *  - Direct IPC calls (delegated to feature repositories/hooks)
 *  - Embed domain logic (lives inside features//model or repository)
 *  - Maintain long-lived timers or background processes (future “processes” layer)
 */
export function DashboardView() {
  // --- Onboarding -------------------------------------------------------------
  const [showOnboarding, setShowOnboarding] = useState(false);
  useEffect(() => {
    if (!hasSeenOnboarding()) {
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingConfirm = useCallback(() => {
    setOnboardingSeen();
    setShowOnboarding(false);
    // Future: trigger capture popup (window.appApi.capture.openCapturePopup?)
  }, []);

  // --- Entries (today) --------------------------------------------------------
  const {
    entries,
    loading: entriesLoading,
    error: entriesError,
    createEntry,
    deleteEntry,
  } = useEntries(); // autoLoad today by default

  // --- Global error channel (for cross-feature initialization issues) ---------
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Example: central place to aggregate future startup tasks:
  // useEffect(() => {
  //   (async () => {
  //     try {
  //       await Promise.all([/* additional initial loads */]);
  //     } catch (e) {
  //       setGlobalError("Failed to initialize application context");
  //       console.error(e);
  //     }
  //   })();
  // }, []);

  // --- Handlers ---------------------------------------------------------------
  const handleCreateEntry = useCallback(
    async (content: string) => {
      await createEntry(content);
    },
    [createEntry],
  );

  const handleDeleteEntry = useCallback(
    async (id: number) => {
      await deleteEntry(id);
    },
    [deleteEntry],
  );

  const handleDismissError = useCallback(() => setGlobalError(null), []);

  // --- Utility: open capture popup -------------------------------------------
  const handleOpenCapturePopup = useCallback(async () => {
    try {
      await openCaptureWindow();
    } catch (e) {
      console.error("Failed to open capture window", e);
      setGlobalError("Unable to open capture window");
    }
  }, []);

  // --- Utility: show database path (debug) ------------------------------------
  const showDatabasePath = useCallback(async () => {
    try {
      const path = await (window as any).appApi?.db?.getDatabasePath();
      if (path) {
        alert(`Database location:\n${path}`);
      }
    } catch (e) {
      console.error("Failed to get database path", e);
      setGlobalError("Unable to fetch database path");
    }
  }, []);

  // --- Render -----------------------------------------------------------------
  return (
    <>
      <OnboardingModal open={showOnboarding} onConfirm={handleOnboardingConfirm} />

      <main className="min-h-screen p-8 bg-neutral-950 text-neutral-100 font-sans">
        <div className="max-w-4xl mx-auto space-y-8">
          <header className="text-center space-y-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">MindReel sss</h1>
              <p className="text-neutral-400 text-sm">Your personal productivity journal x x</p>
            </div>
            <div>
              <Button
                onClick={handleOpenCapturePopup}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
              >
                + Add Entry
              </Button>
            </div>
          </header>

          {/* Global error (cross-feature) */}
          {globalError && (
            <ErrorDisplay error={globalError} onDismiss={handleDismissError} variant="solid" />
          )}

          {/* Entries domain error */}
          {entriesError && (
            <ErrorDisplay
              error={entriesError}
              onDismiss={() => {
                // Keep globalError separate; clearing only entriesError
                // (entriesError is internal to useEntries; would require hook changes to clear)
                // For now we just also clear global to not confuse user.
                handleDismissError();
              }}
              variant="subtle"
            />
          )}

          <EntryForm
            onSubmit={handleCreateEntry}
            loading={entriesLoading}
            onError={(e) => {
              console.error("Create entry failed:", e);
            }}
          />

          <EntryList entries={entries} loading={entriesLoading} onDelete={handleDeleteEntry} />

          <CurrentWeekSummarySection
            heading="Current Week Summary"
            allowCreate
            autoLoad
            onCreated={() => {
              // Potential analytics hook
            }}
          />

          {/* Settings (placeholder section) */}
          <section className="bg-neutral-900 rounded-lg p-6 border border-neutral-800">
            <h2 className="text-xl font-semibold mb-4">Settings (Preview)</h2>
            <p className="text-neutral-400 text-sm">
              Settings management feature not yet extracted. Future: popup interval, global
              shortcut.
            </p>
          </section>

          {/* Database Info (debug) */}
          <section className="bg-neutral-900 rounded-lg p-6 border border-neutral-800">
            <h2 className="text-xl font-semibold mb-4">Database Info</h2>
            <Button variant="secondary" size="sm" onClick={showDatabasePath}>
              Show Database Path
            </Button>
          </section>
        </div>
      </main>
    </>
  );
}

export default DashboardView;
