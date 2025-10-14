import React, { useState, useCallback, useMemo } from "react";
import type { Entry } from "../../../sqlite/types";
import { Button } from "@/components/ui/button";

/**
 * EntryList
 *
 * Presentational component that renders a list of entries (typically for "today"
 * or a specific day). It is intentionally UI-only:
 *  - NO direct IPC / repository calls (delegated via callbacks)
 *  - NO date filtering (caller supplies the already-filtered list)
 *  - Minimal local state (per‑row delete spinner tracking)
 *
 * Responsibilities:
 *  - Display each entry's content & creation time
 *  - Provide a delete button per entry (optional)
 *  - Show loading skeletons
 *  - Accessible semantics (list role, buttons labelled)
 *
 * Future extension ideas (without breaking current API):
 *  - Inline edit (add onEdit handler / editing state)
 *  - Grouping consecutive duplicates (pass in a preprocessed array or a flag)
 *  - Virtualization (swap mapping for a virtual list component)
 */

export interface EntryListProps {
  /**
   * Array of entry records to display.
   */
  entries: Entry[];
  /**
   * Global loading flag: shows skeleton loaders when true.
   */
  loading?: boolean;
  /**
   * Callback invoked when delete button pressed.
   * If omitted, delete controls are hidden.
   */
  onDelete?: (id: number) => Promise<void> | void;
  /**
   * Maximum number of skeleton rows shown while loading (default 3).
   */
  loadingSkeletonCount?: number;
  /**
   * Custom message when entries array is empty (default provided).
   */
  emptyMessage?: string;
  /**
   * Whether to show creation time below content (default true).
   */
  showTimestamp?: boolean;
  /**
   * Optional class name override for wrapper section.
   */
  className?: string;
  /**
   * Provide a function to format the timestamp; receives ISO string.
   * Defaults to locale time.
   */
  formatTime?: (iso: string) => string;
}

interface DeletingState {
  [id: number]: boolean;
}

const DEFAULT_SKELETON_COUNT = 3;

const EntrySkeleton: React.FC = () => (
  <div className="bg-neutral-800 p-4 rounded animate-pulse">
    <div className="h-4 bg-neutral-700 rounded w-3/4 mb-2" />
    <div className="h-3 bg-neutral-700 rounded w-1/4" />
  </div>
);

export const EntryList: React.FC<EntryListProps> = ({
  entries,
  loading = false,
  onDelete,
  loadingSkeletonCount = DEFAULT_SKELETON_COUNT,
  emptyMessage = "No entries yet.",
  showTimestamp = true,
  className = "",
  formatTime = (iso) => new Date(iso).toLocaleTimeString(),
}) => {
  const [deleting, setDeleting] = useState<DeletingState>({});

  const handleDelete = useCallback(
    async (id: number) => {
      if (!onDelete) return;
      setDeleting((prev) => ({ ...prev, [id]: true }));
      try {
        await onDelete(id);
      } finally {
        setDeleting((prev) => {
          const clone = { ...prev };
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete clone[id];
          return clone;
        });
      }
    },
    [onDelete],
  );

  const isDeleting = useCallback(
    (id: number) => !!deleting[id],
    [deleting],
  );

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="space-y-3" data-testid="entry-skeletons">
          {Array.from({ length: loadingSkeletonCount }).map((_, i) => (
            <EntrySkeleton key={i} />
          ))}
        </div>
      );
    }

    if (!entries.length) {
      return (
        <p
          className="text-neutral-400 text-sm"
          data-testid="entry-empty-state"
        >
          {emptyMessage}
        </p>
      );
    }

    return (
      <ul className="space-y-3" role="list" data-testid="entry-list">
        {entries.map((entry) => {
          const id = entry.id!;
          const deletingNow = isDeleting(id);
          return (
            <li
              key={id}
              className="flex items-start justify-between bg-neutral-800 p-4 rounded border border-neutral-700/50"
              data-entry-id={id}
            >
              <div className="flex-1 pr-4">
                <p className="text-white break-words">{entry.content}</p>
                {showTimestamp && (
                  <p className="text-xs text-neutral-400 mt-1">
                    {formatTime(entry.created_at)}
                  </p>
                )}
              </div>
              {onDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deletingNow}
                  onClick={() => handleDelete(id)}
                  aria-label={
                    deletingNow
                      ? "Deleting entry..."
                      : `Delete entry created at ${formatTime(entry.created_at)}`
                  }
                  data-testid={`entry-delete-${id}`}
                >
                  {deletingNow ? "Deleting..." : "Delete"}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    );
  }, [
    entries,
    loading,
    loadingSkeletonCount,
    emptyMessage,
    showTimestamp,
    formatTime,
    handleDelete,
    isDeleting,
    onDelete,
  ]);

  return (
    <section
      className={`bg-neutral-900 rounded-lg p-6 border border-neutral-800 ${className}`}
      aria-labelledby="entry-list-heading"
    >
      <h2
        id="entry-list-heading"
        className="text-xl font-semibold mb-4 flex items-center gap-2"
      >
        Today's Entries
        {!loading && entries.length > 0 && (
          <span className="text-sm text-neutral-400 font-normal">
            ({entries.length})
          </span>
        )}
      </h2>
      {content}
    </section>
  );
};

export default EntryList;
