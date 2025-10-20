/// <reference types="@electron-forge/plugin-vite/forge-vite-env" />

import { globalShortcut, ipcMain } from "electron";
import { getDatabaseService } from "./databaseHandlers";

/**
 * Global Shortcut Manager
 *
 * Manages global keyboard shortcuts for the application.
 * Responsibilities:
 *  - Register/unregister global shortcuts based on settings
 *  - Trigger capture window when shortcut is pressed
 *  - Handle shortcut updates from renderer process
 */

let currentShortcut: string | null = null;
let shortcutCallback: (() => void) | null = null;

/**
 * Register a global shortcut.
 * If a shortcut is already registered, it will be unregistered first.
 */
function registerShortcut(accelerator: string, callback: () => void): boolean {
  try {
    console.log(
      `[GlobalShortcut] Attempting to register shortcut: ${accelerator}`,
    );
    console.log(
      `[GlobalShortcut] Callback type: ${typeof callback}, is function: ${typeof callback === "function"}`,
    );
    console.log(
      `[GlobalShortcut] globalShortcut API available: ${globalShortcut !== undefined}`,
    );

    // Unregister existing shortcut if any
    if (currentShortcut) {
      console.log(
        `[GlobalShortcut] Unregistering current shortcut: ${currentShortcut}`,
      );
      globalShortcut.unregister(currentShortcut);
      currentShortcut = null;
    }

    // Register new shortcut with a wrapper to add logging
    const wrappedCallback = () => {
      console.log(`[GlobalShortcut] 🔥 SHORTCUT PRESSED: ${accelerator}`);
      try {
        callback();
      } catch (error) {
        console.error("[GlobalShortcut] Error in callback:", error);
      }
    };

    const success = globalShortcut.register(accelerator, wrappedCallback);

    if (success) {
      currentShortcut = accelerator;
      console.log(`[GlobalShortcut] ✓ Successfully registered: ${accelerator}`);
      console.log(
        `[GlobalShortcut] Verification - isRegistered:`,
        globalShortcut.isRegistered(accelerator),
      );
      console.log(`[GlobalShortcut] Press ${accelerator} to test the shortcut`);
    } else {
      console.error(`[GlobalShortcut] ✗ Failed to register: ${accelerator}`);
      console.error(
        `[GlobalShortcut] Shortcut may be already taken by another application`,
      );
    }

    return success;
  } catch (error) {
    console.error(
      `[GlobalShortcut] Exception while registering: ${accelerator}`,
      error,
    );
    return false;
  }
}

/**
 * Unregister the current global shortcut.
 */
function unregisterShortcut(): void {
  if (currentShortcut) {
    try {
      globalShortcut.unregister(currentShortcut);
      console.log(`Global shortcut unregistered: ${currentShortcut}`);
    } catch (error) {
      console.error(`Error unregistering shortcut: ${currentShortcut}`, error);
    }
    currentShortcut = null;
  }
}

/**
 * Initialize global shortcuts from database settings.
 * Should be called after database is initialized.
 */
export async function initializeGlobalShortcut(
  onShortcutPressed: () => void,
): Promise<void> {
  try {
    console.log("[GlobalShortcut] Initializing global shortcuts...");

    // Store the callback for later use
    shortcutCallback = onShortcutPressed;

    const databaseService = getDatabaseService();
    const settings = await databaseService.getSettings();

    console.log("[GlobalShortcut] Settings loaded:", settings);

    if (settings?.global_shortcut) {
      console.log(
        `[GlobalShortcut] Found shortcut in settings: ${settings.global_shortcut}`,
      );
      const success = registerShortcut(
        settings.global_shortcut,
        onShortcutPressed,
      );
      if (!success) {
        console.warn(
          `[GlobalShortcut] ⚠ Failed to register shortcut from settings: ${settings.global_shortcut}`,
        );
      }
    } else {
      console.log("[GlobalShortcut] No global shortcut configured in settings");
    }
  } catch (error) {
    console.error(
      "[GlobalShortcut] Error initializing global shortcut:",
      error,
    );
  }
}

/**
 * Update the global shortcut.
 * Called when settings are updated.
 */
export function updateGlobalShortcut(
  accelerator: string | null,
  onShortcutPressed: () => void,
): boolean {
  if (!accelerator) {
    unregisterShortcut();
    return true;
  }

  return registerShortcut(accelerator, onShortcutPressed);
}

/**
 * Register IPC handlers for global shortcut management.
 * This allows the renderer process to update shortcuts and receive feedback.
 */
export function registerGlobalShortcutHandlers(
  onShortcutPressed: () => void,
): void {
  // Store the callback for later use
  shortcutCallback = onShortcutPressed;

  ipcMain.handle(
    "shortcut:register",
    async (_event, accelerator: string | null) => {
      try {
        const success = updateGlobalShortcut(accelerator, onShortcutPressed);
        return { success };
      } catch (error) {
        console.error("Error in shortcut:register handler:", error);
        return { success: false, error: String(error) };
      }
    },
  );

  ipcMain.handle("shortcut:isRegistered", () => {
    return {
      isRegistered: currentShortcut !== null,
      shortcut: currentShortcut,
    };
  });
}

/**
 * Update the shortcut registration after database update.
 * Called by database handler when shortcut is updated in DB.
 */
export function syncShortcutFromDatabase(accelerator: string | null): boolean {
  console.log(
    `[GlobalShortcut] Syncing shortcut from database: ${accelerator}`,
  );
  if (!shortcutCallback) {
    console.error("[GlobalShortcut] Shortcut callback not initialized");
    return false;
  }
  return updateGlobalShortcut(accelerator, shortcutCallback);
}

/**
 * Cleanup function to unregister all shortcuts on app quit.
 * Should be called during app shutdown.
 */
export function cleanupGlobalShortcuts(): void {
  unregisterShortcut();
  globalShortcut.unregisterAll();
}
