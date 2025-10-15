import React from "react";
import { createRoot } from "react-dom/client";
import { CaptureWindowView } from "./views/CaptureWindow/CaptureWindowView";
import "./index.css";

/**
 * Capture Window Entry Point
 *
 * Separate React application entry for the capture popup window.
 * This runs in its own renderer process, isolated from the main dashboard.
 *
 * Architecture:
 *  - Uses same preload.js for IPC access
 *  - Shares features/ code but has different view composition
 *  - Minimal bootstrap - just render CaptureWindowView
 */

const container = document.getElementById("root");
if (!container) {
  throw new Error("Failed to find root element for capture window");
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <CaptureWindowView />
  </React.StrictMode>,
);
