# Auth Feature Quick Start Guide

## 🚀 Getting Started in 5 Minutes

This guide shows you how to quickly integrate the authentication UI into your MindReel app.

## Step 1: Import the AuthModal

```tsx
import { AuthModal } from '@/features/auth';
import { useState } from 'react';
```

## Step 2: Add State Management

```tsx
function MyComponent() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');
}
```

## Step 3: Create Handler Functions

### Minimal Setup (Stubs)

```tsx
const handleLogin = async (data) => {
  setIsLoading(true);
  try {
    console.log('Login:', data);
    // TODO: Add Supabase call
  } catch (error) {
    setAuthError(error.message);
  } finally {
    setIsLoading(false);
  }
};

const handleRegister = async (data) => {
  setIsLoading(true);
  try {
    console.log('Register:', data);
    setUserEmail(data.email);
    // TODO: Add Supabase call
  } catch (error) {
    setAuthError(error.message);
  } finally {
    setIsLoading(false);
  }
};
```

### With Supabase Integration

```tsx
import { supabase } from '@/supabase/rendererClient';

const handleLogin = async (data) => {
  setIsLoading(true);
  setAuthError(null);
  
  try {
    const { data: result, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    
    if (error) throw error;
    
    // Check if email is verified
    if (!result.user?.email_confirmed_at) {
      setUserEmail(data.email);
      // AuthModal will handle state transition
      return;
    }
    
    // Success - close modal
    setIsAuthModalOpen(false);
  } catch (error) {
    setAuthError(error.message || 'Login failed');
  } finally {
    setIsLoading(false);
  }
};

const handleRegister = async (data) => {
  setIsLoading(true);
  setAuthError(null);
  
  try {
    const { data: result, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/verify`,
      },
    });
    
    if (error) throw error;
    
    setUserEmail(data.email);
    // Modal automatically transitions to email_verification_pending
  } catch (error) {
    if (error.message.includes('already registered')) {
      setAuthError('Email already registered');
    } else {
      setAuthError(error.message || 'Registration failed');
    }
  } finally {
    setIsLoading(false);
  }
};

const handlePasswordResetRequest = async (data) => {
  setIsLoading(true);
  setAuthError(null);
  
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    
    if (error) throw error;
    
    // Success message shown by modal
  } catch (error) {
    setAuthError(error.message || 'Failed to send reset email');
  } finally {
    setIsLoading(false);
  }
};

const handlePasswordSetNew = async (data) => {
  setIsLoading(true);
  setAuthError(null);
  
  try {
    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });
    
    if (error) throw error;
    
    // Modal will close automatically
  } catch (error) {
    setAuthError(error.message || 'Failed to update password');
  } finally {
    setIsLoading(false);
  }
};

const handleCheckEmailVerification = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) throw error;
    
    if (user?.email_confirmed_at) {
      return true; // Verified - modal will close
    }
    
    setAuthError('Email not verified yet. Please check your inbox.');
    return false;
  } catch (error) {
    setAuthError('Failed to check verification status');
    return false;
  }
};

const handleResendVerificationEmail = async () => {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: userEmail,
    });
    
    if (error) throw error;
  } catch (error) {
    setAuthError('Failed to resend verification email');
  }
};
```

## Step 4: Add the Modal to Your Component

```tsx
return (
  <div>
    {/* Your app content */}
    <button onClick={() => setIsAuthModalOpen(true)}>
      Login / Sign Up
    </button>

    {/* Auth Modal */}
    <AuthModal
      open={isAuthModalOpen}
      onOpenChange={setIsAuthModalOpen}
      initialState="login"
      onLogin={handleLogin}
      onRegister={handleRegister}
      onPasswordResetRequest={handlePasswordResetRequest}
      onPasswordSetNew={handlePasswordSetNew}
      onCheckEmailVerification={handleCheckEmailVerification}
      onResendVerificationEmail={handleResendVerificationEmail}
      userEmail={userEmail}
      isLoading={isLoading}
      error={authError}
      onErrorDismiss={() => setAuthError(null)}
    />
  </div>
);
```

## Complete Example

```tsx
import { AuthModal, LoginFormData, RegisterFormData } from '@/features/auth';
import { supabase } from '@/supabase/rendererClient';
import { useState } from 'react';

