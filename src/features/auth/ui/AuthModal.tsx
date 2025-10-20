import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AuthFormLogin } from "./AuthFormLogin";
import { AuthFormRegister } from "./AuthFormRegister";
import { AuthEmailVerificationNotice } from "./AuthEmailVerificationNotice";
import { AuthFormPasswordResetRequest } from "./AuthFormPasswordResetRequest";
import { AuthFormPasswordSetNew } from "./AuthFormPasswordSetNew";
import { AuthFormPasswordChange } from "./AuthFormPasswordChange";
import {
  AuthState,
  LoginFormData,
  RegisterFormData,
  PasswordResetRequestFormData,
  PasswordSetNewFormData,
  PasswordChangeFormData,
} from "../model/types";
import { cn } from "@/lib/utils";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialState?: AuthState;
  onLogin?: (data: LoginFormData) => Promise<void>;
  onRegister?: (data: RegisterFormData) => Promise<void>;
  onPasswordResetRequest?: (data: PasswordResetRequestFormData) => Promise<void>;
  onPasswordSetNew?: (data: PasswordSetNewFormData) => Promise<void>;
  onPasswordChange?: (data: PasswordChangeFormData) => Promise<void>;
  onCheckEmailVerification?: () => Promise<boolean>;
  onResendVerificationEmail?: () => Promise<void>;
  userEmail?: string;
  isLoading?: boolean;
  error?: string | null;
  onErrorDismiss?: () => void;
  className?: string;
}

/**
 * AuthModal - Main authentication modal component
 * Orchestrates all authentication states and forms
 * Handles state transitions between login, register, password reset, etc.
 */
