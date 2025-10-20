/**
 * Auth feature types and validation utilities
 */

/**
 * Available authentication states for the modal
 */
export type AuthState =
  | 'login'
  | 'register'
  | 'email_verification_pending'
  | 'password_reset_request'
  | 'password_set_new'
  | 'password_change';

/**
 * Form validation error structure
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Login form data
 */
export interface LoginFormData {
  email: string;
  password: string;
}

/**
 * Registration form data
 */
export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  tosAccepted: boolean;
}

/**
 * Password reset request form data
 */
export interface PasswordResetRequestFormData {
  email: string;
}

/**
 * New password form data (after recovery link)
 */
export interface PasswordSetNewFormData {
  password: string;
  confirmPassword: string;
}

/**
 * Password change form data (for logged-in users)
 */
export interface PasswordChangeFormData {
  currentPassword?: string; // Optional - may not be required
  newPassword: string;
  confirmPassword: string;
}

/**
 * Validation error messages
 */
export const ValidationMessages = {
  EMAIL_INVALID: 'Invalid email address',
  PASSWORD_TOO_SHORT: 'Password is too short (min 8 chars)',
  PASSWORDS_DO_NOT_MATCH: 'Passwords do not match',
  TOS_NOT_ACCEPTED: 'You must accept Terms of Service',
  NETWORK_ERROR: 'Network error, please try again',
  INVALID_CREDENTIALS: 'Invalid credentials',
  EMAIL_ALREADY_REGISTERED: 'Email already registered',
  EMAIL_NOT_VERIFIED: 'Please verify your email to access this feature',
  PASSWORD_RECOVERY_SENT: 'If the account exists, password recovery instructions were sent',
  PASSWORD_UPDATED: 'Password updated',
  PASSWORD_UPDATE_FAILED: 'Could not update password',
} as const;

/**
 * Minimum password length
 */
export const MIN_PASSWORD_LENGTH = 8;

/**
 * Email validation regex (simplified)
 */
export const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Validate email address
 */
export function validateEmail(email: string): string | null {
  if (!email.trim()) {
    return ValidationMessages.EMAIL_INVALID;
  }
  if (!EMAIL_REGEX.test(email)) {
    return ValidationMessages.EMAIL_INVALID;
  }
  return null;
}

/**
 * Validate password
 */
export function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return ValidationMessages.PASSWORD_TOO_SHORT;
  }
  return null;
}

/**
 * Validate password confirmation
 */
export function validatePasswordConfirm(
  password: string,
  confirmPassword: string
): string | null {
  if (password !== confirmPassword) {
    return ValidationMessages.PASSWORDS_DO_NOT_MATCH;
  }
  return null;
}

/**
 * Validate login form
 */
export function validateLoginForm(data: LoginFormData): ValidationError[] {
  const errors: ValidationError[] = [];

  const emailError = validateEmail(data.email);
  if (emailError) {
    errors.push({ field: 'email', message: emailError });
  }

  if (!data.password) {
    errors.push({ field: 'password', message: ValidationMessages.PASSWORD_TOO_SHORT });
  }

  return errors;
}

/**
 * Validate registration form
 */
export function validateRegisterForm(data: RegisterFormData): ValidationError[] {
  const errors: ValidationError[] = [];

  const emailError = validateEmail(data.email);
  if (emailError) {
    errors.push({ field: 'email', message: emailError });
  }

  const passwordError = validatePassword(data.password);
  if (passwordError) {
    errors.push({ field: 'password', message: passwordError });
  }

  const confirmError = validatePasswordConfirm(data.password, data.confirmPassword);
  if (confirmError) {
    errors.push({ field: 'confirmPassword', message: confirmError });
  }

  if (!data.tosAccepted) {
    errors.push({ field: 'tosAccepted', message: ValidationMessages.TOS_NOT_ACCEPTED });
  }

  return errors;
}

/**
 * Validate password reset request form
 */
export function validatePasswordResetRequestForm(
  data: PasswordResetRequestFormData
): ValidationError[] {
  const errors: ValidationError[] = [];

  const emailError = validateEmail(data.email);
  if (emailError) {
    errors.push({ field: 'email', message: emailError });
  }

  return errors;
}

/**
 * Validate new password form
 */
export function validatePasswordSetNewForm(
  data: PasswordSetNewFormData
): ValidationError[] {
  const errors: ValidationError[] = [];

  const passwordError = validatePassword(data.password);
  if (passwordError) {
    errors.push({ field: 'password', message: passwordError });
  }

  const confirmError = validatePasswordConfirm(data.password, data.confirmPassword);
  if (confirmError) {
    errors.push({ field: 'confirmPassword', message: confirmError });
  }

  return errors;
}

/**
 * Validate password change form
 */
export function validatePasswordChangeForm(
  data: PasswordChangeFormData
): ValidationError[] {
  const errors: ValidationError[] = [];

  const passwordError = validatePassword(data.newPassword);
  if (passwordError) {
    errors.push({ field: 'newPassword', message: passwordError });
  }

  const confirmError = validatePasswordConfirm(data.newPassword, data.confirmPassword);
  if (confirmError) {
    errors.push({ field: 'confirmPassword', message: confirmError });
  }

  return errors;
}