export function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    setAuthError(null);
    
    try {
      const { data: result, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      
      if (error) throw error;
      
      if (!result.user?.email_confirmed_at) {
        setUserEmail(data.email);
        return;
      }
      
      setIsAuthModalOpen(false);
    } catch (error: any) {
      setAuthError(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterFormData) => {
    setIsLoading(true);
    setAuthError(null);
    
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });
      
      if (error) throw error;
      
      setUserEmail(data.email);
    } catch (error: any) {
      setAuthError(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <header>
        <button onClick={() => setIsAuthModalOpen(true)}>
          Login
        </button>
      </header>

      <AuthModal
        open={isAuthModalOpen}
        onOpenChange={setIsAuthModalOpen}
        initialState="login"
        onLogin={handleLogin}
        onRegister={handleRegister}
        userEmail={userEmail}
        isLoading={isLoading}
        error={authError}
        onErrorDismiss={() => setAuthError(null)}
      />
    </div>
  );
}
```

## Common Patterns

### Opening Modal in Different States

```tsx
// Open to login
setAuthState('login');
setIsAuthModalOpen(true);

// Open to register
setAuthState('register');
setIsAuthModalOpen(true);

// Open to password reset
setAuthState('password_reset_request');
setIsAuthModalOpen(true);
```

### Handling Auth State Changes

```tsx
// Listen to auth state changes
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      if (event === 'SIGNED_IN') {
        setIsAuthModalOpen(false);
        console.log('User signed in:', session?.user);
      }
      if (event === 'SIGNED_OUT') {
        console.log('User signed out');
      }
    }
  );

  return () => subscription.unsubscribe();
}, []);
```

### Getting Current User

```tsx
const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};
```

### Protected Features

```tsx
function ProtectedFeature() {
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setShowAuthModal(true);
    } else {
      setUser(user);
    }
  };

  if (!user) {
    return (
      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        // ... handlers
      />
    );
  }

  return <div>Protected Content</div>;
}
```

## Testing

### Run the Example Component

```tsx
import { AuthModalExample } from '@/features/auth/ui/AuthModalExample';

// In your routes or test page
<AuthModalExample />
```

### Manual Testing Checklist

- [ ] Open login form
- [ ] Submit with valid/invalid email
- [ ] Submit with short password
- [ ] Switch to registration
- [ ] Register without accepting ToS
- [ ] Register with mismatched passwords
- [ ] Test "Forgot password?" flow
- [ ] Test keyboard navigation (Tab, Enter, Escape)
- [ ] Test error dismissal
- [ ] Test modal closing

## Troubleshooting

### Modal doesn't open
- Check that `open` prop is set to `true`
- Verify Dialog component is imported correctly

### Validation not working
- Ensure form data types match expected interfaces
- Check console for validation errors

### Supabase errors
- Verify Supabase client is initialized
- Check Supabase dashboard for auth settings
- Ensure email templates are configured

### TypeScript errors
- Import types: `import type { LoginFormData } from '@/features/auth'`
- Add proper type annotations to handler functions

## Next Steps

1. **Add Auth Context**: Create a global auth context/provider
2. **Protected Routes**: Guard routes that require authentication
3. **Session Persistence**: Handle session storage and refresh
4. **Deep Links**: Handle password recovery URLs
5. **Regulations Modal**: Create Terms of Service modal
6. **Avatar/Profile**: Add user profile management

## Resources

- [Full Documentation](./README.md)
- [Implementation Summary](../../IMPLEMENTATION_SUMMARY.md)
- [Auth Specification](../../.ai/auth-spec.md)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)

## Support

For issues or questions:
1. Check the README.md for detailed API documentation
2. Review the AuthModalExample.tsx for working examples
3. Consult the auth-spec.md for architectural decisions