import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * OnboardingModal (Feature: onboarding)
 *
 * First‑run introduction explaining core value.
 *
 * Design goals:
 *  - Non-dismissable except via explicit confirm action (prevents accidental close).
 *  - Accessible: heading / description IDs, focus trapping via Dialog.
 *  - Extensible: copy can be customized via props without changing structure.
 *
 * Future extensions:
 *  - Add an illustration slot
 *  - Add "Do not show again" toggle (currently implicit on confirm)
 *  - Accept a list of bullet points instead of static paragraphs
 */

export interface OnboardingModalProps {
  /**
   * Whether modal is open.
   */
  open: boolean;
  /**
   * Called when user explicitly acknowledges and wants to continue.
   */
  onConfirm: () => void;
  /**
   * Optional custom heading.
   */
  heading?: string;
  /**
   * Optional paragraphs to override default explanatory text.
   */
  paragraphs?: string[];
  /**
   * Optional override button label.
   */
  confirmLabel?: string;
  /**
   * If true, allows ESC / outside click to close (default false).
   * (Currently feature wants to enforce explicit confirmation.)
   */
  allowUserDismiss?: boolean;
  /**
   * Called if user attempts to dismiss via ESC/outside while disallowed.
   * Could be used to show a subtle hint or analytics event.
   */
  onBlockedDismissAttempt?: () => void;
  /**
   * Additional className for DialogContent.
   */
  contentClassName?: string;
}

const DEFAULT_PARAGRAPHS = [
  "MindReel helps you remember what you worked on by prompting you at gentle intervals.",
  "Just jot a quick note when a capture pop-up appears—your daily stream builds automatically.",
  "If you later create an account and consent, you'll also get weekly AI summaries of your achievements.",
];

export function OnboardingModal({
  open,
  onConfirm,
  heading = "Capture your work as you go",
  paragraphs = DEFAULT_PARAGRAPHS,
  confirmLabel = "Got it – Start",
  allowUserDismiss = false,
  onBlockedDismissAttempt,
  contentClassName = "",
}: OnboardingModalProps) {
  const headingId = React.useId();
  const bodyId = React.useId();

  // Guard outside dismissal if disallowed
  const preventClose = React.useCallback(
    (e: Event) => {
      if (!allowUserDismiss) {
        e.preventDefault();
        onBlockedDismissAttempt?.();
      }
    },
    [allowUserDismiss, onBlockedDismissAttempt],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // If dismissal is allowed, pass through (close when next === false).
        // If not allowed and attempt is to close -> ignore.
        if (!allowUserDismiss && next === false) {
          onBlockedDismissAttempt?.();
          return;
        }
        if (next === false && allowUserDismiss) {
          // Could call onConfirm or provide separate onClose prop if desired.
        }
      }}
    >
      <DialogContent
        showCloseButton={allowUserDismiss}
        className={`max-w-[460px] rounded-xl border bg-background/95 backdrop-blur p-6 shadow-lg ring-1 ring-border focus:outline-none ${contentClassName}`}
        aria-labelledby={headingId}
        aria-describedby={bodyId}
        // Block escape/outside if not allowed
        onEscapeKeyDown={preventClose}
        onPointerDownOutside={preventClose}
        onInteractOutside={preventClose}
      >
        <DialogHeader className="space-y-6">
          <DialogTitle
            id={headingId}
            className="text-xl font-semibold tracking-tight"
          >
            {heading}
          </DialogTitle>

          <DialogDescription
            id={bodyId}
            className="text-sm text-muted-foreground space-y-3 leading-relaxed text-left"
            asChild
          >
            <div>
              {paragraphs.map((p, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                <p key={i}>{p}</p>
              ))}
            </div>
          </DialogDescription>
        </DialogHeader>

        <Button
          onClick={onConfirm}
          variant="default"
          // Provide generous target size
          size="lg"
          className="w-full mt-4"
          aria-label="Acknowledge introduction and open first capture form"
          data-testid="onboarding-confirm"
        >
          {confirmLabel}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export default OnboardingModal;
