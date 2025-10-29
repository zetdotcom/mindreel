import { Lock } from "lucide-react";
import React, { type FormEvent, useId, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type PasswordSetNewFormData,
  type ValidationError,
  ValidationMessages,
  validatePasswordSetNewForm,
} from "../model/types";
import { AuthErrorBanner } from "./AuthErrorBanner";
import { FormField } from "./FormField";

interface AuthFormPasswordSetNewProps {
  onSubmit: (data: PasswordSetNewFormData) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  onErrorDismiss?: () => void;
  showSuccessMessage?: boolean;
  className?: string;
}

/**
 * AuthFormPasswordSetNew - Set new password form
 * Used after user clicks password recovery link
 */
export function AuthFormPasswordSetNew({
  onSubmit,
  isLoading = false,
  error,
  onErrorDismiss,
  showSuccessMessage = false,
  className,
}: AuthFormPasswordSetNewProps) {
  const passwordId = useId();
  const confirmPasswordId = useId();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const formData: PasswordSetNewFormData = {
      password,
      confirmPassword,
    };
    const errors = validatePasswordSetNewForm(formData);

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
        <h2 className="text-2xl font-black uppercase tracking-wide">Set New Password</h2>
        <p className="text-sm text-muted-foreground font-bold uppercase tracking-wide">
          Choose a strong password for your account
        </p>
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <Alert variant="success">
          <Lock className="h-5 w-5" />
          <AlertDescription>{ValidationMessages.PASSWORD_UPDATED}</AlertDescription>
        </Alert>
      )}

      {/* Error Banner */}
      {error && <AuthErrorBanner error={error} onDismiss={onErrorDismiss} />}

      {/* Password Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormField
          id={passwordId}
          label="New Password"
          type="password"
          value={password}
          onChange={setPassword}
          error={validationErrors.password}
          placeholder="••••••••"
          autoComplete="new-password"
          required
          disabled={isLoading || showSuccessMessage}
        />

        <FormField
          id={confirmPasswordId}
          label="Confirm New Password"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          error={validationErrors.confirmPassword}
          placeholder="••••••••"
          autoComplete="new-password"
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
          <Lock className="mr-2 h-4 w-4" />
          {isLoading ? "Updating..." : "Set New Password"}
        </Button>
      </form>

      {/* Security Note */}
      <p className="text-xs text-muted-foreground font-semibold text-center">
        Password must be at least 8 characters long.
      </p>
    </div>
  );
}
