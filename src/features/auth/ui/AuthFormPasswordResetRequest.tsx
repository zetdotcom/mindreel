import React, { useState, FormEvent, useId } from "react";
import { Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "./FormField";
import { AuthErrorBanner } from "./AuthErrorBanner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  PasswordResetRequestFormData,
  validatePasswordResetRequestForm,
  ValidationError,
  ValidationMessages,
} from "../model/types";
import { cn } from "@/lib/utils";

interface AuthFormPasswordResetRequestProps {
  onSubmit: (data: PasswordResetRequestFormData) => Promise<void>;
  onBackToLogin: () => void;
  isLoading?: boolean;
  error?: string | null;
  onErrorDismiss?: () => void;
  showSuccessMessage?: boolean;
  className?: string;
}

/**
 * AuthFormPasswordResetRequest - Password reset request form
 * Allows users to request a password recovery email
 */
export function AuthFormPasswordResetRequest({
  onSubmit,
  onBackToLogin,
  isLoading = false,
  error,
  onErrorDismiss,
  showSuccessMessage = false,
  className,
}: AuthFormPasswordResetRequestProps) {
  const emailId = useId();
  const [email, setEmail] = useState("");
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const formData: PasswordResetRequestFormData = { email };
    const errors = validatePasswordResetRequestForm(formData);

    if (errors.length > 0) {
      const errorMap: Record<string, string> = {};
      errors.forEach((err: ValidationError) => {
        errorMap[err.field] = err.message;
      });
      setValidationErrors(errorMap);
      return;
    }

    setValidationErrors({});
    await onSubmit(formData);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-black uppercase tracking-wide">
          Reset Password
        </h2>
        <p className="text-sm text-muted-foreground font-bold uppercase tracking-wide">
          Enter your email to receive reset instructions
        </p>
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <Alert variant="success">
          <Mail className="h-5 w-5" />
          <AlertDescription>
            {ValidationMessages.PASSWORD_RECOVERY_SENT}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Banner */}
      {error && <AuthErrorBanner error={error} onDismiss={onErrorDismiss} />}

      {/* Reset Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormField
          id={emailId}
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          error={validationErrors.email}
          placeholder="your@email.com"
          autoComplete="email"
          required
          disabled={isLoading || showSuccessMessage}
        />

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || showSuccessMessage}
          size="lg"
        >
          <Mail className="mr-2 h-4 w-4" />
          {isLoading ? "Sending..." : "Send Reset Link"}
        </Button>
      </form>

      {/* Back to Login */}
      <div className="text-center">
        <button
          type="button"
          onClick={onBackToLogin}
          className="text-sm font-bold text-muted-foreground hover:text-foreground hover:underline focus:outline-none focus:underline uppercase tracking-wide transition-colors inline-flex items-center gap-2"
          disabled={isLoading}
        >
          <ArrowLeft className="h-3 w-3" />
          Back to login
        </button>
      </div>

      {/* Security Note */}
      <p className="text-xs text-muted-foreground font-semibold text-center">
        For security reasons, we don't disclose whether an account exists.
      </p>
    </div>
  );
}
