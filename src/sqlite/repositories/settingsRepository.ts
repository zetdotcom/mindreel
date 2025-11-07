import type sqlite3 from "sqlite3";
import type { Settings, UpdateSettingsInput } from "../types";

export class SettingsRepository {
  constructor(private db: sqlite3.Database) {}

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

  async updateSettings(input: UpdateSettingsInput): Promise<Settings> {
    return new Promise((resolve, reject) => {
      this.getSettings()
        .then((currentSettings) => {
          const newSettings: Settings = {
            id: 1,
            popup_interval_minutes:
              input.popup_interval_minutes ?? currentSettings?.popup_interval_minutes ?? 60,
            global_shortcut:
              input.global_shortcut !== undefined
                ? input.global_shortcut
                : (currentSettings?.global_shortcut ?? null),
            onboarding_completed:
              input.onboarding_completed !== undefined
                ? input.onboarding_completed
                : (currentSettings?.onboarding_completed ?? 0),
          };

          const sql = `
            INSERT OR REPLACE INTO settings (id, popup_interval_minutes, global_shortcut, onboarding_completed)
            VALUES (1, ?, ?, ?)
          `;

          this.db.run(
            sql,
            [
              newSettings.popup_interval_minutes,
              newSettings.global_shortcut,
              newSettings.onboarding_completed,
            ],
            (err) => {
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

  async updatePopupInterval(minutes: number): Promise<Settings> {
    return this.updateSettings({ popup_interval_minutes: minutes });
  }

  async updateGlobalShortcut(shortcut: string | null): Promise<Settings> {
    return this.updateSettings({ global_shortcut: shortcut });
  }

  async updateOnboardingCompleted(completed: number): Promise<Settings> {
    return this.updateSettings({ onboarding_completed: completed });
  }

  async resetSettings(): Promise<Settings> {
    return new Promise((resolve, reject) => {
      const defaultSettings: Settings = {
        id: 1,
        popup_interval_minutes: 60,
        global_shortcut: "Option+Command+Space",
        onboarding_completed: 0,
      };

      const sql = `
        INSERT OR REPLACE INTO settings (id, popup_interval_minutes, global_shortcut, onboarding_completed)
        VALUES (1, ?, ?, ?)
      `;

      this.db.run(
        sql,
        [
          defaultSettings.popup_interval_minutes,
          defaultSettings.global_shortcut,
          defaultSettings.onboarding_completed,
        ],
        (err) => {
          if (err) {
            reject(err);
            return;
          }

          resolve(defaultSettings);
        },
      );
    });
  }

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

  async initializeDefaults(): Promise<Settings> {
    const exists = await this.settingsExist();

    if (!exists) {
      return this.resetSettings();
    }

    const settings = await this.getSettings();
    return settings!;
  }
}
