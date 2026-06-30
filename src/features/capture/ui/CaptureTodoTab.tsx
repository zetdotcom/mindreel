import { Plus } from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useTodos } from "@/features/todos";
import { cn } from "@/lib/utils";

/**
 * CaptureTodoTab
 *
 * Shown in the capture popup when the user switches to the Todo tab.
 * Displays active todos only (done items remain in the main /todos view).
 * Adding or completing a todo does not close the popup.
 */
export const CaptureTodoTab: React.FC = () => {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    activeTodos,
    initialLoading,
    creating,
    completingIds,
    createTodo,
    completeTodo,
  } = useTodos();

  const handleCreate = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || creating) return;

    const result = await createTodo(trimmed);
    if (result) {
      setInputValue("");
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreate();
    }
  };

  return (
    <div className="space-y-4">
      {/* Create input */}
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a new todo..."
          maxLength={500}
          disabled={creating}
          aria-label="New todo content"
          className="flex-1 border-glow focus-visible:border-glow"
          autoFocus
        />
        <Button
          onClick={handleCreate}
          disabled={!inputValue.trim() || creating}
          size="sm"
          aria-label="Add todo"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Active todo checklist */}
      {initialLoading ? (
        <p className="text-sm text-muted-foreground/70 text-center normal-case tracking-normal">
          Loading todos...
        </p>
      ) : activeTodos.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4 normal-case tracking-normal">
          No active todos.
        </p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {activeTodos.map((todo) => {
            const isCompleting = completingIds.has(todo.id!);
            return (
              <div
                key={todo.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-2.5 bg-card transition-colors hover:bg-muted/40",
                  isCompleting && "opacity-60",
                )}
              >
                <Checkbox
                  checked={false}
                  onCheckedChange={() => completeTodo(todo.id!)}
                  disabled={isCompleting}
                  aria-label={`Complete: ${todo.content}`}
                  className="shrink-0 border-neutral-400 bg-neutral-800 hover:border-neutral-200"
                />
                <span className="text-sm text-foreground leading-relaxed truncate">
                  {todo.content}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
