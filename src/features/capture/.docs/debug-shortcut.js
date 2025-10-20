#!/usr/bin/env node

/**
 * Debug Script for Global Shortcut
 *
 * This script helps diagnose issues with the global shortcut functionality.
 * Run this while the app is running to check the state.
 */

const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const os = require("os");
const fs = require("fs");

// Get the database path
const dbPath = path.join(
  os.homedir(),
  "Library",
  "Application Support",
  "mindreel",
  "mindreel.db",
);

console.log("=".repeat(60));
console.log("🔍 MindReel Global Shortcut Debugger");
console.log("=".repeat(60));
console.log();

// Check if database exists
if (!fs.existsSync(dbPath)) {
  console.error("❌ Database not found at:", dbPath);
  console.log("\nPlease run the app at least once to create the database.");
  process.exit(1);
}

console.log("✓ Database found at:", dbPath);
console.log();

// Open database
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error("❌ Error opening database:", err.message);
    process.exit(1);
  }
});

// Check settings
db.get("SELECT * FROM settings WHERE id = 1", [], (err, row) => {
  if (err) {
    console.error("❌ Error reading settings:", err.message);
    db.close();
    process.exit(1);
  }

  console.log("📊 Current Settings:");
  console.log("-".repeat(60));
  console.log("ID:", row.id);
  console.log("Popup Interval (minutes):", row.popup_interval_minutes);
  console.log("Global Shortcut:", row.global_shortcut || "(not set)");
  console.log();

  if (!row.global_shortcut) {
    console.log("⚠️  WARNING: No global shortcut configured!");
    console.log("   Run this to fix:");
    console.log(
      `   sqlite3 "${dbPath}" "UPDATE settings SET global_shortcut = 'Option+Command+Space' WHERE id = 1;"`,
    );
    console.log();
  }

  // Check migrations
  db.all("SELECT * FROM migrations ORDER BY id", [], (err, migrations) => {
    if (err) {
      console.error("❌ Error reading migrations:", err.message);
      db.close();
      process.exit(1);
    }

    console.log("📦 Applied Migrations:");
    console.log("-".repeat(60));
    if (migrations.length === 0) {
      console.log("(none)");
    } else {
      migrations.forEach((m) => {
        console.log(`[${m.id}] ${m.name} - Applied at: ${m.applied_at}`);
      });
    }
    console.log();

    // Expected migrations
    const expectedMigrations = [1, 2];
    const appliedMigrationIds = migrations.map((m) => m.id);
    const missingMigrations = expectedMigrations.filter(
      (id) => !appliedMigrationIds.includes(id),
    );

    if (missingMigrations.length > 0) {
      console.log(
        "⚠️  WARNING: Missing migrations:",
        missingMigrations.join(", "),
      );
      console.log("   Restart the app to run pending migrations.");
      console.log();
    }

    // Provide testing instructions
    console.log("=".repeat(60));
    console.log("🧪 Testing Instructions:");
    console.log("=".repeat(60));
    console.log();
    console.log("1. Make sure the app is running");
    console.log("2. Check the console for these log messages:");
    console.log("   [GlobalShortcut] Initializing global shortcuts...");
    console.log(
      "   [GlobalShortcut] ✓ Successfully registered: Option+Command+Space",
    );
    console.log();
    console.log("3. Press: Option + Command + Space");
    console.log("   (⌥ + ⌘ + Space on macOS keyboard)");
    console.log();
    console.log("4. The capture popup window should open!");
    console.log();
    console.log("=".repeat(60));
    console.log("🔧 Troubleshooting:");
    console.log("=".repeat(60));
    console.log();
    console.log("If the shortcut doesn't work:");
    console.log();
    console.log("A. Check if another app is using the shortcut:");
    console.log("   System Settings → Keyboard → Keyboard Shortcuts");
    console.log();
    console.log("B. Try a different shortcut:");
    console.log("   Open DevTools in the app and run:");
    console.log(
      "   await window.appApi.db.updateGlobalShortcut('Command+Shift+M');",
    );
    console.log();
    console.log("C. Check registration status:");
    console.log("   await window.appApi.shortcut.isRegistered();");
    console.log();
    console.log("D. Manually update database:");
    console.log(
      `   sqlite3 "${dbPath}" "UPDATE settings SET global_shortcut = 'Option+Command+Space' WHERE id = 1;"`,
    );
    console.log();
    console.log("E. Common shortcuts to try:");
    console.log("   - Option+Command+Space (default)");
    console.log("   - Command+Shift+M");
    console.log("   - Control+Shift+Space");
    console.log("   - F12");
    console.log();
    console.log("=".repeat(60));
    console.log("📝 Valid Accelerator Format:");
    console.log("=".repeat(60));
    console.log();
    console.log("Modifiers:");
    console.log("  - Command (or Cmd)");
    console.log("  - Control (or Ctrl)");
    console.log("  - Alt");
    console.log("  - Option (macOS)");
    console.log("  - Shift");
    console.log("  - CommandOrControl (cross-platform)");
    console.log();
    console.log("Format: Modifier+Modifier+Key");
    console.log("Example: Option+Command+Space");
    console.log();
    console.log("❌ INVALID: Option+Command+Space+K (no multi-key sequences!)");
    console.log("✓ VALID:   Option+Command+Space");
    console.log();

    db.close();
  });
});
