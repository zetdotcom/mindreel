import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface OnboardingModalProps {
  open: boolean;
  onConfirm: () => void;
}

/**
 * OnboardingModal - First-time user experience modal
 *
 * Displays an introductory message explaining MindReel's core value proposition:
 * - Periodic capture prompts for building a work journal
 * - Optional weekly AI summaries for users with accounts
 *
 * This modal appears only once on first app run and is controlled via localStorage.
 * After dismissal, it triggers the first capture popup to encourage immediate engagement.
 */
export function OnboardingModal({ open, onConfirm }: OnboardingModalProps) {
  const headingId = React.useId();
  const bodyId = React.useId();

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        // Prevent closing via outside click or ESC
        // User must explicitly click the Continue button
        if (!isOpen) {
          // Ignore attempts to close
          return;
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-w-[460px] rounded-xl border bg-background/95 backdrop-blur p-6 shadow-lg ring-1 ring-border"
        aria-labelledby={headingId}
        aria-describedby={bodyId}
        onEscapeKeyDown={(e) => {
          // Prevent ESC from closing - require explicit action
          e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          // Prevent outside clicks from closing
          e.preventDefault();
        }}
        onInteractOutside={(e) => {
          // Additional safeguard for any interaction outside
          e.preventDefault();
        }}
      >
        <DialogHeader className="space-y-6">
          <DialogTitle
            id={headingId}
            className="text-xl font-semibold tracking-tight"
          >
            Capture your work as you go
          </DialogTitle>

          <DialogDescription
            id={bodyId}
            className="text-sm text-muted-foreground space-y-3 leading-relaxed text-left"
            asChild
          >
            <div>
              <p>
                MindReel helps you remember what you worked on by prompting you at gentle intervals.
              </p>
              <p>
                Just jot a quick note when a capture pop-up appears—your daily stream builds automatically.
              </p>
              <p>
                If you later create an account and consent, you'll also get weekly AI summaries of your achievements.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* Optional: Placeholder for future illustration */}
        {/*
        <div className="h-24 bg-muted/50 rounded-md flex items-center justify-center">
          <span className="text-xs text-muted-foreground">Illustration placeholder</span>
        </div>
        */}

        <Button
          onClick={onConfirm}
          variant="default"
          size="lg"
          className="w-full mt-4"
          aria-label="Acknowledge introduction and open first capture form"
        >
          Got it – Start
        </Button>
      </DialogContent>
    </Dialog>
  );
}
