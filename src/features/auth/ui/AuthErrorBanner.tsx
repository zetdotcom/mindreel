import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AuthErrorBannerProps {
  error: string | null;
  onDismiss?: () => void;
  className?: string;
}

/**
 * AuthErrorBanner displays authentication errors in a prominent alert
 * Styled consistently with the app's brutalist design
 */
export function AuthErrorBanner({
  error,
  onDismiss,
  className,
}: AuthErrorBannerProps) {
  if (!error) {
    return null;
  }

  return (
    <Alert variant="destructive" className={className} role="alert">
      <AlertCircle className="h-5 w-5" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        {error}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="ml-4 text-xs underline hover:no-underline focus:outline-none"
            aria-label="Dismiss error"
          >
            Dismiss
          </button>
        )}
      </AlertDescription>
    </Alert>
  );
}
