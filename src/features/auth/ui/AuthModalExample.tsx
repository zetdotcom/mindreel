import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AuthModal } from "./AuthModal";
import {
  LoginFormData,
  RegisterFormData,
  PasswordResetRequestFormData,
  PasswordSetNewFormData,
  PasswordChangeFormData,
  ValidationMessages,
  AuthState,
} from "../model/types";

/**
 * AuthModalExample - Example component demonstrating AuthModal usage
 *
 * This component shows how to integrate the AuthModal with your application.
 * Replace the console.log statements with actual Supabase auth calls.
 *
 * @example
 * ```tsx
 * import { AuthModalExample } from '@/features/auth/ui/AuthModalExample';
 *
 * function App() {
 *   return <AuthModalExample />;
 * }
 * ```
 */
export function AuthModalExample() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authState, setAuthState] = useState<AuthState>("login");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // Simulate auth operations with delays
  const simulateAsyncOperation = async (duration: number = 1000) => {
    await new Promise((resolve) => setTimeout(resolve, duration));
  };

  /**
   * Handle user login
   * TODO: Replace with actual Supabase auth call
   * Example: await supabase.auth.signInWithPassword({ email, password })
   */
  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      console.log("Login attempt:", { email: data.email });
      await simulateAsyncOperation();

      // Simulate random success/failure for demo
      const shouldSucceed = Math.random() > 0.3;

      if (!shouldSucceed) {
        throw new Error(ValidationMessages.INVALID_CREDENTIALS);
      }

      // Simulate unverified email scenario
      const isEmailVerified = Math.random() > 0.5;

      if (!isEmailVerified) {
        setUserEmail(data.email);
        setAuthState("email_verification_pending");
        return;
      }

      // Success - close modal
      setIsAuthModalOpen(false);
      console.log("Login successful!");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : ValidationMessages.NETWORK_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle user registration
   * TODO: Replace with actual Supabase auth call
   * Example: await supabase.auth.signUp({ email, password })
   */
  const handleRegister = async (data: RegisterFormData) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      console.log("Registration attempt:", {
        email: data.email,
        tosAccepted: data.tosAccepted,
      });
      await simulateAsyncOperation();

      // Simulate random success/failure for demo
      const shouldSucceed = Math.random() > 0.3;

      if (!shouldSucceed) {
        throw new Error(ValidationMessages.EMAIL_ALREADY_REGISTERED);
      }

      // Success - store email and transition to verification
      setUserEmail(data.email);
      setAuthState("email_verification_pending");
      console.log("Registration successful! Email verification required.");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : ValidationMessages.NETWORK_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle password reset request
   * TODO: Replace with actual Supabase auth call
   * Example: await supabase.auth.resetPasswordForEmail(email, { redirectTo })
   */
  const handlePasswordResetRequest = async (data: PasswordResetRequestFormData) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      console.log("Password reset requested for:", data.email);
      await simulateAsyncOperation();

      // Always succeed (don't reveal if account exists)
      console.log("Password reset email sent (if account exists)");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : ValidationMessages.NETWORK_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle setting new password (after recovery link)
   * TODO: Replace with actual Supabase auth call
   * Example: await supabase.auth.updateUser({ password: newPassword })
   */
  const handlePasswordSetNew = async (data: PasswordSetNewFormData) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      console.log("Setting new password...");
      await simulateAsyncOperation();

      // Simulate random success/failure for demo
      const shouldSucceed = Math.random() > 0.7;

      if (!shouldSucceed) {
        throw new Error(ValidationMessages.PASSWORD_UPDATE_FAILED);
      }

      console.log("Password updated successfully!");
      // Modal will close automatically
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : ValidationMessages.NETWORK_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle password change (for logged-in users)
   * TODO: Replace with actual Supabase auth call
   * Example: await supabase.auth.updateUser({ password: newPassword })
   */
  const handlePasswordChange = async (data: PasswordChangeFormData) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      console.log("Changing password...");
      await simulateAsyncOperation();

      // Simulate random success/failure for demo
      const shouldSucceed = Math.random() > 0.7;

      if (!shouldSucceed) {
        throw new Error(ValidationMessages.PASSWORD_UPDATE_FAILED);
      }

      console.log("Password changed successfully!");
      // Modal will close automatically
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : ValidationMessages.NETWORK_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Check if email has been verified
   * TODO: Replace with actual Supabase user check
   * Example: const { data: { user } } = await supabase.auth.getUser()
   */
  const handleCheckEmailVerification = async (): Promise<boolean> => {
    console.log("Checking email verification status...");
    await simulateAsyncOperation(500);

    // Simulate random verification status for demo
    const isVerified = Math.random() > 0.5;

    if (isVerified) {
      console.log("Email verified!");
      return true;
    } else {
      console.log("Email not yet verified");
      setAuthError("Email not verified yet. Please check your inbox.");
      return false;
    }
  };

  /**
   * Resend verification email
   * TODO: Replace with actual Supabase call
   * Example: await supabase.auth.resend({ type: 'signup', email })
   */
  const handleResendVerificationEmail = async () => {
    console.log("Resending verification email to:", userEmail);
    await simulateAsyncOperation(500);
    console.log("Verification email resent!");
  };

  /**
   * Open auth modal in specific state
   */
  const openAuthModal = (state: AuthState) => {
    setAuthState(state);
    setAuthError(null);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black uppercase tracking-wide">
            Auth Modal Example
          </h1>
          <p className="text-muted-foreground font-bold uppercase tracking-wide">
            Click buttons to test different authentication flows
          </p>
        </div>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={() => openAuthModal("login")}
            size="lg"
            variant="default"
          >
            Open Login
          </Button>

          <Button
            onClick={() => openAuthModal("register")}
            size="lg"
            variant="accent"
          >
            Open Registration
          </Button>

          <Button
            onClick={() => openAuthModal("email_verification_pending")}
            size="lg"
            variant="warm"
          >
            Email Verification
          </Button>

          <Button
            onClick={() => openAuthModal("password_reset_request")}
            size="lg"
            variant="outline"
          >
            Password Reset Request
          </Button>

          <Button
            onClick={() => openAuthModal("password_set_new")}
            size="lg"
            variant="cyber"
          >
            Set New Password
          </Button>

          <Button
            onClick={() => openAuthModal("password_change")}
            size="lg"
            variant="spice"
          >
            Change Password
          </Button>
        </div>

        {/* Instructions */}
        <div className="border rounded-lg p-6 space-y-4 bg-card">
          <h2 className="text-xl font-black uppercase tracking-wide">
            Implementation Notes
          </h2>
          <div className="space-y-2 text-sm font-semibold">
            <p>
              ⚠️ This is a demo component. All auth operations are simulated
              with random success/failure.
            </p>
            <p>
              ✅ To integrate with Supabase, replace the handler functions
              with actual Supabase auth calls.
            </p>
            <p>
              📝 Check the console for logged events and error messages.
            </p>
            <p>
              🎲 Operations have ~70% success rate for testing error handling.
            </p>
          </div>
        </div>

        {/* Code Example */}
        <div className="border rounded-lg p-6 space-y-4 bg-card">
          <h2 className="text-xl font-black uppercase tracking-wide">
            Integration Example
          </h2>
          <pre className="text-xs overflow-x-auto p-4 bg-muted rounded">
{`import { AuthModal } from '@/features/auth';

<AuthModal
  open={isAuthModalOpen}
  onOpenChange={setIsAuthModalOpen}
  initialState="login"
  onLogin={handleLogin}
  onRegister={handleRegister}
  onPasswordResetRequest={handlePasswordResetRequest}
  onPasswordSetNew={handlePasswordSetNew}
  onPasswordChange={handlePasswordChange}
  onCheckEmailVerification={handleCheckEmailVerification}
  onResendVerificationEmail={handleResendVerificationEmail}
  userEmail={userEmail}
  isLoading={isLoading}
  error={authError}
  onErrorDismiss={() => setAuthError(null)}
/>`}
          </pre>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        open={isAuthModalOpen}
        onOpenChange={setIsAuthModalOpen}
        initialState={authState}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onPasswordResetRequest={handlePasswordResetRequest}
        onPasswordSetNew={handlePasswordSetNew}
        onPasswordChange={handlePasswordChange}
        onCheckEmailVerification={handleCheckEmailVerification}
        onResendVerificationEmail={handleResendVerificationEmail}
        userEmail={userEmail}
        isLoading={isLoading}
        error={authError}
        onErrorDismiss={() => setAuthError(null)}
      />
    </div>
  );
}
