import { Clock } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCapture } from "../model/useCapture";

const MAX_CHARACTERS = 500;

interface CaptureEntryTabProps {
  onSave: (content: string) => Promise<void>;
}

export const CaptureEntryTab: React.FC<CaptureEntryTabProps> = ({ onSave }) => {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { recentEntries, loading: loadingRecent } = useCapture();

  const trimmedContent = content.trim();
  const charCount = content.length;
  const canSave = trimmedContent.length > 0 && charCount <= MAX_CHARACTERS && !saving;

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSave = useCallback(async () => {
    if (!canSave) return;

    try {
      setSaving(true);
      await onSave(trimmedContent);
    } catch (err) {
      console.error("Failed to save entry:", err);
    } finally {
      setSaving(false);
    }
  }, [canSave, trimmedContent, onSave]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSave();
      }
    },
    [handleSave],
  );

  const handlePrefill = useCallback((text: string) => {
    setContent(text);
    textareaRef.current?.focus();
  }, []);

  const charCountColor =
    charCount > MAX_CHARACTERS
      ? "text-destructive"
      : charCount > MAX_CHARACTERS * 0.9
        ? "text-accent"
        : "text-muted-foreground";

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe what you're currently working on..."
          maxLength={MAX_CHARACTERS}
          aria-label="Entry content"
          aria-describedby="entry-char-hint entry-shortcut-hint"
          disabled={saving}
          className="h-40 resize-none placeholder:normal-case placeholder:font-medium placeholder:tracking-normal border-glow focus-visible:border-glow"
          data-testid="capture-textarea"
        />

        <div className="flex items-center justify-between">
          <p
            id="entry-shortcut-hint"
            className="text-xs text-muted-foreground normal-case tracking-normal"
          >
            Press{" "}
            <kbd className="px-1.5 py-0.5 bg-muted text-foreground rounded-lg shadow-glow-subtle">
              ESC
            </kbd>{" "}
            to close •{" "}
            <kbd className="px-1.5 py-0.5 bg-muted text-foreground rounded-lg shadow-glow-subtle">
              ⌘/Ctrl
            </kbd>
            {" + "}
            <kbd className="px-1.5 py-0.5 bg-muted text-foreground rounded-lg shadow-glow-subtle">
              Enter
            </kbd>{" "}
            to save
          </p>
          <span
            id="entry-char-hint"
            className={`text-sm ${charCountColor}`}
            aria-live="polite"
          >
            {charCount} / {MAX_CHARACTERS}
          </span>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          onClick={handleSave}
          disabled={!canSave}
          className="flex-1 normal-case tracking-normal font-semibold"
          size="lg"
          aria-label="Save entry"
          data-testid="save-entry-button"
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
            className="normal-case tracking-normal font-medium"
          >
            Clear
          </Button>
        )}
      </div>

      {recentEntries.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground normal-case tracking-normal">
            Recent activities
          </h2>
          <div className="space-y-3">
            {recentEntries.map((entry, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start text-left h-auto py-3 px-4 font-medium normal-case tracking-normal bg-muted/40 hover:bg-muted flex items-start gap-2 border-glow"
                onClick={() => handlePrefill(entry)}
                disabled={saving}
                aria-label={`Prefill with: ${entry}`}
              >
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate text-sm leading-relaxed text-foreground">
                  {entry}
                </span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {loadingRecent && recentEntries.length === 0 && (
        <p className="text-sm text-muted-foreground/70 text-center normal-case tracking-normal">
          Loading recent entries...
        </p>
      )}
    </div>
  );
};
