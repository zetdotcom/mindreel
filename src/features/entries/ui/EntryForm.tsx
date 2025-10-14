import React, { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * EntryForm
 *
 * Presentational component for creating a new work log entry.
 * Responsibilities:
 *  - Manage local input state
 *  - Basic validation (non‑empty after trim)
 *  - Provide UX affordances (Enter to submit, disabled while submitting)
 *
 * It deliberately does NOT:
 *  - Own list state
 *  - Perform IPC directly
 *  - Contain domain formatting logic
 *
 * This keeps it reusable across views (e.g. dashboard, popup capture window).
 */
export interface EntryFormProps {
  /**
   * Callback invoked with trimmed content.
   * May return a promise; component will show submitting state until it resolves/rejects.
   */
  onSubmit: (content: string) => Promise<unknown> | unknown;
  /**
   * External loading flag (e.g. while initial data loads).
   * Combined with internal submitting state for the disabled UI state.
   */
  loading?: boolean;
  /**
   * Auto focus the input on mount (default true).
   */
  autoFocus?: boolean;
  /**
   * Optional placeholder override.
   */
  placeholder?: string;
  /**
   * Called after a successful submit (before input is cleared).
   */
  onSuccess?: () => void;
  /**
   * Called if submit fails (receives the error).
   */
  onError?: (error: unknown) => void;
  /**
   * If true, clears the input only on success (default true).
   */
  clearOnSuccess?: boolean;
  /**
   * If true, pressing Enter submits even if Shift is held (default false).
   * Kept for future multiline adaptation (switch to textarea).
   */
  forceSubmitOnShiftEnter?: boolean;
  /**
   * Class name overrides for the wrapper section.
   */
  className?: string;
}

export const EntryForm: React.FC<EntryFormProps> = ({
  onSubmit,
  loading = false,
  autoFocus = true,
  placeholder = "What are you working on?",
  onSuccess,
  onError,
  clearOnSuccess = true,
  forceSubmitOnShiftEnter = false,
  className = "",
}) => {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const trimmed = value.trim();
  const canSubmit = !!trimmed && !submitting && !loading;

  const focusInput = useCallback(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    focusInput();
  }, [focusInput]);

  const reset = () => {
    setValue("");
  };

  const performSubmit = useCallback(async () => {
    if (!canSubmit) return;
    try {
      setSubmitting(true);
      await onSubmit(trimmed);
      onSuccess?.();
      if (clearOnSuccess) {
        reset();
      }
    } catch (err) {
      onError?.(err);
      // Keep current value for potential retry
    } finally {
      setSubmitting(false);
      focusInput();
    }
  }, [canSubmit, onSubmit, trimmed, onSuccess, clearOnSuccess, onError, focusInput]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      // If we ever switch to multiline (textarea) semantics we can add shift logic.
      if (!e.shiftKey || forceSubmitOnShiftEnter) {
        e.preventDefault();
        performSubmit();
      }
    }
  };

  return (
    <section
      className={`bg-neutral-900 rounded-lg p-6 border border-neutral-800 ${className}`}
      aria-labelledby="entry-form-heading"
    >
      <h2 id="entry-form-heading" className="text-xl font-semibold mb-4">
        Create New Entry
      </h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          performSubmit();
        }}
        className="flex gap-4"
        role="form"
        aria-describedby="entry-form-hint"
      >
        <input
          ref={inputRef}
          type="text"
          aria-label="New entry content"
          aria-invalid={canSubmit ? undefined : trimmed.length === 0 ? true : undefined}
            // Provide helper id so screen readers can announce instructions if added
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={submitting || loading}
          className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-600 rounded text-white placeholder-neutral-400 focus:outline-none focus:border-blue-500 disabled:opacity-60"
          autoFocus={autoFocus}
        />
        <Button
          type="submit"
          disabled={!canSubmit}
          variant="default"
          className="px-6"
        >
          {submitting ? "Adding..." : "Add Entry"}
        </Button>
      </form>
      <p id="entry-form-hint" className="sr-only">
        Type your current task and press Enter to submit.
      </p>
    </section>
  );
};

export default EntryForm;
