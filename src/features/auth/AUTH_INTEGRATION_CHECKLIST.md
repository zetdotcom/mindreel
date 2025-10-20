# 📋 Auth Integration Checklist

Use this checklist to integrate the authentication UI with Supabase backend.

## Phase 1: Repository Layer

### Create `src/features/auth/model/repository.ts`

- [x] Import Supabase client
- [x] Implement `login(email, password)` → `supabase.auth.signInWithPassword()`
- [x] Implement `register(email, password)` → `supabase.auth.signUp()`
- [x] Implement `logout()` → `supabase.auth.signOut()`
- [x] Implement `resetPassword(email)` → `supabase.auth.resetPasswordForEmail()`
- [x] Implement `updatePassword(newPassword)` → `supabase.auth.updateUser()`
- [x] Implement `getCurrentUser()` → `supabase.auth.getUser()`
- [x] Implement `resendVerification(email)` → `supabase.auth.resend()`
- [x] Add error handling and type conversions

## Phase 2: Auth Hook

### Create `src/features/auth/model/useAuth.ts`

- [x] Set up state: `session`, `user`, `loading`, `error`
- [x] Create `login()` wrapper calling repository
- [x] Create `register()` wrapper calling repository
- [x] Create `logout()` wrapper calling repository
- [x] Create `resetPassword()` wrapper
- [x] Create `updatePassword()` wrapper
- [x] Create `checkEmailVerification()` wrapper
- [x] Handle loading states
- [x] Handle error states
- [x] Return auth state and methods

## Phase 3: Auth Context

### Create `src/features/auth/model/AuthContext.tsx`

- [x] Create React context
- [x] Create provider component
- [x] Use `useAuth()` hook internally
- [x] Listen to Supabase auth state changes
- [x] Update context on auth events
- [x] Persist session (handled by Supabase SDK)
- [x] Handle token refresh (handled by Supabase SDK)
- [x] Export `useAuthContext()` hook

## Phase 4: App Integration

### Update root component

- [x] Wrap app with `AuthProvider`
- [x] Add AuthModal to root layout
- [x] Connect modal handlers to auth context
- [x] Handle initial auth state check (via useAuth)
- [ ] Add loading screen during auth check (optional)

### Example:
```tsx
import { AuthProvider } from '@/features/auth/model/AuthContext';
import { AuthModal } from '@/features/auth';

<AuthProvider>
  <App />
  <AuthModal {...props} />
</AuthProvider>
```

## Phase 5: Protected Features

### Create `src/features/auth/ui/ProtectedFeatureGate.tsx`

- [x] Check if user is authenticated
- [x] Check if email is verified
- [x] Show AuthModal if not authenticated
- [x] Show email verification notice if needed
- [x] Render children when authorized

### Usage:
```tsx
<ProtectedFeatureGate>
  <PremiumFeature />
</ProtectedFeatureGate>
```

## Phase 6: Supabase Configuration

### Update Supabase Dashboard

- [x] Enable email auth provider
- [ ] Configure email templates (verification, reset)
- [ ] Set up redirect URLs
- [ ] Configure email settings (SMTP if needed)
- [x] Set password requirements
- [x] **MVP: Email confirmation disabled** (`enable_confirmations = false` in config.toml) - users are auto-verified for easier local development

### Environment Variables

- [ ] `VITE_SUPABASE_URL` - Supabase project URL
- [ ] `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- [ ] Deep link URL scheme (for password recovery)

## Phase 7: Deep Link Handling

### For Electron app

- [ ] Register custom URL scheme (e.g., `mindreel://`)
- [ ] Handle `auth/verify` deep links
- [ ] Handle `auth/reset-password` deep links
- [ ] Parse recovery tokens from URL
- [ ] Open AuthModal in correct state
- [ ] Set recovery token in modal

## Phase 8: Regulations Modal

### Create `src/features/auth/ui/RegulationsModal.tsx`

- [ ] Create modal component
- [ ] Add Terms of Service content
- [ ] Add Privacy Policy content
- [ ] Add accept/decline buttons
- [ ] Link from registration form
- [ ] Style consistently

## Phase 9: Testing

### Manual Testing

- [ ] Register new account
- [ ] Verify email works
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Request password reset
- [ ] Complete password reset flow
- [ ] Change password (logged in)
- [ ] Logout
- [ ] Access protected feature (unauthorized)
- [ ] Access protected feature (unverified email)
- [ ] Access protected feature (authorized)

### Error Scenarios

- [ ] Network error during login
- [ ] Email already registered
- [ ] Invalid credentials
- [ ] Unverified email login attempt
- [ ] Password too short
- [ ] Passwords don't match
- [x] Registration implies ToS acceptance (informational modal planned)

### Edge Cases

- [ ] Expired recovery token
- [ ] Multiple login attempts
- [ ] Session expiration
- [ ] Concurrent sessions
- [ ] Email case sensitivity

## Phase 10: Polish

### User Experience

- [ ] Add loading spinners
- [ ] Add success toasts
- [ ] Add error toasts
- [ ] Smooth transitions between states
- [ ] Remember email on error
- [ ] Auto-focus first field

### Accessibility

- [ ] Test with keyboard only
- [ ] Test with screen reader
- [ ] Check focus management
- [ ] Verify ARIA labels
- [ ] Check color contrast

### Performance

- [ ] Optimize re-renders
- [ ] Add request debouncing
- [ ] Cache user data
- [ ] Lazy load modal

## Verification

### Before considering complete:

- [ ] All checklist items completed
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] Tested on multiple devices
- [ ] Tested in different browsers

---

## Resources

- [Auth Feature README](src/features/auth/README.md)
- [Quick Start Guide](src/features/auth/QUICKSTART.md)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Auth Spec](.ai/auth-spec.md)

## Questions?

Review the example component for working patterns:
- `src/features/auth/ui/AuthModalExample.tsx`
