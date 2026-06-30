import { format, parseISO } from "date-fns";
import { Trash2 } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { Todo } from "../../../sqlite/types";

interface TodoItemProps {
  todo: Todo;
  onComplete?: (id: number) => void;
  onDelete?: (id: number) => void;
  completing?: boolean;
  deleting?: boolean;
}

export function TodoItem({ todo, onComplete, onDelete, completing, deleting }: TodoItemProps) {
  const isCompleted = todo.completed_at !== null;
  const disabled = completing || deleting;

  const formattedCompletedAt = isCompleted
    ? (() => {
        try {
          return format(parseISO(todo.completed_at!), "MMM d, h:mm a");
        } catch {
          return "";
        }
      })()
    : null;

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-lg border p-3 bg-card transition-colors",
        !isCompleted && "hover:bg-muted/40",
        disabled && "opacity-60",
      )}
    >
      {!isCompleted && (
        <Checkbox
          checked={false}
          onCheckedChange={() => onComplete?.(todo.id!)}
          disabled={disabled}
          aria-label={`Complete: ${todo.content}`}
          className="mt-0.5 shrink-0 border-neutral-400 bg-neutral-800 hover:border-neutral-200"
        />
      )}

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm leading-relaxed break-words",
            isCompleted ? "line-through text-muted-foreground" : "text-foreground",
          )}
        >
          {todo.content}
        </p>
        {formattedCompletedAt && (
          <p className="text-xs text-muted-foreground mt-1">Done {formattedCompletedAt}</p>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete?.(todo.id!)}
        disabled={disabled}
        aria-label={`Delete: ${todo.content}`}
        className="h-7 w-7 p-0 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
