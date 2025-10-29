import type React from "react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { AuthState } from "./types";
import { type UseAuthReturn, useAuth } from "./useAuth";

interface AuthModalControl {
  isAuthModalOpen: boolean;
  authModalInitialState: AuthState;
  openAuthModal: (initialState?: AuthState) => void;
  closeAuthModal: () => void;
}

interface AuthContextValue extends UseAuthReturn, AuthModalControl {}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialState, setAuthModalInitialState] = useState<AuthState>("login");

  const openAuthModal = useCallback((initialState: AuthState = "login") => {
    setAuthModalInitialState(initialState);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...auth,
      isAuthModalOpen,
      authModalInitialState,
      openAuthModal,
      closeAuthModal,
    }),
    [auth, isAuthModalOpen, authModalInitialState, openAuthModal, closeAuthModal],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
