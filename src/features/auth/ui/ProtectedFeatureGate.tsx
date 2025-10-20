import { useEffect } from "react";
import { useAuthContext } from "../model/AuthContext";

interface ProtectedFeatureGateProps {
  children: React.ReactNode;
  requireEmailVerification?: boolean;
  fallback?: React.ReactNode;
  onUnauthorized?: () => void;
}

export function ProtectedFeatureGate({
  children,
  requireEmailVerification = true,
  fallback = null,
  onUnauthorized,
}: ProtectedFeatureGateProps) {
  const { authenticated, emailVerified, openAuthModal } = useAuthContext();

  useEffect(() => {
    if (!authenticated) {
      onUnauthorized?.();
      openAuthModal("login");
      return;
    }

    if (requireEmailVerification && !emailVerified) {
      onUnauthorized?.();
      openAuthModal("email_verification_pending");
    }
  }, [authenticated, emailVerified, requireEmailVerification, openAuthModal, onUnauthorized]);

  if (!authenticated) {
    return fallback;
  }

  if (requireEmailVerification && !emailVerified) {
    return fallback;
  }

  return <>{children}</>;
}
