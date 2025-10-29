import type React from "react";

/**
 * ErrorDisplay
 *
 * Lightweight, reusable error banner / inline component.
 * - Accepts a single message (string) or an array of messages.
 * - Optional onDismiss to render a close button.
 * - Accessible semantics (role="alert" + aria-live="assertive").
 *
 * Usage:
 *  <ErrorDisplay error="Something failed" />
 *  <ErrorDisplay error={['Line 1', 'Line 2']} onDismiss={() => ...} variant="subtle" />
 *
 * Variants:
 *  - "solid"  : High-contrast background
 *  - "subtle" : Low-contrast, less visually dominant
 *
 * This component deliberately does NOT:
 *  - Handle retry logic
 *  - Auto-hide itself
 *  - Wrap arbitrary children (keep API narrow)
 */
export interface ErrorDisplayProps {
  /**
   * Error text or array of error lines.
   */
  error: string | string[] | null | undefined;
  /**
   * Dismiss callback. When provided, a close button is rendered.
   */
  onDismiss?: () => void;
  /**
   * Visual variant (default "solid").
   */
  variant?: "solid" | "subtle";
  /**
   * Optional custom className to augment styling.
   */
  className?: string;
  /**
   * Optional aria-label override for the close button (i18n).
   */
  dismissAriaLabel?: string;
  /**
   * If true, will render nothing when error is empty/whitespace.
   */
  ignoreEmpty?: boolean;
}

function normalizeMessages(input: ErrorDisplayProps["error"], ignoreEmpty: boolean): string[] {
  if (!input) return [];
  const arr = Array.isArray(input) ? input : [input];
  const cleaned = arr
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter((s) => (ignoreEmpty ? s.length > 0 : true));
  return cleaned;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onDismiss,
  variant = "solid",
  className = "",
  dismissAriaLabel = "Dismiss error",
  ignoreEmpty = true,
}) => {
  const messages = normalizeMessages(error, ignoreEmpty);

  if (messages.length === 0) return null;

  const base = "rounded-lg border text-sm leading-snug flex flex-col gap-2 px-4 py-3 relative";
  const variantClasses =
    variant === "solid"
      ? "bg-red-900/60 border-red-600/60 text-red-100"
      : "bg-red-950/30 border-red-800/50 text-red-200";

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`${base} ${variantClasses} ${className}`.trim()}
      data-component="ErrorDisplay"
    >
      <ul className="list-none m-0 p-0 space-y-1">
        {messages.map((line, i) => (
          <li key={i} className="break-words">
            {line}
          </li>
        ))}
      </ul>
      {onDismiss && (
        <button
          type="button"
          // Using absolute positioning to keep layout consistent
          className="absolute top-2 right-2 text-red-300 hover:text-red-100 transition text-xs font-medium focus:outline-none focus-visible:ring-1 focus-visible:ring-red-300 rounded"
          onClick={onDismiss}
          aria-label={dismissAriaLabel}
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default ErrorDisplay;
