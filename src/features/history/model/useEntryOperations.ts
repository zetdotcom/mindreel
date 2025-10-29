import { useCallback, useState } from "react";
import type { Entry } from "../../../sqlite/types";
import { historyRepository } from "./repository";
import { EntryViewModel } from "./types";

/**
 * Hook for managing entry CRUD operations
 * Provides functions for creating, updating, and deleting entries
 */
export function useEntryOperations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Create a new entry
   */
  const createEntry = useCallback(async (content: string): Promise<Entry | null> => {
    try {
      setLoading(true);
      setError(null);

      const trimmedContent = content.trim();
      if (!trimmedContent) {
        throw new Error("Entry content cannot be empty");
      }

      const newEntry = await historyRepository.createEntry(trimmedContent);
      return newEntry;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create entry";
      setError(errorMessage);
      console.error("Error creating entry:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update an existing entry
   */
  const updateEntry = useCallback(
    async (entryId: number, content: string): Promise<Entry | null> => {
      try {
        setLoading(true);
        setError(null);

        const trimmedContent = content.trim();
        if (!trimmedContent) {
          throw new Error("Entry content cannot be empty");
        }

        const updatedEntry = await historyRepository.updateEntry(entryId, trimmedContent);

        if (!updatedEntry) {
          throw new Error("Entry not found or could not be updated");
        }

        return updatedEntry;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to update entry";
        setError(errorMessage);
        console.error("Error updating entry:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Delete an entry
   */
  const deleteEntry = useCallback(async (entryId: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const deleted = await historyRepository.deleteEntry(entryId);

      if (!deleted) {
        throw new Error("Entry not found or could not be deleted");
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete entry";
      setError(errorMessage);
      console.error("Error deleting entry:", err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear any error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    createEntry,
    updateEntry,
    deleteEntry,
    clearError,
  };
}
