# Auth Feature

Authentication UI components for MindReel. Provides login, registration, email verification, and password management flows.

## Architecture

This feature follows the Feature-Sliced Design (FSD) architecture:

```
features/auth/
├── model/
│   └── types.ts          # Types and validation utilities
├── ui/
│   ├── AuthModal.tsx     # Main modal orchestrator
│   ├── AuthFormLogin.tsx
│   ├── AuthFormRegister.tsx
│   ├── AuthEmailVerificationNotice.tsx
│   ├── AuthFormPasswordResetRequest.tsx
│   ├── AuthFormPasswordSetNew.tsx
│   ├── AuthFormPasswordChange.tsx
│   ├── AuthErrorBanner.tsx
│   └── FormField.tsx     # Reusable form field component
├── index.ts              # Public API
└── README.md
```

## Usage

### Basic Login/Register Flow

```tsx
import { AuthModal } from '@/features/auth';
import { useState } from 'react';

function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      // TODO: Call your auth service
      // await authService.login(data.email, data.password);
      console.log('Login:', data);
      setIsAuthModalOpen(false);
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterFormData) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      // TODO: Call your auth service
      // await authService.register(data.email, data.password);
      console.log('Register:', data);
      // Modal will automatically transition to email verification state
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button onClick={() => setIsAuthModalOpen(true)}>
        Login / Sign Up
      </button>

      <AuthModal
        open={isAuthModalOpen}
        onOpenChange={setIsAuthModalOpen}
        initialState="login"
        onLogin={handleLogin}
        onRegister={handleRegister}
        isLoading={isLoading}
        error={authError}
        onErrorDismiss={() => setAuthError(null)}
      />
    </div>
  );
}
```

### Email Verification Flow

```tsx
const handleCheckEmailVerification = async (): Promise<boolean> => {
  try {
    // TODO: Call your auth service to check if email is verified
    // const user = await authService.getCurrentUser();
    // return user?.emailVerified ?? false;
    return false;
  } catch (error) {
    console.error('Verification check failed:', error);
    return false;
  }
};

const handleResendVerificationEmail = async () => {
  try {
    // TODO: Call your auth service to resend verification email
    // await authService.resendVerificationEmail();
    console.log('Verification email resent');
  } catch (error) {
    console.error('Failed to resend:', error);
  }
};

<AuthModal
  open={isAuthModalOpen}
  onOpenChange={setIsAuthModalOpen}
  initialState="email_verification_pending"
  onCheckEmailVerification={handleCheckEmailVerification}
  onResendVerificationEmail={handleResendVerificationEmail}
  userEmail="user@example.com"
/>
```

### Password Reset Flow

```tsx
const handlePasswordResetRequest = async (data: PasswordResetRequestFormData) => {
  try {
    // TODO: Call your auth service to send password reset email
    // await authService.sendPasswordResetEmail(data.email);
    console.log('Password reset requested for:', data.email);
  } catch (error) {
    setAuthError(error.message);
  }
};

const handlePasswordSetNew = async (data: PasswordSetNewFormData) => {
  try {
    // TODO: Call your auth service to update password
    // await authService.updatePassword(data.password);
    console.log('New password set');
    // Modal will close automatically after success
  } catch (error) {
    setAuthError(error.message);
  }
};

<AuthModal
  open={isAuthModalOpen}
  onOpenChange={setIsAuthModalOpen}
  initialState="password_reset_request"
  onPasswordResetRequest={handlePasswordResetRequest}
  onPasswordSetNew={handlePasswordSetNew}
/>
```

### Password Change (Logged-in Users)

```tsx
const handlePasswordChange = async (data: PasswordChangeFormData) => {
  try {
    // TODO: Call your auth service
    // await authService.changePassword(data.newPassword);
    console.log('Password changed');
    // Modal will close automatically after success
  } catch (error) {
    setAuthError(error.message);
  }
};

<AuthModal
  open={isAuthModalOpen}
  onOpenChange={setIsAuthModalOpen}
  initialState="password_change"
  onPasswordChange={handlePasswordChange}
  userEmail="user@example.com"
/>
```

## Auth States

The modal supports the following states:

- `login` - Login form
- `register` - Registration form with ToS acceptance
- `email_verification_pending` - Email verification notice
- `password_reset_request` - Password reset request form
- `password_set_new` - Set new password (after recovery link)
- `password_change` - Change password (for logged-in users)

State transitions are handled automatically by the modal:

