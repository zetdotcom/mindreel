/// <reference types="@electron-forge/plugin-vite/forge-vite-env" />

import { app, BrowserWindow } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import { registerPing } from "./ipc/setupPing";
import {
  registerDatabaseHandlers,
  initializeDatabase,
  closeDatabase,
} from "./ipc/databaseHandlers";
import {
  registerCaptureWindowHandlers,
  cleanupCaptureWindow,
  createCaptureWindow,
} from "./ipc/captureWindowHandlers";
import {
  initializeGlobalShortcut,
  registerGlobalShortcutHandlers,
  cleanupGlobalShortcuts,
} from "./ipc/globalShortcutManager";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    const prodMainPath = path.join(
      __dirname,
      `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`,
    );
    mainWindow.loadFile(prodMainPath);
  }

  // Open DevTools only in development
  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  try {
    console.log("=== MindReel App Starting ===");

    // Initialize database first
    console.log("Initializing database...");
    await initializeDatabase();
    console.log("Database initialized successfully");

    // Register IPC handlers
    console.log("Registering IPC handlers...");
    registerPing();
    console.log("Ping handler registered");
    registerDatabaseHandlers();
    console.log("Database handlers registered");
    registerCaptureWindowHandlers();
    console.log("Capture window handlers registered");

    // Register global shortcut handlers and initialize shortcuts
    console.log("Initializing global shortcuts...");
    const shortcutCallback = () => {
      console.log("[SHORTCUT PRESSED] Opening capture window...");
      try {
        createCaptureWindow();
        console.log("[SHORTCUT PRESSED] Capture window opened successfully");
      } catch (error) {
        console.error(
          "[SHORTCUT PRESSED] Error opening capture window:",
          error,
        );
      }
    };

    registerGlobalShortcutHandlers(shortcutCallback);
    await initializeGlobalShortcut(shortcutCallback);
    console.log("Global shortcuts initialized");

    // Create the main window
    console.log("Creating main window...");
    createWindow();
    console.log("=== MindReel App Started Successfully ===");
  } catch (error) {
    console.error("Failed to initialize app:", error);
    app.quit();
  }
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", async () => {
  if (process.platform !== "darwin") {
    try {
      cleanupGlobalShortcuts();
      cleanupCaptureWindow();
      await closeDatabase();
    } catch (error) {
      console.error("Error closing database:", error);
    }
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle app quit to ensure database is closed properly
app.on("before-quit", async (event) => {
  try {
    cleanupGlobalShortcuts();
    cleanupCaptureWindow();
    await closeDatabase();
  } catch (error) {
    console.error("Error closing database on quit:", error);
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
