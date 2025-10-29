import { format, parseISO } from "date-fns";
import { ChevronDown, ChevronRight } from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DuplicateGroupViewModel } from "../model/types";
import { EntryRow } from "./EntryRow";

interface DuplicateGroupProps {
  group: DuplicateGroupViewModel;
  onEntryEdit?: (entryId: number, content: string) => void;
  onEntryDelete?: (entryId: number) => void;
  className?: string;
}

/**
 * DuplicateGroup component displays consecutive duplicate entries
 * Collapsed: shows content + duplicate count badge in one row, times in second row
 * Expanded: shows all entries editable individually
 */
export function DuplicateGroup({
  group,
  onEntryEdit,
  onEntryDelete,
  className,
}: DuplicateGroupProps) {
  const [isExpanded, setIsExpanded] = useState(group.expanded || false);

  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const sortedEntries = [...group.entries].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  const times = sortedEntries.map((e) => {
    try {
      return format(parseISO(e.created_at), "h:mm a");
    } catch {
      return "";
    }
  });

  return (
    <div className={cn("border rounded-lg", className)}>
      {/* Header (collapsed content summary) */}
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleExpanded}
            className="h-6 w-6 p-0 flex-shrink-0 mt-0.5"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>

          <div className="flex-1 min-w-0 space-y-2">
            {/* Row: content + badge */}
            <div className="flex items-start justify-between gap-3">
              <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words flex-1">
                {group.content}
              </div>
              <span className="inline-flex items-center rounded-full bg-orange-100 dark:bg-orange-900/40 px-2 py-0.5 text-xs font-medium text-orange-800 dark:text-orange-200 flex-shrink-0">
                ×{group.count}
              </span>
            </div>

            {/* Row: individual times */}
            {!isExpanded && (
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {times.map((t, i) => (
                  <span key={i}>{t}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Duplicate Entries */}
      {isExpanded && (
        <div className="border-t bg-background/50">
          <div className="p-4 space-y-3">
            <div className="text-xs text-muted-foreground mb-2">
              {group.count} duplicate {group.count === 1 ? "entry" : "entries"} (each editable):
            </div>
            <div className="space-y-2">
              {group.entries.map((e) => (
                <EntryRow
                  key={e.id}
                  entry={e}
                  onEdit={onEntryEdit}
                  onDelete={onEntryDelete}
                  showTimestamp={true}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