- `register` → `email_verification_pending` (after successful registration)
- `password_reset_request` → `login` (after sending reset email)
- `password_set_new` → closes modal (after successful password update)
- `password_change` → closes modal (after successful password update)

## Validation

All forms include client-side validation:

### Email Validation
- Must match regex: `/^[^@\s]+@[^@\s]+\.[^@\s]+$/`
- Error: "Invalid email address"

### Password Validation
- Minimum 8 characters
- Error: "Password is too short (min 8 chars)"

### Password Confirmation
- Must match password field
- Error: "Passwords do not match"

### Terms of Service
- Must be checked during registration
- Error: "You must accept Terms of Service"

## Validation Utilities

You can use the validation utilities directly if needed:

```tsx
import {
  validateEmail,
  validatePassword,
  validatePasswordConfirm,
  validateLoginForm,
  ValidationMessages,
} from '@/features/auth';

// Validate individual fields
const emailError = validateEmail('user@example.com');
const passwordError = validatePassword('mypassword');
const confirmError = validatePasswordConfirm('password1', 'password2');

// Validate entire form
const errors = validateLoginForm({
  email: 'user@example.com',
  password: 'mypassword'
});

// Use validation messages
console.log(ValidationMessages.EMAIL_INVALID);
console.log(ValidationMessages.PASSWORD_TOO_SHORT);
```

## Styling

All components use the app's brutalist design system with:

- **Shadow effects**: `shadow-glow`, `shadow-glow-subtle`
- **Border styles**: `border-glow`, `border-brutal`
- **Typography**: Uppercase, bold, wide tracking
- **Buttons**: Gradient backgrounds with hover/active states
- **Inputs**: High contrast with focus states
- **Alerts**: Color-coded for different states (error, warning, success)

Components are styled to match existing UI patterns in:
- `features/history/ui/WeekGroup.tsx`
- `features/history/ui/DayGroup.tsx`

## Accessibility

All components follow accessibility best practices:

- **Focus trap**: Modal traps focus within itself
- **Keyboard navigation**: Full keyboard support with Tab/Shift+Tab
- **ARIA labels**: Proper `aria-invalid`, `aria-describedby`, etc.
- **Screen reader support**: Error messages announced, form fields properly labeled
- **Escape key**: Closes modal (except during critical flows)

## Error Handling

Errors should be passed to the modal via the `error` prop:

```tsx
const [authError, setAuthError] = useState<string | null>(null);

try {
  await someAuthOperation();
} catch (error) {
  if (error.code === 'auth/invalid-credential') {
    setAuthError(ValidationMessages.INVALID_CREDENTIALS);
  } else if (error.code === 'auth/email-already-in-use') {
    setAuthError(ValidationMessages.EMAIL_ALREADY_REGISTERED);
  } else {
    setAuthError(ValidationMessages.NETWORK_ERROR);
  }
}

<AuthModal
  error={authError}
  onErrorDismiss={() => setAuthError(null)}
  // ...other props
/>
```

## Next Steps

To complete the auth implementation:

1. **Auth repository implemented** (`model/repository.ts`):
   - Provides Supabase auth method wrappers (login, register, logout, resetPassword, updatePassword, getCurrentUser, resendVerification)
   - Normalizes responses `{ ok, data, error }` for UI consumption

2. **Create auth hooks** (`model/useAuth.ts`):
   - Wrap repository calls with React state (loading, error, emailVerified)
   - Provide auth context/store for global access

3. **Integrate with app**:
   - Wrap root with AuthProvider (to be created)
   - Wire AuthModal handlers to repository
   - Reuse Supabase session for persistence
   - Implement ProtectedFeatureGate for gated UI

4. **Add regulations modal**:
   - Create separate modal for Terms of Service (informational only; registering implies acceptance)
   - Optional link from registration form

## Testing Checklist

- [ ] Login with valid credentials
- [ ] Login with invalid credentials (show error)
- [ ] Register new account
- [ ] Registration implies ToS acceptance (informational modal link)
- [ ] Switch between login and register
- [ ] Request password reset
- [ ] Set new password (via recovery link)
- [ ] Change password (logged-in user)
- [ ] Check email verification
- [ ] Resend verification email
- [ ] Dismiss errors
- [ ] Close modal with Escape key
- [ ] Keyboard navigation through forms
- [ ] Form validation errors display correctly
- [ ] Loading states work correctly
- [ ] Success messages display and auto-dismiss