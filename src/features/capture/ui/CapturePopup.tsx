import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { closeCaptureWindow } from "../model/repository";
import { CaptureEntryTab } from "./CaptureEntryTab";
import { CaptureTodoTab } from "./CaptureTodoTab";

/**
 * CapturePopup
 *
 * Tab shell for the capture window. Hosts two tabs:
 *  - Entry (default): ultra-fast text capture
 *  - Todo: create and check off active todos
 *
 * Keyboard:
 *  - Ctrl+Space toggles between tabs
 *  - ESC closes the popup from either tab
 *  - Cmd/Ctrl+Enter saves entry (Entry tab only, handled inside CaptureEntryTab)
 */

type CaptureTab = "entry" | "todo";

export interface CapturePopupProps {
  onSave: (content: string) => Promise<void>;
  onClose?: () => void;
}

export const CapturePopup: React.FC<CapturePopupProps> = ({ onSave, onClose }) => {
  const [activeTab, setActiveTab] = useState<CaptureTab>("entry");

  const handleClose = useCallback(() => {
    onClose?.();
    closeCaptureWindow();
  }, [onClose]);

  // Global keyboard handlers: ESC to close, Ctrl+Space to toggle tabs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
        return;
      }

      if (e.ctrlKey && e.key === " ") {
        e.preventDefault();
        setActiveTab((prev) => (prev === "entry" ? "todo" : "entry"));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  const handleSaveEntry = useCallback(
    async (content: string) => {
      await onSave(content);
      handleClose();
    },
    [onSave, handleClose],
  );

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <Card className="max-w-2xl mx-auto shadow-none border-glow">
        <CardHeader className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold leading-tight normal-case tracking-normal">
              {activeTab === "entry" ? "What are you working on?" : "To Do"}
            </h1>

            {/* Tab buttons */}
            <div className="flex rounded-md border border-border overflow-hidden w-fit">
              <button
                type="button"
                onClick={() => setActiveTab("entry")}
                className={cn(
                  "px-3 py-1 text-xs font-medium transition-colors",
                  activeTab === "entry"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted/60",
                )}
                aria-selected={activeTab === "entry"}
                role="tab"
              >
                Entry
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("todo")}
                className={cn(
                  "px-3 py-1 text-xs font-medium transition-colors",
                  activeTab === "todo"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted/60",
                )}
                aria-selected={activeTab === "todo"}
                role="tab"
              >
                Todo
              </button>
            </div>

            <p className="text-xs text-muted-foreground normal-case tracking-normal">
              <kbd className="px-1 py-0.5 bg-muted text-foreground rounded shadow-glow-subtle">
                Ctrl+Space
              </kbd>{" "}
              to switch tabs
            </p>
          </div>

          <CardAction>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              aria-label="Close popup"
              className="normal-case tracking-normal font-medium text-muted-foreground hover:text-foreground"
            >
              ✕
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className="space-y-5">
          {activeTab === "entry" ? (
            <CaptureEntryTab onSave={handleSaveEntry} />
          ) : (
            <CaptureTodoTab />
          )}
        </CardContent>

        <CardFooter className="justify-end pt-0" />
      </Card>
    </div>
  );
};

export default CapturePopup;
