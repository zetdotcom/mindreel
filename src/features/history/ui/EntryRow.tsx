import { format, parseISO } from "date-fns";
import { Check, Clock, Edit2, Trash2, X } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { historyRepository } from "../model/repository";
import { type EntryViewModel, MAX_ENTRY_LENGTH } from "../model/types";

interface EntryRowProps {
  entry: EntryViewModel;
  onEdit?: (entryId: number, content: string) => void;
  onDelete?: (entryId: number) => void;
  showTimestamp?: boolean;
  className?: string;
}

/**
 * EntryRow component displays a single entry with inline editing capabilities
 * Supports edit, delete, and shows timestamp information
 */
export function EntryRow({
  entry,
  onEdit,
  onDelete,
  showTimestamp = true,
  className,
}: EntryRowProps) {
  const [isEditing, setIsEditing] = useState(entry.isEditing || false);
  const [editContent, setEditContent] = useState(entry.content);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Place cursor at end
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length,
      );
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditContent(entry.content);
    setError(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(entry.content);
    setError(null);
  };

  const handleSaveEdit = async () => {
    if (!entry.id) {
      setError("Entry ID is missing");
      return;
    }

    const trimmedContent = editContent.trim();

    if (!trimmedContent) {
      setError("Entry content cannot be empty");
      return;
    }

    if (trimmedContent.length > MAX_ENTRY_LENGTH) {
      setError(`Entry is too long (${trimmedContent.length}/${MAX_ENTRY_LENGTH} characters)`);
      return;
    }

    if (trimmedContent === entry.content) {
      // No changes, just exit edit mode
      setIsEditing(false);
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const updatedEntry = await historyRepository.updateEntry(entry.id, trimmedContent);

      if (updatedEntry) {
        setIsEditing(false);
        if (onEdit) {
          onEdit(entry.id, trimmedContent);
        }
      } else {
        setError("Failed to update entry");
      }
    } catch (err) {
      console.error("Error updating entry:", err);
      setError(err instanceof Error ? err.message : "Failed to update entry");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (entry.id && onDelete) {
      onDelete(entry.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = parseISO(timestamp);
      return format(date, "h:mm a");
    } catch {
      return "";
    }
  };

  const characterCount = editContent.length;
  const isOverLimit = characterCount > MAX_ENTRY_LENGTH;

  return (
    <div
      className={cn(
        "group relative border rounded-lg p-4 bg-card hover:bg-muted/50 transition-colors",
        isEditing && "ring-2 ring-primary/50",
        className,
      )}
    >
      {/* Edit Mode */}
      {isEditing ? (
        <div className="space-y-3">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSaving}
              className={cn(
                "min-h-[80px] resize-none text-secondary",
                isOverLimit && "border-destructive focus-visible:ring-destructive",
              )}
              placeholder="Enter your work entry..."
            />

            {/* Character Count */}
            <div
              className={cn(
                "absolute bottom-2 right-2 text-xs",
                isOverLimit ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {characterCount}/{MAX_ENTRY_LENGTH}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded px-2 py-1">
              {error}
            </div>
          )}

          {/* Edit Actions */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Cmd/Ctrl + Enter to save, Esc to cancel
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={isSaving}>
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveEdit}
                disabled={isSaving || isOverLimit || !editContent.trim()}
              >
                <Check className="h-3 w-3 mr-1" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Display Mode */
        <div className="space-y-2">
          {/* Entry Content */}
          <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {entry.content}
          </div>

          {/* Entry Meta */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              {showTimestamp && (
                <>
                  <Clock className="h-3 w-3" />
                  <span>{formatTimestamp(entry.created_at)}</span>
                </>
              )}
              {entry.duplicateGroupId && (
                <span className="bg-muted px-2 py-0.5 rounded text-xs">Duplicate</span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="sm" onClick={handleStartEdit} className="h-7 w-7 p-0">
                <Edit2 className="h-3 w-3" />
                <span className="sr-only">Edit entry</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
                <span className="sr-only">Delete entry</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
