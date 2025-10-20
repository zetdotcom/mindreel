import React, { createContext, useContext, useMemo, useState, useCallback } from "react";
import { useAuth, type UseAuthReturn } from "./useAuth";
import type { AuthState } from "./types";

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
