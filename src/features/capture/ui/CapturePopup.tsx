import React, { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCapture } from "../model/useCapture";
import { closeCaptureWindow } from "../model/repository";

/**
 * CapturePopup
 *
 * Ultra-fast entry capture window component.
 * Features:
 *  - Multiline textarea (autofocus)
 *  - Last 4 entries quick prefill buttons
 *  - Character counter (0-500)
 *  - Save button (disabled if empty)
 *  - Close / ESC handling
 *  - Full keyboard navigation support
 */

const MAX_CHARACTERS = 500;

export interface CapturePopupProps {
  /**
   * Callback invoked when user saves an entry.
   * Should handle the actual database save.
   */
  onSave: (content: string) => Promise<void>;
  /**
   * Optional callback when popup is closed.
   */
  onClose?: () => void;
}

export const CapturePopup: React.FC<CapturePopupProps> = ({
  onSave,
  onClose,
}) => {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { recentEntries, loading: loadingRecent } = useCapture();

  const trimmedContent = content.trim();
  const charCount = content.length;
  const canSave =
    trimmedContent.length > 0 && charCount <= MAX_CHARACTERS && !saving;

  // Auto-focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleClose = useCallback(() => {
    onClose?.();
    closeCaptureWindow();
  }, [onClose]);

  const handleSave = useCallback(async () => {
    if (!canSave) return;

    try {
      setSaving(true);
      await onSave(trimmedContent);
      // Close window after successful save
      handleClose();
    } catch (err) {
      console.error("Failed to save entry:", err);
      // Keep window open on error so user can retry
    } finally {
      setSaving(false);
    }
  }, [canSave, trimmedContent, onSave, handleClose]);

  const handlePrefill = useCallback((text: string) => {
    setContent(text);
    textareaRef.current?.focus();
  }, []);

  const handleKeyDownInTextarea = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Cmd/Ctrl + Enter to save
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSave();
      }
    },
    [handleSave],
  );

  const charCountColor =
    charCount > MAX_CHARACTERS
      ? "text-destructive"
      : charCount > MAX_CHARACTERS * 0.9
        ? "text-accent"
        : "text-muted-foreground";

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-2xl mx-auto space-y-6 bg-card rounded-lg border-glow shadow-glow-subtle p-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-black uppercase tracking-wide">
            What are you working on?
          </h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            aria-label="Close popup"
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </Button>
        </header>

        {/* Main textarea */}
        <div className="space-y-2">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDownInTextarea}
            placeholder="Describe what you're currently working on..."
            maxLength={MAX_CHARACTERS}
            aria-label="Entry content"
            aria-describedby="char-counter-hint"
            disabled={saving}
            className="h-40 resize-none"
          />

          {/* Character counter */}
          <div className="flex justify-end">
            <span
              id="char-counter-hint"
              className={`text-sm ${charCountColor}`}
              aria-live="polite"
            >
              {charCount} / {MAX_CHARACTERS}
            </span>
          </div>
        </div>

        {/* Recent entries prefill */}
        {recentEntries.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Recent activities
            </h2>
            <div className="space-y-2">
              {recentEntries.map((entry, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3 px-4 font-semibold bg-card hover:bg-muted"
                  onClick={() => handlePrefill(entry)}
                  disabled={saving}
                  aria-label={`Prefill with: ${entry}`}
                >
                  <span className="truncate text-foreground">{entry}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {loadingRecent && recentEntries.length === 0 && (
          <p className="text-sm text-muted-foreground/70 text-center">
            Loading recent entries...
          </p>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleSave}
            disabled={!canSave}
            className="flex-1"
            size="lg"
            aria-label="Save entry"
          >
            {saving ? "Saving..." : "Save"}
          </Button>

          {trimmedContent.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setContent("")}
              disabled={saving}
              size="lg"
              aria-label="Clear content"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Keyboard hint */}
        <p className="text-xs text-muted-foreground text-center">
          Press{" "}
          <kbd className="px-1.5 py-0.5 bg-muted text-foreground rounded-lg shadow-glow-subtle">
            ESC
          </kbd>{" "}
          to close •{" "}
          <kbd className="px-1.5 py-0.5 bg-muted text-foreground rounded-lg shadow-glow-subtle">
            ⌘/Ctrl
          </kbd>{" "}
          +{" "}
          <kbd className="px-1.5 py-0.5 bg-muted text-foreground rounded-lg shadow-glow-subtle">
            Enter
          </kbd>{" "}
          to save
        </p>
      </div>
    </div>
  );
};

export default CapturePopup;
