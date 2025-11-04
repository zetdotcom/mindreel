/// <reference types="@electron-forge/plugin-vite/forge-vite-env" />

import path from "node:path";
import { BrowserWindow, ipcMain } from "electron";

// Vite environment variables injected by Electron Forge at build time
declare const CAPTURE_WINDOW_VITE_DEV_SERVER_URL: string;
declare const CAPTURE_WINDOW_VITE_NAME: string;

/**
 * Capture Window Handlers
 *
 * IPC handlers for managing the capture popup window lifecycle.
 * Responsibilities:
 *  - Create and manage capture popup window
 *  - Handle window open/close requests from renderer
 *  - Ensure only one capture window exists at a time
 */

let captureWindow: BrowserWindow | null = null;

/**
 * Create the capture popup window.
 * Returns existing window if already open.
 * Exported for use by global shortcut manager.
 */
export function createCaptureWindow(): BrowserWindow {
  // Reuse existing (focus) if already open
  if (captureWindow && !captureWindow.isDestroyed()) {
    captureWindow.focus();
    return captureWindow;
  }

  // Create new capture window
  captureWindow = new BrowserWindow({
    width: 600,
    height: 700,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    alwaysOnTop: true,
    frame: true,
    title: "Add Entry - MindReel",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: "#0a0a0a", // neutral-950
  });

  // Load the capture window HTML (explicit capture.html in dev to avoid main bundle)
  if (CAPTURE_WINDOW_VITE_DEV_SERVER_URL) {
    const devCaptureUrl = `${CAPTURE_WINDOW_VITE_DEV_SERVER_URL}/src/capture.html`;
    captureWindow.loadURL(devCaptureUrl).catch((err) => {
      console.error(
        "[capture] Failed to load capture.html dev URL, falling back to base:",
        err,
      );
      captureWindow?.loadURL(CAPTURE_WINDOW_VITE_DEV_SERVER_URL);
    });
  } else {
    const prodPath = path.join(
      __dirname,
      `../renderer/${CAPTURE_WINDOW_VITE_NAME}/src/capture.html`,
    );
    captureWindow.loadFile(prodPath);
  }

  // Cleanup
  captureWindow.on("closed", () => {
    captureWindow = null;
  });

  captureWindow.center();
  return captureWindow;
}

/**
 * Close the capture window if it exists.
 */
function closeCaptureWindow(): void {
  if (captureWindow && !captureWindow.isDestroyed()) {
    captureWindow.close();
    captureWindow = null;
  }
}

/**
 * Register IPC handlers for capture window management.
 * Called during app initialization in main.ts
 */
export function registerCaptureWindowHandlers(): void {
  ipcMain.handle("capture:openPopup", () => {
    createCaptureWindow();
  });

  ipcMain.handle("capture:closePopup", () => {
    closeCaptureWindow();
  });
}

/**
 * Cleanup function to close capture window on app quit.
 * Should be called during app shutdown.
 */
export function cleanupCaptureWindow(): void {
  closeCaptureWindow();
}