export function AuthModal({
  open,
  onOpenChange,
  initialState = "login",
  onLogin,
  onRegister,
  onPasswordResetRequest,
  onPasswordSetNew,
  onPasswordChange,
  onCheckEmailVerification,
  onResendVerificationEmail,
  userEmail = "",
  isLoading = false,
  error = null,
  onErrorDismiss,
  className,
}: AuthModalProps) {
  const [authState, setAuthState] = useState<AuthState>(initialState);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Reset to initial state when modal opens
  useEffect(() => {
    if (open) {
      setAuthState(initialState);
      setShowSuccessMessage(false);
    }
  }, [open, initialState]);

  // State transition handlers
  const handleSwitchToRegister = useCallback(() => {
    setAuthState("register");
    onErrorDismiss?.();
  }, [onErrorDismiss]);

  const handleSwitchToLogin = useCallback(() => {
    setAuthState("login");
    onErrorDismiss?.();
    setShowSuccessMessage(false);
  }, [onErrorDismiss]);

  const handleForgotPassword = useCallback(() => {
    setAuthState("password_reset_request");
    onErrorDismiss?.();
  }, [onErrorDismiss]);

  const handleBackToLogin = useCallback(() => {
    setAuthState("login");
    onErrorDismiss?.();
    setShowSuccessMessage(false);
  }, [onErrorDismiss]);

  // Form submission handlers
  const handleLogin = async (data: LoginFormData) => {
    if (onLogin) {
      await onLogin(data);
      // Note: Parent component should handle state transition to email_verification_pending if needed
    }
  };

  const handleRegister = async (data: RegisterFormData) => {
    if (onRegister) {
      await onRegister(data);
      // After successful registration, transition to email verification
      setAuthState("email_verification_pending");
    }
  };

  const handlePasswordResetRequest = async (data: PasswordResetRequestFormData) => {
    if (onPasswordResetRequest) {
      await onPasswordResetRequest(data);
      setShowSuccessMessage(true);
      // Optionally transition back to login after a delay
      setTimeout(() => {
        handleBackToLogin();
      }, 3000);
    }
  };

  const handlePasswordSetNew = async (data: PasswordSetNewFormData) => {
    if (onPasswordSetNew) {
      await onPasswordSetNew(data);
      setShowSuccessMessage(true);
      // Close modal after successful password reset
      setTimeout(() => {
        onOpenChange(false);
      }, 2000);
    }
  };

  const handlePasswordChange = async (data: PasswordChangeFormData) => {
    if (onPasswordChange) {
      await onPasswordChange(data);
      setShowSuccessMessage(true);
      // Close modal after successful password change
      setTimeout(() => {
        onOpenChange(false);
      }, 2000);
    }
  };

  const handleCheckEmailVerification = async () => {
    if (onCheckEmailVerification) {
      setIsChecking(true);
      try {
        const isVerified = await onCheckEmailVerification();
        if (isVerified) {
          // Close modal on successful verification
          onOpenChange(false);
        }
      } finally {
        setIsChecking(false);
      }
    }
  };

  const handleResendVerificationEmail = async () => {
    if (onResendVerificationEmail) {
      setIsResending(true);
      try {
        await onResendVerificationEmail();
      } finally {
        setIsResending(false);
      }
    }
  };

  const handleOpenRegulations = () => {
    // TODO: Open regulations modal or navigate to regulations page
    console.log("Open regulations modal");
  };

  const handleCancelPasswordChange = () => {
    onOpenChange(false);
  };

  // Get modal title based on state
  const getModalTitle = (): string => {
    switch (authState) {
      case "login":
        return "Welcome Back";
      case "register":
        return "Create Account";
      case "email_verification_pending":
        return "Verify Your Email";
      case "password_reset_request":
        return "Reset Password";
      case "password_set_new":
        return "Set New Password";
      case "password_change":
        return "Change Password";
      default:
        return "Authentication";
    }
  };

  // Get modal description based on state
  const getModalDescription = (): string => {
    switch (authState) {
      case "login":
        return "Sign in to access your MindReel account";
      case "register":
        return "Start capturing your work moments";
      case "email_verification_pending":
        return "Please verify your email to continue";
      case "password_reset_request":
        return "We'll send you a recovery link";
      case "password_set_new":
        return "Choose a new password for your account";
      case "password_change":
        return "Update your password";
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn("sm:max-w-md", className)}
        showCloseButton={authState !== "password_set_new"}
      >
        <DialogHeader>
          <DialogTitle>{getModalTitle()}</DialogTitle>
          <DialogDescription>{getModalDescription()}</DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {authState === "login" && (
            <AuthFormLogin
              onSubmit={handleLogin}
              onForgotPassword={handleForgotPassword}
              onSwitchToRegister={handleSwitchToRegister}
              isLoading={isLoading}
              error={error}
              onErrorDismiss={onErrorDismiss}
            />
          )}

          {authState === "register" && (
            <AuthFormRegister
              onSubmit={handleRegister}
              onSwitchToLogin={handleSwitchToLogin}
              onOpenRegulations={handleOpenRegulations}
              isLoading={isLoading}
              error={error}
              onErrorDismiss={onErrorDismiss}
            />
          )}

          {authState === "email_verification_pending" && (
            <AuthEmailVerificationNotice
              email={userEmail}
              onCheckVerification={handleCheckEmailVerification}
              onResendEmail={handleResendVerificationEmail}
              onBackToLogin={handleBackToLogin}
              isChecking={isChecking}
              isResending={isResending}
            />
          )}

          {authState === "password_reset_request" && (
            <AuthFormPasswordResetRequest
              onSubmit={handlePasswordResetRequest}
              onBackToLogin={handleBackToLogin}
              isLoading={isLoading}
              error={error}
              onErrorDismiss={onErrorDismiss}
              showSuccessMessage={showSuccessMessage}
            />
          )}

          {authState === "password_set_new" && (
            <AuthFormPasswordSetNew
              onSubmit={handlePasswordSetNew}
              isLoading={isLoading}
              error={error}
              onErrorDismiss={onErrorDismiss}
              showSuccessMessage={showSuccessMessage}
            />
          )}

          {authState === "password_change" && (
            <AuthFormPasswordChange
              onSubmit={handlePasswordChange}
              onCancel={handleCancelPasswordChange}
              requireCurrentPassword={false}
              isLoading={isLoading}
              error={error}
              onErrorDismiss={onErrorDismiss}
              showSuccessMessage={showSuccessMessage}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
