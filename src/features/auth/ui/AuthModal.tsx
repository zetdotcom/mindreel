import { useState, useEffect, useCallback } from "react";
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
import { useAuthContext } from "../model/AuthContext";

interface AuthModalProps {
  className?: string;
}

export function AuthModal({ className }: AuthModalProps) {
  const {
    isAuthModalOpen,
    authModalInitialState,
    closeAuthModal,
    login,
    register,
    resetPassword,
    updatePassword,
    checkEmailVerification,
    resendVerification,
    user,
    loading,
    error,
    clearError,
  } = useAuthContext();

  const [authState, setAuthState] = useState<AuthState>(authModalInitialState);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (isAuthModalOpen) {
      setAuthState(authModalInitialState);
      setShowSuccessMessage(false);
    }
  }, [isAuthModalOpen, authModalInitialState]);

  const handleSwitchToRegister = useCallback(() => {
    setAuthState("register");
    clearError();
  }, [clearError]);

  const handleSwitchToLogin = useCallback(() => {
    setAuthState("login");
    clearError();
    setShowSuccessMessage(false);
  }, [clearError]);

  const handleForgotPassword = useCallback(() => {
    setAuthState("password_reset_request");
    clearError();
  }, [clearError]);

  const handleBackToLogin = useCallback(() => {
    setAuthState("login");
    clearError();
    setShowSuccessMessage(false);
  }, [clearError]);

  const handleLogin = async (data: LoginFormData) => {
    const result = await login(data.email, data.password);
    if (result.ok) {
      if (result.data?.emailVerified) {
        closeAuthModal();
      } else {
        setAuthState("email_verification_pending");
      }
    }
  };

  const handleRegister = async (data: RegisterFormData) => {
    const result = await register(data.email, data.password);
    if (result.ok) {
      setAuthState("email_verification_pending");
    }
  };

  const handlePasswordResetRequest = async (data: PasswordResetRequestFormData) => {
    const result = await resetPassword(data.email);
    if (result.ok) {
      setShowSuccessMessage(true);
      setTimeout(() => {
        handleBackToLogin();
      }, 3000);
    }
  };

  const handlePasswordSetNew = async (data: PasswordSetNewFormData) => {
    const result = await updatePassword(data.password);
    if (result.ok) {
      setShowSuccessMessage(true);
      setTimeout(() => {
        closeAuthModal();
      }, 2000);
    }
  };

  const handlePasswordChange = async (data: PasswordChangeFormData) => {
    const result = await updatePassword(data.newPassword);
    if (result.ok) {
      setShowSuccessMessage(true);
      setTimeout(() => {
        closeAuthModal();
      }, 2000);
    }
  };

  const handleCheckEmailVerification = async () => {
    setIsChecking(true);
    try {
      const isVerified = await checkEmailVerification();
      if (isVerified) {
        closeAuthModal();
      }
    } finally {
      setIsChecking(false);
    }
  };

  const handleResendVerificationEmail = async () => {
    if (!user?.email) return;
    setIsResending(true);
    try {
      await resendVerification(user.email);
    } finally {
      setIsResending(false);
    }
  };

  const handleOpenRegulations = () => {
    console.log("Open regulations modal");
  };

  const handleCancelPasswordChange = () => {
    closeAuthModal();
  };

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
    <Dialog open={isAuthModalOpen} onOpenChange={closeAuthModal}>
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
              isLoading={loading}
              error={error}
              onErrorDismiss={clearError}
            />
          )}

          {authState === "register" && (
            <AuthFormRegister
              onSubmit={handleRegister}
              onSwitchToLogin={handleSwitchToLogin}
              onOpenRegulations={handleOpenRegulations}
              isLoading={loading}
              error={error}
              onErrorDismiss={clearError}
            />
          )}

          {authState === "email_verification_pending" && (
            <AuthEmailVerificationNotice
              email={user?.email ?? ""}
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
              isLoading={loading}
              error={error}
              onErrorDismiss={clearError}
              showSuccessMessage={showSuccessMessage}
            />
          )}

          {authState === "password_set_new" && (
            <AuthFormPasswordSetNew
              onSubmit={handlePasswordSetNew}
              isLoading={loading}
              error={error}
              onErrorDismiss={clearError}
              showSuccessMessage={showSuccessMessage}
            />
          )}

          {authState === "password_change" && (
            <AuthFormPasswordChange
              onSubmit={handlePasswordChange}
              onCancel={handleCancelPasswordChange}
              requireCurrentPassword={false}
              isLoading={loading}
              error={error}
              onErrorDismiss={clearError}
              showSuccessMessage={showSuccessMessage}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
