import React, { useState, FormEvent, useId } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "./FormField";
import { AuthErrorBanner } from "./AuthErrorBanner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  PasswordChangeFormData,
  validatePasswordChangeForm,
  ValidationError,
  ValidationMessages,
} from "../model/types";
import { cn } from "@/lib/utils";

interface AuthFormPasswordChangeProps {
  onSubmit: (data: PasswordChangeFormData) => Promise<void>;
  onCancel: () => void;
  requireCurrentPassword?: boolean;
  isLoading?: boolean;
  error?: string | null;
  onErrorDismiss?: () => void;
  showSuccessMessage?: boolean;
  className?: string;
}

/**
 * AuthFormPasswordChange - Password change form for logged-in users
 * Allows users to voluntarily change their password
 */
export function AuthFormPasswordChange({
  onSubmit,
  onCancel,
  requireCurrentPassword = false,
  isLoading = false,
  error,
  onErrorDismiss,
  showSuccessMessage = false,
  className,
}: AuthFormPasswordChangeProps) {
  const currentPasswordId = useId();
  const newPasswordId = useId();
  const confirmPasswordId = useId();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const formData: PasswordChangeFormData = {
      currentPassword: requireCurrentPassword ? currentPassword : undefined,
      newPassword,
      confirmPassword,
    };
    const errors = validatePasswordChangeForm(formData);

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
          Change Password
        </h2>
        <p className="text-sm text-muted-foreground font-bold uppercase tracking-wide">
          Update your account password
        </p>
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <Alert variant="success">
          <Lock className="h-5 w-5" />
          <AlertDescription>
            {ValidationMessages.PASSWORD_UPDATED}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Banner */}
      {error && <AuthErrorBanner error={error} onDismiss={onErrorDismiss} />}

      {/* Password Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {requireCurrentPassword && (
          <FormField
            id={currentPasswordId}
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={setCurrentPassword}
            error={validationErrors.currentPassword}
            placeholder="••••••••"
            autoComplete="current-password"
            required
            disabled={isLoading || showSuccessMessage}
          />
        )}

        <FormField
          id={newPasswordId}
          label="New Password"
          type="password"
          value={newPassword}
          onChange={setNewPassword}
          error={validationErrors.newPassword}
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

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            className="flex-1"
            disabled={isLoading || showSuccessMessage}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={isLoading || showSuccessMessage}
            size="default"
          >
            <Lock className="mr-2 h-4 w-4" />
            {isLoading ? "Updating..." : "Change Password"}
          </Button>
        </div>
      </form>

      {/* Security Note */}
      <p className="text-xs text-muted-foreground font-semibold text-center">
        Your new password must be at least 8 characters long.
      </p>
    </div>
  );
}
