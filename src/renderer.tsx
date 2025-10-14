import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { DashboardView } from "./views/Dashboard/DashboardView";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root container #root not found");
}

const root = createRoot(container);
root.render(<DashboardView />);
