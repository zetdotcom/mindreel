import { LogIn } from "lucide-react";
import React, { type FormEvent, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type LoginFormData, type ValidationError, validateLoginForm } from "../model/types";
import { AuthErrorBanner } from "./AuthErrorBanner";
import { FormField } from "./FormField";

interface AuthFormLoginProps {
  onSubmit: (data: LoginFormData) => Promise<void>;
  onForgotPassword: () => void;
  onSwitchToRegister: () => void;
  isLoading?: boolean;
  error?: string | null;
  onErrorDismiss?: () => void;
  className?: string;
}

/**
 * AuthFormLogin - Login form component
 * Handles user authentication with email and password
 */
export function AuthFormLogin({
  onSubmit,
  onForgotPassword,
  onSwitchToRegister,
  isLoading = false,
  error,
  onErrorDismiss,
  className,
}: AuthFormLoginProps) {
  const emailId = useId();
  const passwordId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const formData: LoginFormData = { email, password };
    const errors = validateLoginForm(formData);

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

      {/* Login Form */}
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
          autoComplete="current-password"
          required
          disabled={isLoading}
        />

        {/* Forgot Password Link */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm font-bold text-primary hover:underline focus:outline-none focus:underline uppercase tracking-wide"
            disabled={isLoading}
          >
            Forgot password?
          </button>
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={isLoading} size="lg">
          <LogIn className="mr-2 h-4 w-4" />
          {isLoading ? "Logging in..." : "Log In"}
        </Button>
      </form>

      {/* Switch to Register */}
      <div className="text-center text-sm">
        <span className="text-muted-foreground font-bold uppercase tracking-wide">
          Don't have an account?{" "}
        </span>
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-primary font-black hover:underline focus:outline-none focus:underline uppercase tracking-wide"
          disabled={isLoading}
        >
          Sign up
        </button>
      </div>
    </div>
  );
}
