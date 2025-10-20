import React from "react";
import { useHistoryState } from "../model/useHistoryState";
import { WeekGroup } from "./WeekGroup";
import { HistoryHeader } from "./HistoryHeader";
import { PaginationControl } from "./PaginationControl";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import { ToastArea } from "./ToastArea";
import { openCaptureWindow } from "@/features/capture";
import { useAuthContext } from "@/features/auth";

/**
 * Main History View component
 * Displays chronological history of entries grouped by ISO weeks
 */
export function HistoryView() {
  const {
    weeks,
    loading,
    error,
    pagination,
    deleteModal,
    toasts,
    loadMoreWeeks,
    refreshWeeks,
    toggleWeekCollapsed,
    showDeleteModal,
    hideDeleteModal,
    updateWeek,
    addToast,
    removeToast,
  } = useHistoryState();

  const { authenticated, openAuthModal } = useAuthContext();

  const displayWeeks = React.useMemo(() => {
    if (authenticated) return weeks;
    return weeks.map((week) => {
      if (
        !authenticated &&
        week.summaryState === "pending" &&
        week.totalEntries > 0 &&
        !week.summary
      ) {
        return { ...week, summaryState: "unauthorized" as const };
      }
      return week;
    });
  }, [weeks, authenticated]);

  // Handle add entry action
  const handleAddEntry = async () => {
    try {
      await openCaptureWindow();
    } catch (error) {
      console.error("Failed to open capture window:", error);
      addToast({
        type: "error",
        text: "Failed to open capture window. Please try again.",
      });
    }
  };

  if (loading && weeks.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <p className="text-sm text-muted-foreground">Loading your history...</p>
      </div>
    );
  }

  if (error && weeks.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-medium text-foreground mb-2">Failed to Load History</h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button
            onClick={refreshWeeks}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!loading && weeks.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-medium text-foreground mb-2">No History Yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Start capturing your daily work to build your history.
          </p>
          <HistoryHeader
            showAddButton={true}
            onRefresh={refreshWeeks}
            onAddEntry={handleAddEntry}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <HistoryHeader showAddButton={true} onRefresh={refreshWeeks} onAddEntry={handleAddEntry} />
      {/* Error Banner */}
      {error && weeks.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-destructive">Error Loading History</h4>
              <p className="text-sm text-destructive/80 mt-1">{error}</p>
            </div>
            <button
              onClick={refreshWeeks}
              className="text-sm text-destructive hover:text-destructive/80 underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      {/* Weeks Container */}
      <div className="space-y-8">
        {displayWeeks.map((week) => (
          <WeekGroup
            key={week.weekKey}
            week={week}
            onToggleCollapsed={() => toggleWeekCollapsed(week.weekKey)}
            onEntryEdit={(entryId, content) => {
              // Entry edit will be handled by individual EntryRow components
              // This is for coordination if needed
            }}
            onEntryDelete={(entryId) => showDeleteModal(entryId)}
            onSummaryUpdate={(summaryId, content) => {
              // Summary update will be handled by SummaryCard
              // This is for coordination if needed
            }}
            onWeekUpdate={(updates) => updateWeek(week.weekKey, updates)}
            onLoginRequest={() => openAuthModal("login")}
          />
        ))}
      </div>
      {/* Pagination */}
      <PaginationControl
        loading={pagination.loading}
        hasMore={pagination.hasMore}
        onLoadMore={loadMoreWeeks}
        loadedCount={weeks.length}
      />
      {/* Global Modals and Notifications */}
      <DeleteConfirmationModal
        open={deleteModal.open}
        entryId={deleteModal.entryId}
        onConfirm={async (entryId) => {
          try {
            // This will be handled by the delete hook
            hideDeleteModal();
            addToast({
              type: "success",
              text: "Entry deleted successfully.",
            });
          } catch (error) {
            addToast({
              type: "error",
              text: "Failed to delete entry. Please try again.",
            });
          }
        }}
        onCancel={hideDeleteModal}
      />
      <ToastArea toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
}
