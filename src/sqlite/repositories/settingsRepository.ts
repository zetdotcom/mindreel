import sqlite3 from "sqlite3";
import { Settings, UpdateSettingsInput } from "../types";

export class SettingsRepository {
  constructor(private db: sqlite3.Database) {}

  /**
   * Get the current settings (singleton row)
   */
  async getSettings(): Promise<Settings | null> {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM settings WHERE id = 1";

      this.db.get(sql, [], (err, row: Settings) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(row || null);
      });
    });
  }

  /**
   * Update settings (creates if doesn't exist)
   */
  async updateSettings(input: UpdateSettingsInput): Promise<Settings> {
    return new Promise((resolve, reject) => {
      // First try to get current settings
      this.getSettings()
        .then((currentSettings) => {
          const newSettings: Settings = {
            id: 1,
            popup_interval_minutes:
              input.popup_interval_minutes ??
              currentSettings?.popup_interval_minutes ??
              60,
            global_shortcut:
              input.global_shortcut !== undefined
                ? input.global_shortcut
                : (currentSettings?.global_shortcut ?? null),
          };

          const sql = `
            INSERT OR REPLACE INTO settings (id, popup_interval_minutes, global_shortcut)
            VALUES (1, ?, ?)
          `;

          this.db.run(
            sql,
            [newSettings.popup_interval_minutes, newSettings.global_shortcut],
            function (err) {
              if (err) {
                reject(err);
                return;
              }

              resolve(newSettings);
            },
          );
        })
        .catch(reject);
    });
  }

  /**
   * Update popup interval
   */
  async updatePopupInterval(minutes: number): Promise<Settings> {
    return this.updateSettings({ popup_interval_minutes: minutes });
  }

  /**
   * Update global shortcut
   */
  async updateGlobalShortcut(shortcut: string | null): Promise<Settings> {
    return this.updateSettings({ global_shortcut: shortcut });
  }

  /**
   * Reset settings to defaults
   */
  async resetSettings(): Promise<Settings> {
    return new Promise((resolve, reject) => {
      const defaultSettings: Settings = {
        id: 1,
        popup_interval_minutes: 60,
        global_shortcut: "Option+Command+Space",
      };

      const sql = `
        INSERT OR REPLACE INTO settings (id, popup_interval_minutes, global_shortcut)
        VALUES (1, ?, ?)
      `;

      this.db.run(
        sql,
        [
          defaultSettings.popup_interval_minutes,
          defaultSettings.global_shortcut,
        ],
        function (err) {
          if (err) {
            reject(err);
            return;
          }

          resolve(defaultSettings);
        },
      );
    });
  }

  /**
   * Check if settings exist
   */
  async settingsExist(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const sql = "SELECT COUNT(*) as count FROM settings WHERE id = 1";

      this.db.get(sql, [], (err, row: { count: number }) => {
        if (err) {
          reject(err);
          return;
        }

        resolve((row?.count || 0) > 0);
      });
    });
  }

  /**
   * Initialize default settings if they don't exist
   */
  async initializeDefaults(): Promise<Settings> {
    const exists = await this.settingsExist();

    if (!exists) {
      return this.resetSettings();
    }

    const settings = await this.getSettings();
    return settings!;
  }
}
