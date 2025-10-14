import React from "react";
import { DashboardView } from "@/views/Dashboard/DashboardView";

/**
 * DEPRECATED: Legacy App component kept for backward compatibility.
 * Use <DashboardView /> directly in new code.
 */
export function App() {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.warn("[App] Deprecated. Use <DashboardView /> instead.");
  }
  return <DashboardView />;
}

export default App;
