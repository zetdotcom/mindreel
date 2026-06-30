/**
 * Capture Repository
 *
 * Data access layer for the capture popup feature.
 * Provides methods to:
 *  - Get recent unique entries for prefill buttons
 *  - Trigger window open via IPC
 */

/**
 * Get the last N unique entries for quick prefill.
 * Returns distinct content values ordered by most recent timestamp.
 *
 * Excludes generated todo-completion entries (those whose id appears as
 * completed_entry_id on any completed todo). This prevents "✓ …" lines
 * from polluting the recent-activities suggestions.
 */
export async function getRecentUniqueEntries(limit = 8): Promise<string[]> {
  try {
    // getCompletedTodos is best-effort: if todo IPC handlers aren't available
    // (e.g. stale process, first boot), degrade gracefully rather than
    // wiping the whole suggestions list.
    const [allEntries, completionEntryIds] = await Promise.all([
      window.appApi.db.getEntries(),
      window.appApi.db
        .getCompletedTodos()
        .then(
          (todos) =>
            new Set<number>(
              todos
                .map((t) => t.completed_entry_id)
                .filter((id): id is number => id !== null),
            ),
        )
        .catch(() => new Set<number>()),
    ]);

    // Extract unique content values, preserving order of most recent occurrence
    const seen = new Set<string>();
    const unique: string[] = [];

    for (const entry of allEntries) {
      if (entry.id !== undefined && completionEntryIds.has(entry.id)) {
        continue; // skip todo completion entries
      }

      if (!seen.has(entry.content)) {
        seen.add(entry.content);
        unique.push(entry.content);

        if (unique.length >= limit) {
          break;
        }
      }
    }

    return unique;
  } catch (error) {
    console.error("Failed to get recent unique entries:", error);
    return [];
  }
}

/**
 * Request main process to open the capture popup window.
 * This will be handled by IPC once the window management is set up.
 */
export async function openCaptureWindow(): Promise<void> {
  if (window.appApi?.capture?.openCapturePopup) {
    await window.appApi.capture.openCapturePopup();
  } else {
    console.warn("Capture API not available");
    throw new Error("Capture API not available");
  }
}

/**
 * Close the current capture window.
 * Can be called from within the popup itself.
 */
export async function closeCaptureWindow(): Promise<void> {
  if (window.appApi?.capture?.closeCapturePopup) {
    await window.appApi.capture.closeCapturePopup();
  } else {
    console.warn("Capture close API not available");
  }
}
