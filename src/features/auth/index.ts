/**
 * Auth feature public API
 * Exports UI components and types for authentication functionality
 */

// UI Components
export { AuthModal } from "./ui/AuthModal";
export { AuthFormLogin } from "./ui/AuthFormLogin";
export { AuthFormRegister } from "./ui/AuthFormRegister";
export { AuthEmailVerificationNotice } from "./ui/AuthEmailVerificationNotice";
export { AuthFormPasswordResetRequest } from "./ui/AuthFormPasswordResetRequest";
export { AuthFormPasswordSetNew } from "./ui/AuthFormPasswordSetNew";
export { AuthFormPasswordChange } from "./ui/AuthFormPasswordChange";
export { AuthErrorBanner } from "./ui/AuthErrorBanner";
export { FormField } from "./ui/FormField";
export { AuthModalExample } from "./ui/AuthModalExample";
export { ProtectedFeatureGate } from "./ui/ProtectedFeatureGate";

// Types
export type {
  AuthState,
  LoginFormData,
  RegisterFormData,
  PasswordResetRequestFormData,
  PasswordSetNewFormData,
  PasswordChangeFormData,
  ValidationError,
} from "./model/types";

// Validation utilities
export {
  validateEmail,
  validatePassword,
  validatePasswordConfirm,
  validateLoginForm,
  validateRegisterForm,
  validatePasswordResetRequestForm,
  validatePasswordSetNewForm,
  validatePasswordChangeForm,
  ValidationMessages,
  MIN_PASSWORD_LENGTH,
} from "./model/types";

export { AuthProvider, useAuthContext } from "./model/AuthContext";

export type { UseAuthReturn, UseAuthState, UseAuthActions } from "./model/useAuth";
