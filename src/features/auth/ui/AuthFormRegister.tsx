import { UserPlus } from "lucide-react";
import React, { type FormEvent, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { type RegisterFormData, type ValidationError, validateRegisterForm } from "../model/types";
import { AuthErrorBanner } from "./AuthErrorBanner";
import { FormField } from "./FormField";

interface AuthFormRegisterProps {
  onSubmit: (data: RegisterFormData) => Promise<void>;
  onSwitchToLogin: () => void;
  onOpenRegulations: () => void;
  isLoading?: boolean;
  error?: string | null;
  onErrorDismiss?: () => void;
  className?: string;
}

/**
 * AuthFormRegister - Registration form component
 * Handles new user registration with email, password, and ToS acceptance
 */
export function AuthFormRegister({
  onSubmit,
  onSwitchToLogin,
  onOpenRegulations,
  isLoading = false,
  error,
  onErrorDismiss,
  className,
}: AuthFormRegisterProps) {
  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();
  const tosId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tosAccepted, setTosAccepted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const formData: RegisterFormData = {
      email,
      password,
      confirmPassword,
      tosAccepted,
    };
    const errors = validateRegisterForm(formData);

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
      {/* Error Banner */}
      {error && <AuthErrorBanner error={error} onDismiss={onErrorDismiss} />}

      {/* Registration Form */}
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
          disabled={isLoading}
        />

        <FormField
          id={passwordId}
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          error={validationErrors.password}
          placeholder="••••••••"
          autoComplete="new-password"
          required
          disabled={isLoading}
        />

        <FormField
          id={confirmPasswordId}
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          error={validationErrors.confirmPassword}
          placeholder="••••••••"
          autoComplete="new-password"
          required
          disabled={isLoading}
        />

        {/* Terms of Service Checkbox */}
        <div className="space-y-2">
          <div className="flex items-start space-x-3">
            <Checkbox
              id={tosId}
              checked={tosAccepted}
              onCheckedChange={(checked) => setTosAccepted(checked === true)}
              disabled={isLoading}
              aria-invalid={!!validationErrors.tosAccepted}
              aria-describedby={validationErrors.tosAccepted ? "tos-error" : undefined}
            />
            <div className="flex-1 space-y-1">
              <Label htmlFor={tosId} className="text-sm font-bold leading-tight cursor-pointer">
                I accept the{" "}
                <button
                  type="button"
                  onClick={onOpenRegulations}
                  className="text-primary font-black hover:underline focus:outline-none focus:underline uppercase tracking-wide"
                  disabled={isLoading}
                >
                  Terms of Service
                </button>
                <span className="text-destructive ml-1">*</span>
              </Label>
            </div>
          </div>
          {validationErrors.tosAccepted && (
            <p
              id={`${tosId}-error`}
              className="text-sm font-bold text-destructive ml-8"
              role="alert"
            >
              {validationErrors.tosAccepted}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={isLoading} size="lg">
          <UserPlus className="mr-2 h-4 w-4" />
          {isLoading ? "Creating account..." : "Sign Up"}
        </Button>
      </form>

      {/* Switch to Login */}
      <div className="text-center text-sm">
        <span className="text-muted-foreground font-bold uppercase tracking-wide">
          Already have an account?{" "}
        </span>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-primary font-black hover:underline focus:outline-none focus:underline uppercase tracking-wide"
          disabled={isLoading}
        >
          Log in
        </button>
      </div>
    </div>
  );
}
