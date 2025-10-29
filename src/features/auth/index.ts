/**
 * Auth feature public API
 * Exports UI components and types for authentication functionality
 */

export { AuthProvider, useAuthContext } from "./model/AuthContext";
// Types
export type {
  AuthState,
  LoginFormData,
  PasswordChangeFormData,
  PasswordResetRequestFormData,
  PasswordSetNewFormData,
  RegisterFormData,
  ValidationError,
} from "./model/types";
// Validation utilities
export {
  MIN_PASSWORD_LENGTH,
  ValidationMessages,
  validateEmail,
  validateLoginForm,
  validatePassword,
  validatePasswordChangeForm,
  validatePasswordConfirm,
  validatePasswordResetRequestForm,
  validatePasswordSetNewForm,
  validateRegisterForm,
} from "./model/types";
export type {
  UseAuthActions,
  UseAuthReturn,
  UseAuthState,
} from "./model/useAuth";
export { AuthEmailVerificationNotice } from "./ui/AuthEmailVerificationNotice";
export { AuthErrorBanner } from "./ui/AuthErrorBanner";
export { AuthFormLogin } from "./ui/AuthFormLogin";
export { AuthFormPasswordChange } from "./ui/AuthFormPasswordChange";
export { AuthFormPasswordResetRequest } from "./ui/AuthFormPasswordResetRequest";
export { AuthFormPasswordSetNew } from "./ui/AuthFormPasswordSetNew";
export { AuthFormRegister } from "./ui/AuthFormRegister";
// UI Components
export { AuthModal } from "./ui/AuthModal";
export { FormField } from "./ui/FormField";
export { ProtectedFeatureGate } from "./ui/ProtectedFeatureGate";
