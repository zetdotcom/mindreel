import { describe, it, expect, beforeEach, afterEach } from "vitest";
import sqlite3 from "sqlite3";
import { SettingsRepository } from "./settingsRepository";

describe("SettingsRepository", () => {
  let db: sqlite3.Database;
  let repository: SettingsRepository;

  beforeEach(async () => {
    db = new sqlite3.Database(":memory:");
    repository = new SettingsRepository(db);

    await new Promise<void>((resolve, reject) => {
      db.run(
        `
        CREATE TABLE settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          popup_interval_minutes INTEGER NOT NULL DEFAULT 60,
          global_shortcut TEXT
        )
      `,
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => {
      db.close(() => resolve());
    });
  });

  describe("getSettings", () => {
    it("should return null when settings do not exist", async () => {
      const settings = await repository.getSettings();
      expect(settings).toBeNull();
    });

    it("should return settings when they exist", async () => {
      await repository.updateSettings({
        popup_interval_minutes: 120,
        global_shortcut: "Command+Shift+M",
      });

      const settings = await repository.getSettings();

      expect(settings).not.toBeNull();
      expect(settings?.id).toBe(1);
      expect(settings?.popup_interval_minutes).toBe(120);
      expect(settings?.global_shortcut).toBe("Command+Shift+M");
    });
  });

  describe("updateSettings", () => {
    it("should create settings when they do not exist", async () => {
      const settings = await repository.updateSettings({
        popup_interval_minutes: 90,
        global_shortcut: "Option+Command+Space",
      });

      expect(settings.id).toBe(1);
      expect(settings.popup_interval_minutes).toBe(90);
      expect(settings.global_shortcut).toBe("Option+Command+Space");
    });

    it("should update existing settings", async () => {
      await repository.updateSettings({
        popup_interval_minutes: 60,
        global_shortcut: "Command+M",
      });

      const updated = await repository.updateSettings({
        popup_interval_minutes: 120,
      });

      expect(updated.popup_interval_minutes).toBe(120);
      expect(updated.global_shortcut).toBe("Command+M");
    });

    it("should handle partial updates for popup_interval_minutes", async () => {
      await repository.updateSettings({
        popup_interval_minutes: 60,
        global_shortcut: "Command+M",
      });

      const updated = await repository.updateSettings({
        popup_interval_minutes: 180,
      });

      expect(updated.popup_interval_minutes).toBe(180);
      expect(updated.global_shortcut).toBe("Command+M");
    });

    it("should handle partial updates for global_shortcut", async () => {
      await repository.updateSettings({
        popup_interval_minutes: 60,
        global_shortcut: "Command+M",
      });

      const updated = await repository.updateSettings({
        global_shortcut: "Option+M",
      });

      expect(updated.popup_interval_minutes).toBe(60);
      expect(updated.global_shortcut).toBe("Option+M");
    });

    it("should accept null for global_shortcut", async () => {
      await repository.updateSettings({
        popup_interval_minutes: 60,
        global_shortcut: "Command+M",
      });

      const updated = await repository.updateSettings({
        global_shortcut: null,
      });

      expect(updated.global_shortcut).toBeNull();
    });

    it("should validate popup interval range - 30 minutes", async () => {
      const settings = await repository.updateSettings({
        popup_interval_minutes: 30,
      });

      expect(settings.popup_interval_minutes).toBe(30);
    });

    it("should validate popup interval range - 240 minutes (4 hours)", async () => {
      const settings = await repository.updateSettings({
        popup_interval_minutes: 240,
      });

      expect(settings.popup_interval_minutes).toBe(240);
    });

    it("should use default value when no popup_interval_minutes provided and no existing settings", async () => {
      const settings = await repository.updateSettings({
        global_shortcut: "Command+M",
      });

      expect(settings.popup_interval_minutes).toBe(60);
    });
  });

  describe("updatePopupInterval", () => {
    it("should update only popup interval", async () => {
      await repository.updateSettings({
        popup_interval_minutes: 60,
        global_shortcut: "Command+M",
      });

      const updated = await repository.updatePopupInterval(150);

      expect(updated.popup_interval_minutes).toBe(150);
      expect(updated.global_shortcut).toBe("Command+M");
    });

    it("should accept various interval values", async () => {
      const intervals = [30, 60, 90, 120, 180, 240];

      for (const interval of intervals) {
        const settings = await repository.updatePopupInterval(interval);
        expect(settings.popup_interval_minutes).toBe(interval);
      }
    });
  });

  describe("updateGlobalShortcut", () => {
    it("should update only global shortcut", async () => {
      await repository.updateSettings({
        popup_interval_minutes: 60,
        global_shortcut: "Command+M",
      });

      const updated = await repository.updateGlobalShortcut("Option+Shift+M");

      expect(updated.popup_interval_minutes).toBe(60);
      expect(updated.global_shortcut).toBe("Option+Shift+M");
    });

    it("should allow setting shortcut to null", async () => {
      await repository.updateSettings({
        popup_interval_minutes: 60,
        global_shortcut: "Command+M",
      });

      const updated = await repository.updateGlobalShortcut(null);

      expect(updated.global_shortcut).toBeNull();
    });
  });

  describe("resetSettings", () => {
    it("should reset settings to defaults", async () => {
      await repository.updateSettings({
        popup_interval_minutes: 180,
        global_shortcut: "Custom+Shortcut",
      });

      const reset = await repository.resetSettings();

      expect(reset.popup_interval_minutes).toBe(60);
      expect(reset.global_shortcut).toBe("Option+Command+Space");
    });

    it("should create default settings if none exist", async () => {
      const reset = await repository.resetSettings();

      expect(reset.id).toBe(1);
      expect(reset.popup_interval_minutes).toBe(60);
      expect(reset.global_shortcut).toBe("Option+Command+Space");
    });
  });

  describe("settingsExist", () => {
    it("should return false when settings do not exist", async () => {
      const exists = await repository.settingsExist();
      expect(exists).toBe(false);
    });

    it("should return true when settings exist", async () => {
      await repository.updateSettings({
        popup_interval_minutes: 60,
      });

      const exists = await repository.settingsExist();
      expect(exists).toBe(true);
    });
  });

  describe("initializeDefaults", () => {
    it("should create default settings if they do not exist", async () => {
      const settings = await repository.initializeDefaults();

      expect(settings.id).toBe(1);
      expect(settings.popup_interval_minutes).toBe(60);
      expect(settings.global_shortcut).toBe("Option+Command+Space");
    });

    it("should return existing settings if they already exist", async () => {
      await repository.updateSettings({
        popup_interval_minutes: 120,
        global_shortcut: "Command+M",
      });

      const settings = await repository.initializeDefaults();

      expect(settings.popup_interval_minutes).toBe(120);
      expect(settings.global_shortcut).toBe("Command+M");
    });

    it("should not overwrite existing settings", async () => {
      await repository.updateSettings({
        popup_interval_minutes: 90,
        global_shortcut: "Custom",
      });

      await repository.initializeDefaults();

      const settings = await repository.getSettings();

      expect(settings?.popup_interval_minutes).toBe(90);
      expect(settings?.global_shortcut).toBe("Custom");
    });
  });

  describe("singleton behavior", () => {
    it("should maintain only one settings row", async () => {
      await repository.updateSettings({
        popup_interval_minutes: 60,
      });

      await repository.updateSettings({
        popup_interval_minutes: 120,
      });

      const allSettings = await new Promise<any[]>((resolve, reject) => {
        db.all("SELECT * FROM settings", [], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      expect(allSettings).toHaveLength(1);
      expect(allSettings[0].id).toBe(1);
    });
  });
});
