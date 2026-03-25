import { useCallback, useEffect, useState } from "react";
import type { HistoryGroupingSettings, UpdateHistoryGroupingInput } from "@/lib/historyGrouping";
import type { Settings } from "@/sqlite/types";
import * as settingsRepository from "./repository";

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [historyGrouping, setHistoryGrouping] = useState<HistoryGroupingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [settingsData, historyGroupingData] = await Promise.all([
        settingsRepository.getSettings(),
        settingsRepository.getHistoryGroupingSettings(),
      ]);
      setSettings(settingsData);
      setHistoryGrouping(historyGroupingData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updatePopupInterval = async (minutes: number) => {
    try {
      setError(null);
      const updated = await settingsRepository.updatePopupInterval(minutes);
      setSettings(updated);
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update popup interval";
      setError(message);
      throw err;
    }
  };

  const updateGlobalShortcut = async (shortcut: string | null) => {
    try {
      setError(null);
      const updated = await settingsRepository.updateGlobalShortcut(shortcut);
      setSettings(updated);
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update global shortcut";
      setError(message);
      throw err;
    }
  };

  const resetSettings = async () => {
    try {
      setError(null);
      const updated = await settingsRepository.resetSettings();
      setSettings(updated);
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reset settings";
      setError(message);
      throw err;
    }
  };

  const updateHistoryGrouping = async (input: UpdateHistoryGroupingInput) => {
    try {
      setError(null);
      const updated = await settingsRepository.updateHistoryGrouping(input);
      setHistoryGrouping(updated);
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update history grouping";
      setError(message);
      throw err;
    }
  };

  return {
    settings,
    historyGrouping,
    loading,
    error,
    updatePopupInterval,
    updateGlobalShortcut,
    updateHistoryGrouping,
    resetSettings,
    reload: loadSettings,
  };
}
