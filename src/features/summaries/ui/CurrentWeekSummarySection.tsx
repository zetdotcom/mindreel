import type React from "react";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useCurrentWeekSummary } from "../model/useCurrentWeekSummary";

/**
 * CurrentWeekSummarySection
 *
 * Self-contained UI section that:
 *  - Loads (optionally auto) the current week's summary
 *  - Allows creating a new summary if one does not exist
 *  - Supports displaying recent summaries (future extension)
 *
 * The actual summary content building currently lives in the summaries repository
 * (simple bullet list). In future, an AI-powered generation step can replace that
 * without touching this component's surface.
 *
 * Design choices:
 *  - Hook is internal: parent doesn't need to orchestrate summary state unless desired.
 *  - Minimal presentational responsibilities; no routing or cross-feature logic.
 *  - Error message shown inline; creation errors surface to user via simple text.
 *
 * Possible future extensions (non-breaking):
 *  - Prop to disable creation (readOnly)
 *  - Prop to inject a custom "empty" renderer
 *  - Show recent summaries (toggle)
 *  - AI progress indicator / streaming output
 */

export interface CurrentWeekSummarySectionProps {
  /**
   * Auto load summary on mount (default true).
   */
  autoLoad?: boolean;
  /**
   * Show the "Generate Summary" button if no summary exists (default true).
   */
  allowCreate?: boolean;
  /**
   * Custom heading text (default "Current Week Summary").
   */
  heading?: string;
  /**
   * Override for empty state message.
   */
  emptyMessage?: string;
  /**
   * Whether to show a compact header layout (default false).
   */
  compact?: boolean;
  /**
   * Called after a summary is successfully created.
   */
  onCreated?: () => void;
  /**
   * If true, hides the surrounding section container (renders only inner content).
   */
  unstyled?: boolean;
}

export const CurrentWeekSummarySection: React.FC<CurrentWeekSummarySectionProps> = ({
  autoLoad = true,
  allowCreate = true,
  heading = "Current Week Summary",
  emptyMessage = "No summary for the current week yet.",
  compact = false,
  onCreated,
  unstyled = false,
}) => {
  const { summary, loading, creating, error, load, create, clearError } = useCurrentWeekSummary({
    autoLoad,
    onCreated: () => {
      onCreated?.();
    },
  });

  const handleCreate = useCallback(async () => {
    try {
      await create();
    } catch (err) {
      console.error("[handleCreate]::", err);
      // Error state already managed by hook; optionally could surface toast here.
    }
  }, [create]);

  const wrapperClass = unstyled ? "" : "bg-neutral-900 rounded-lg p-6 border border-neutral-800";

  return (
    <section
      className={wrapperClass}
      aria-labelledby="current-week-summary-heading"
      data-component="CurrentWeekSummarySection"
    >
      <div
        className={
          compact
            ? "flex items-center justify-between mb-3"
            : "flex items-center justify-between mb-4"
        }
      >
        <h2 id="current-week-summary-heading" className="text-xl font-semibold tracking-tight">
          {heading}
        </h2>
        <div className="flex items-center gap-2">
          {!summary && allowCreate && (
            <Button
              size="sm"
              variant="secondary"
              disabled={creating || loading}
              onClick={handleCreate}
            >
              {creating ? "Generating..." : "Generate Summary"}
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            disabled={loading || creating}
            aria-label="Refresh summary"
            onClick={() => load().catch((): void => void 0)}
          >
            <span className="material-symbols-rounded text-base">refresh</span>
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {loading && !summary && (
        <output aria-live="polite" className="text-sm text-neutral-400">
          Loading summary...
        </output>
      )}

      {/* Error state */}
      {error && (
        <div className="mb-4 rounded border border-red-600/40 bg-red-950/30 p-3 text-sm text-red-300">
          <div className="flex justify-between items-start gap-4">
            <p className="leading-snug break-words">
              {error === "SUMMARY_NO_ENTRIES_CURRENT_WEEK"
                ? "Cannot generate summary: there are no entries for the current week."
                : error}
            </p>
            <button
              type="button"
              onClick={clearError}
              className="text-red-400 hover:text-red-200 transition text-xs font-medium"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {summary ? (
        <div className="bg-neutral-800 border border-neutral-700/60 rounded p-4">
          <pre className="whitespace-pre-wrap text-sm text-neutral-200 font-sans leading-relaxed">
            {summary.content}
          </pre>
          <p className="text-[11px] uppercase tracking-wide text-neutral-500 mt-3">
            Created:{" "}
            {new Date(summary.created_at).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
      ) : (
        !loading && !creating && <p className="text-neutral-400 text-sm">{emptyMessage}</p>
      )}
    </section>
  );
};

export default CurrentWeekSummarySection;
