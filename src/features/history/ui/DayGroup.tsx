import React from "react";
import { Calendar, ChevronDown, ChevronRight } from "lucide-react";
import { DayGroupViewModel, EntryViewModel, DuplicateGroupViewModel } from "../model/types";
import { EntryRow } from "./EntryRow";
import { DuplicateGroup } from "./DuplicateGroup";
import { isDuplicateGroup, isEntry } from "../model/lib";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DayGroupProps {
  day: DayGroupViewModel;
  onEntryEdit?: (entryId: number, content: string) => void;
  onEntryDelete?: (entryId: number) => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  className?: string;
}

/**
 * DayGroup component displays entries for a single day
 * Handles both individual entries and duplicate groups
 */
export function DayGroup({
  day,
  onEntryEdit,
  onEntryDelete,
  collapsed = false,
  onToggleCollapsed,
  className,
}: DayGroupProps) {
  if (day.items.length === 0) {
    return null; // Don't render empty days
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Day Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Optional collapse button for individual days */}
          {onToggleCollapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapsed}
              className="h-6 w-6 p-0"
            >
              {collapsed ? (
                <ChevronRight className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
          )}

          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium text-foreground">
              {day.headerLabel}
            </h3>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          {day.totalEntries} {day.totalEntries === 1 ? 'entry' : 'entries'}
        </div>
      </div>

      {/* Day Content */}
      {!collapsed && (
        <div className="ml-6 space-y-2">
          <ol className="space-y-2" role="list">
            {day.items.map((item, index) => {
              if (isDuplicateGroup(item)) {
                return (
                  <li key={item.id} className="list-none">
                    <DuplicateGroup
                      group={item}
                      onEntryEdit={onEntryEdit}
                      onEntryDelete={onEntryDelete}
                    />
                  </li>
                );
              } else {
                return (
                  <li key={item.id} className="list-none">
                    <EntryRow
                      entry={item}
                      onEdit={onEntryEdit}
                      onDelete={onEntryDelete}
                      showTimestamp={true}
                    />
                  </li>
                );
              }
            })}
          </ol>
        </div>
      )}

      {/* Collapsed State Preview */}
      {collapsed && (
        <div className="ml-6 text-sm text-muted-foreground">
          <span>
            {day.totalEntries} entries
            {day.items.some(isDuplicateGroup) && " (some duplicates)"}
          </span>
        </div>
      )}
    </div>
  );
}
