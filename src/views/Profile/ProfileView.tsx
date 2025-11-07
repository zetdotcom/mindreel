import React from "react";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/features/auth";

export function ProfileView() {
  const { authenticated, emailVerified, user, openAuthModal, logout } = useAuthContext();

  return (
    <main className="min-h-screen w-full bg-background px-8 py-10 text-foreground">
      <div className="mx-auto max-w-3xl space-y-10">
        <header>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Profile</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </header>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-3">Account</h2>
          {authenticated ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Email</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Status</p>
                <p className="text-sm text-muted-foreground">
                  {emailVerified ? (
                    <span className="text-green-600 dark:text-green-400">Verified</span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400">
                      Email verification pending
                    </span>
                  )}
                </p>
              </div>
              <Button variant="destructive" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Sign in to sync your data and access AI-powered features.
              </p>
              <Button variant="default" size="sm" onClick={() => openAuthModal("login")}>
                Login
              </Button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default ProfileView;
