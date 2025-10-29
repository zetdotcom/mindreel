import { Mail, RefreshCw } from "lucide-react";
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AuthEmailVerificationNoticeProps {
  email: string;
  onCheckVerification: () => Promise<void>;
  onResendEmail?: () => Promise<void>;
  onBackToLogin?: () => void;
  isChecking?: boolean;
  isResending?: boolean;
  className?: string;
}

/**
 * AuthEmailVerificationNotice - Email verification pending screen
 * Displays instructions and allows manual verification check
 */
export function AuthEmailVerificationNotice({
  email,
  onCheckVerification,
  onResendEmail,
  onBackToLogin,
  isChecking = false,
  isResending = false,
  className,
}: AuthEmailVerificationNoticeProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Info Alert */}
      <Alert variant="warning" className="border-2">
        <Mail className="h-5 w-5" />
        <AlertTitle>Verify your email</AlertTitle>
        <AlertDescription>
          We sent a verification link to{" "}
          <span className="font-black text-accent-foreground">{email}</span>. Please check your
          inbox and click the link to verify your account.
        </AlertDescription>
      </Alert>

      {/* Instructions */}
      <div className="space-y-3 text-sm">
        <p className="font-bold text-muted-foreground uppercase tracking-wide">What to do next:</p>
        <ol className="space-y-2 list-decimal list-inside font-semibold text-muted-foreground">
          <li>Open your email inbox</li>
          <li>Find the verification email from MindReel</li>
          <li>Click the verification link</li>
          <li>Return here and click "I verified my email"</li>
        </ol>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Button
          onClick={onCheckVerification}
          disabled={isChecking || isResending}
          className="w-full"
          size="lg"
        >
          <RefreshCw className={cn("mr-2 h-4 w-4", isChecking && "animate-spin")} />
          {isChecking ? "Checking..." : "I verified my email"}
        </Button>

        {onResendEmail && (
          <Button
            onClick={onResendEmail}
            disabled={isChecking || isResending}
            variant="outline"
            className="w-full"
          >
            {isResending ? "Sending..." : "Resend verification email"}
          </Button>
        )}

        {onBackToLogin && (
          <div className="text-center">
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-sm font-bold text-muted-foreground hover:text-foreground hover:underline focus:outline-none focus:underline uppercase tracking-wide transition-colors"
              disabled={isChecking || isResending}
            >
              Back to login
            </button>
          </div>
        )}
      </div>

      {/* Note about spam */}
      <p className="text-xs text-muted-foreground font-semibold text-center">
        Can't find the email? Check your spam folder or wait a few minutes and try resending.
      </p>
    </div>
  );
}
