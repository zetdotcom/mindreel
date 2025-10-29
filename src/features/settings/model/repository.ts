import type { Settings, UpdateSettingsInput } from "@/sqlite/types";

export async function getSettings(): Promise<Settings | null> {
  return window.appApi.db.getSettings();
}

export async function updateSettings(input: UpdateSettingsInput): Promise<Settings> {
  return window.appApi.db.updateSettings(input);
}

export async function updatePopupInterval(minutes: number): Promise<Settings> {
  return window.appApi.db.updatePopupInterval(minutes);
}

export async function updateGlobalShortcut(shortcut: string | null): Promise<Settings> {
  return window.appApi.db.updateGlobalShortcut(shortcut);
}

export async function resetSettings(): Promise<Settings> {
  return window.appApi.db.resetSettings();
}
