import React, { useState, useEffect, useCallback } from "react";
import type { Entry, Summary, Settings } from "../sqlite/types";
import { Button } from "@/components/ui/button";

// Custom hook for managing entries
const useEntries = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTodayEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const todayEntries = await window.appApi.db.getTodayEntries();
      setEntries(todayEntries);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load entries";
      setError(message);
      console.error("Failed to load today entries:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createEntry = useCallback(async (content: string) => {
    try {
      const newEntry = await window.appApi.db.createEntry({ content });
      // Optimistic update - add immediately to UI
      setEntries((prev) => [...prev, newEntry]);
      return newEntry;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create entry";
      setError(message);
      console.error("Failed to create entry:", err);
      throw err;
    }
  }, []);

  const deleteEntry = useCallback(async (id: number) => {
    try {
      const deleted = await window.appApi.db.deleteEntry(id);
      if (deleted) {
        // Optimistic update - remove immediately from UI
        setEntries((prev) => prev.filter((entry) => entry.id !== id));
      }
      return deleted;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete entry";
      setError(message);
      console.error("Failed to delete entry:", err);
      return false;
    }
  }, []);

  return {
    entries,
    loading,
    error,
    loadTodayEntries,
    createEntry,
    deleteEntry,
  };
};

// Custom hook for managing dashboard data
const useDashboard = () => {
  const [dashboardData, setDashboardData] = useState<{
    currentWeekSummary: Summary | null;
    recentSummaries: Summary[];
    settings: Settings | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await window.appApi.db.getDashboardData();
      setDashboardData({
        currentWeekSummary: data.currentWeekSummary,
        recentSummaries: data.recentSummaries || [],
        settings: data.settings,
      });
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createWeekSummary = useCallback(async () => {
    try {
      const weekInfo = await window.appApi.db.getCurrentWeekInfo();
      const weekEntries = await window.appApi.db.getCurrentWeekEntries();

      if (weekEntries.length === 0) {
        throw new Error("No entries found for current week");
      }

      const summaryContent = `Week ${weekInfo.week_of_year} Summary (${weekInfo.start_date} to ${weekInfo.end_date}):\n\n${weekEntries.map((entry) => `• ${entry.content}`).join("\n")}`;

      const newSummary =
        await window.appApi.db.createCurrentWeekSummary(summaryContent);

      // Update local state immediately
      setDashboardData((prev) =>
        prev
          ? {
              ...prev,
              currentWeekSummary: newSummary,
              recentSummaries: [newSummary, ...prev.recentSummaries].slice(
                0,
                5,
              ),
            }
          : null,
      );

      return newSummary;
    } catch (error) {
      console.error("Failed to create week summary:", error);
      throw error;
    }
  }, []);

  return {
    dashboardData,
    loading,
    loadDashboardData,
    createWeekSummary,
  };
};

// Skeleton loading component for entries
const EntrySkeleton = () => (
  <div className="bg-neutral-800 p-4 rounded animate-pulse">
    <div className="h-4 bg-neutral-700 rounded w-3/4 mb-2"></div>
    <div className="h-3 bg-neutral-700 rounded w-1/4"></div>
  </div>
);

// Entry form component
const EntryForm = ({
  onSubmit,
  loading,
}: {
  onSubmit: (content: string) => Promise<void>;
  loading: boolean;
}) => {
  const [entryText, setEntryText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!entryText.trim() || submitting) return;

    try {
      setSubmitting(true);
      await onSubmit(entryText);
      setEntryText("");
    } catch (error) {
      // Error is handled by the parent component
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <section className="bg-neutral-900 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Create New Entry</h2>
      <div className="flex gap-4">
        <input
          type="text"
          value={entryText}
          onChange={(e) => setEntryText(e.target.value)}
          placeholder="What are you working on?"
          className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-600 rounded text-white placeholder-neutral-400 focus:outline-none focus:border-blue-500"
          onKeyPress={handleKeyPress}
          disabled={submitting || loading}
        />
        <button
          onClick={handleSubmit}
          disabled={submitting || loading || !entryText.trim()}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-700 disabled:cursor-not-allowed rounded font-medium transition"
        >
          {submitting ? "Adding..." : "Add Entry"}
        </button>
      </div>
    </section>
  );
};

// Entry list component
const EntryList = ({
  entries,
  loading,
  onDelete,
}: {
  entries: Entry[];
  loading: boolean;
  onDelete: (id: number) => Promise<void>;
}) => {
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  const handleDelete = async (id: number) => {
    setDeletingIds((prev) => new Set([...prev, id]));
    try {
      await onDelete(id);
    } finally {
      setDeletingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <section className="bg-neutral-900 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Today's Entries</h2>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <EntrySkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="bg-neutral-900 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">
        Today's Entries ({entries.length})
      </h2>
      {entries.length === 0 ? (
        <p className="text-neutral-400">No entries for today yet.</p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start justify-between bg-neutral-800 p-4 rounded"
            >
              <div className="flex-1">
                <p className="text-white">{entry.content}</p>
                <p className="text-sm text-neutral-400 mt-1">
                  {new Date(entry.created_at).toLocaleTimeString()}
                </p>
              </div>
              <button
                onClick={() => entry.id && handleDelete(entry.id)}
                disabled={entry.id ? deletingIds.has(entry.id) : false}
                className="ml-4 px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-neutral-600 disabled:cursor-not-allowed rounded text-sm font-medium transition"
              >
                {entry.id && deletingIds.has(entry.id)
                  ? "Deleting..."
                  : "Delete"}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

// Week summary component
const WeekSummarySection = ({
  summary,
  onCreateSummary,
}: {
  summary: Summary | null;
  onCreateSummary: () => Promise<void>;
}) => {
  const [creating, setCreating] = useState(false);

  const handleCreateSummary = async () => {
    try {
      setCreating(true);
      await onCreateSummary();
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className="bg-neutral-900 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Current Week Summary</h2>
        {!summary && (
          <Button
            variant="secondary"
            onClick={handleCreateSummary}
            disabled={creating}
          >
            {creating ? "Generating..." : "Generate Summary"}
          </Button>
        )}
      </div>
      {summary ? (
        <div className="bg-neutral-800 p-4 rounded">
          <pre className="text-sm text-neutral-200 whitespace-pre-wrap">
            {summary.content}
          </pre>
          <p className="text-xs text-neutral-400 mt-2">
            Created: {new Date(summary.created_at).toLocaleString()}
          </p>
        </div>
      ) : (
        <p className="text-neutral-400">No summary for current week yet.</p>
      )}
    </section>
  );
};

// Error display component
const ErrorDisplay = ({
  error,
  onDismiss,
}: {
  error: string;
  onDismiss: () => void;
}) => (
  <div className="bg-red-900/50 border border-red-600 rounded-lg p-4 mb-6">
    <div className="flex items-center justify-between">
      <p className="text-red-200">{error}</p>
      <button
        onClick={onDismiss}
        className="text-red-400 hover:text-red-200 ml-4"
      >
        ✕
      </button>
    </div>
  </div>
);

// Main App component
export function App() {
  const {
    entries,
    loading: entriesLoading,
    error: entriesError,
    loadTodayEntries,
    createEntry,
    deleteEntry,
  } = useEntries();

  const {
    dashboardData,
    loading: dashboardLoading,
    loadDashboardData,
    createWeekSummary,
  } = useDashboard();

  const [globalError, setGlobalError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await Promise.all([loadTodayEntries(), loadDashboardData()]);
      } catch (error) {
        console.error("Failed to initialize app:", error);
        setGlobalError("Failed to load application data");
      }
    };

    initializeApp();
  }, [loadTodayEntries, loadDashboardData]);

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

  const showDatabasePath = async () => {
    try {
      const path = await window.appApi.db.getDatabasePath();
      alert(`Database location: ${path}`);
    } catch (error) {
      console.error("Failed to get database path:", error);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-neutral-950 text-neutral-100 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2">MindReel</h1>
          <p className="text-neutral-400">Your personal productivity journal</p>
        </header>

        {/* Global Error Display */}
        {globalError && (
          <ErrorDisplay
            error={globalError}
            onDismiss={() => setGlobalError(null)}
          />
        )}

        {/* Entries Error Display */}
        {entriesError && (
          <ErrorDisplay
            error={entriesError}
            onDismiss={() => setGlobalError(null)}
          />
        )}

        {/* Global Loading Indicator */}
        {(entriesLoading || dashboardLoading) && (
          <div className="text-center text-blue-400 py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
            <span className="ml-2">Loading...</span>
          </div>
        )}

        <EntryForm onSubmit={handleCreateEntry} loading={entriesLoading} />

        <EntryList
          entries={entries}
          loading={entriesLoading}
          onDelete={handleDeleteEntry}
        />

        <WeekSummarySection
          summary={dashboardData?.currentWeekSummary || null}
          onCreateSummary={createWeekSummary}
        />

        {/* Recent Summaries */}
        {dashboardData?.recentSummaries &&
          dashboardData.recentSummaries.length > 0 && (
            <section className="bg-neutral-900 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Summaries</h2>
              <div className="space-y-3">
                {dashboardData.recentSummaries.map((summary) => (
                  <div key={summary.id} className="bg-neutral-800 p-4 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">
                        Week {summary.week_of_year}
                      </h3>
                      <span className="text-sm text-neutral-400">
                        {summary.start_date} to {summary.end_date}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-300 line-clamp-3">
                      {summary.content.split("\n")[0]}...
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

        {/* Settings */}
        {dashboardData?.settings && (
          <section className="bg-neutral-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Settings</h2>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-neutral-400">Popup Interval:</span>{" "}
                {dashboardData.settings.popup_interval_minutes} minutes
              </p>
              <p>
                <span className="text-neutral-400">Global Shortcut:</span>{" "}
                {dashboardData.settings.global_shortcut || "Not set"}
              </p>
            </div>
          </section>
        )}

        {/* Database Info */}
        <section className="bg-neutral-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Database Info</h2>
          <button
            onClick={showDatabasePath}
            className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded font-medium transition"
          >
            Show Database Path
          </button>
        </section>
      </div>
    </main>
  );
}
