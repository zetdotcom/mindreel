import React, { lazy, Suspense } from "react";
import { useRoutes, Navigate } from "react-router";
import type { RouteObject } from "react-router";

/**
 * Application route definitions (declarative mode).
 *
 * Responsibilities:
 * - Central, typed list of top-level routes
 * - Redirect root "/" to history as the default landing page
 * - Provide placeholders for Settings and Profile (mocked per specification)
 * - History page uses existing feature composition with capture button logic
 *
 * Integration pattern (in Main layout component):
 *   const content = useRoutes(routes);
 *   return (
 *     <Layout>
 *       {content}
 *     </Layout>
 *   );
 *
 * Lazy-loading keeps initial bundle smaller while allowing future code-splitting.
 */

// --- Lazy View Imports -------------------------------------------------------
const HistoryPageView = lazy(() =>
  import("@/views/History/HistoryPageView").then((m) => ({
    // Support either default export or named export fallback
    default: m.default || (m as any).HistoryPageView,
  })),
);
// (Settings/Profile are trivial placeholders; keeping them non-lazy is fine)

// --- Placeholder / Mock Views ------------------------------------------------
function SettingsView() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Settings</h1>
      <p className="text-sm text-muted-foreground">
        Settings implementation pending.
      </p>
    </div>
  );
}

function ProfileView() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Profile</h1>
      <p className="text-sm text-muted-foreground">
        Profile view placeholder content.
      </p>
    </div>
  );
}

function NotFoundView() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Not Found</h1>
      <p className="text-sm text-muted-foreground">
        The page you requested does not exist.
      </p>
    </div>
  );
}

// --- Route Definitions -------------------------------------------------------
export const routes: RouteObject[] = [
  {
    path: "/",
    element: <Navigate to="/history" replace />,
  },
  {
    path: "/history",
    element: (
      <Suspense
        fallback={
          <div className="p-6 text-sm text-muted-foreground">Loading…</div>
        }
      >
        <HistoryPageView />
      </Suspense>
    ),
  },
  {
    path: "/settings",
    element: <SettingsView />,
  },
  {
    path: "/profile",
    element: <ProfileView />,
  },
  {
    path: "*",
    element: <NotFoundView />,
  },
];

// --- Declarative Routes Hook Wrapper -----------------------------------------
/**
 * AppRoutes
 * Wraps useRoutes with predefined route objects.
 *
 * Usage:
 *   <AppRoutes /> inside the scrollable right-hand content area.
 */
export function AppRoutes() {
  return useRoutes(routes);
}

// --- Export Convenience ------------------------------------------------------
export {
  SettingsView,
  ProfileView,
  NotFoundView, // in case layout-level error boundaries need direct import
};
