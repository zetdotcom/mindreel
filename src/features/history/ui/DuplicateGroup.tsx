import React, { useState } from "react";
import { ChevronDown, ChevronRight, Copy, Edit2, Trash2 } from "lucide-react";
import { DuplicateGroupViewModel } from "../model/types";
import { EntryRow } from "./EntryRow";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DuplicateGroupProps {
  group: DuplicateGroupViewModel;
  onEntryEdit?: (entryId: number, content: string) => void;
  onEntryDelete?: (entryId: number) => void;
  className?: string;
}

/**
 * DuplicateGroup component displays consecutive duplicate entries
 * Allows expanding to see all duplicates and edit individual entries
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

  const handleEditFirstEntry = () => {
    if (group.firstEntry.id && onEntryEdit) {
      onEntryEdit(group.firstEntry.id, group.content);
    }
  };

  const handleDeleteFirstEntry = () => {
    if (group.firstEntry.id && onEntryDelete) {
      onEntryDelete(group.firstEntry.id);
    }
  };

  return (
    <div className={cn(
      "border rounded-lg bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20",
      "border-orange-200 dark:border-orange-800",
      className
    )}>
      {/* Duplicate Group Header */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            {/* Expand/Collapse Button */}
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

            {/* Duplicate Content and Meta */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <Copy className="h-4 w-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  {group.count} duplicate entries
                </span>
              </div>

              {/* Entry Content Preview */}
              <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
                {group.content}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1 ml-3 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEditFirstEntry}
              className="h-7 w-7 p-0"
              title="Edit first entry"
            >
              <Edit2 className="h-3 w-3" />
              <span className="sr-only">Edit first entry</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteFirstEntry}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              title="Delete first entry"
            >
              <Trash2 className="h-3 w-3" />
              <span className="sr-only">Delete first entry</span>
            </Button>
          </div>
        </div>

        {/* Collapsed State Info */}
        {!isExpanded && (
          <div className="mt-3 text-xs text-orange-700 dark:text-orange-300">
            Click to expand and see all {group.count} duplicate entries
          </div>
        )}
      </div>

      {/* Expanded Duplicate Entries */}
      {isExpanded && (
        <div className="border-t border-orange-200 dark:border-orange-800 bg-background/50">
          <div className="p-4 space-y-3">
            <div className="text-xs text-muted-foreground mb-3">
              Showing all {group.count} duplicate entries:
            </div>

            {/* First Entry (Main Entry) */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">
                Original entry:
              </div>
              <EntryRow
                entry={group.firstEntry}
                onEdit={onEntryEdit}
                onDelete={onEntryDelete}
                showTimestamp={true}
                className="bg-background"
              />
            </div>

            {/* Additional Duplicates */}
            {group.entryIds.length > 1 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">
                  Duplicate entries ({group.entryIds.length - 1}):
                </div>
                <div className="text-sm text-muted-foreground bg-muted/50 rounded p-3">
                  <div className="flex items-center space-x-2">
                    <Copy className="h-4 w-4" />
                    <span>
                      {group.entryIds.length - 1} additional identical {group.entryIds.length - 1 === 1 ? 'entry' : 'entries'}
                    </span>
                  </div>
                  <div className="text-xs mt-1">
                    Entry IDs: {group.entryIds.slice(1).join(', ')}
                  </div>
                </div>
              </div>
            )}

            {/* Duplicate Actions */}
            <div className="pt-2 border-t border-muted">
              <div className="text-xs text-muted-foreground">
                <strong>Tip:</strong> Editing or deleting the original entry will affect this duplicate group.
                Individual duplicate entries can be managed separately if needed.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
