import { Plus } from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTodos } from "../model/useTodos";
import { TodoItem } from "./TodoItem";

type Tab = "current" | "done";

export function TodosView() {
  const [activeTab, setActiveTab] = useState<Tab>("current");
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    activeTodos,
    completedTodos,
    initialLoading,
    error,
    creating,
    completingIds,
    deletingIds,
    createTodo,
    completeTodo,
    deleteTodo,
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

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreate();
    }
  };

  if (initialLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4 space-y-4">
      {/* Error banner */}
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {/* Segmented tab buttons */}
      <div className="flex rounded-lg border border-border overflow-hidden w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("current")}
          className={`px-4 py-1.5 text-sm font-medium transition-colors ${
            activeTab === "current"
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
          aria-selected={activeTab === "current"}
          role="tab"
        >
          Current
          {activeTodos.length > 0 && (
            <span className="ml-1.5 text-xs opacity-70">({activeTodos.length})</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("done")}
          className={`px-4 py-1.5 text-sm font-medium transition-colors ${
            activeTab === "done"
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
          aria-selected={activeTab === "done"}
          role="tab"
        >
          Done
          {completedTodos.length > 0 && (
            <span className="ml-1.5 text-xs opacity-70">({completedTodos.length})</span>
          )}
        </button>
      </div>

      {/* Current tab */}
      {activeTab === "current" && (
        <div className="space-y-3">
          {/* Inline create form */}
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Add a new todo..."
              maxLength={500}
              disabled={creating}
              aria-label="New todo content"
              className="flex-1"
            />
            <Button
              onClick={handleCreate}
              disabled={!inputValue.trim() || creating}
              size="sm"
              aria-label="Add todo"
            >
              <Plus className="h-4 w-4 mr-1" />
              {creating ? "Adding..." : "Add"}
            </Button>
          </div>

          {/* Active todo list */}
          {activeTodos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No active todos. Add one above.
            </p>
          ) : (
            <div className="space-y-2">
              {activeTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onComplete={completeTodo}
                  onDelete={deleteTodo}
                  completing={completingIds.has(todo.id!)}
                  deleting={deletingIds.has(todo.id!)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Done tab */}
      {activeTab === "done" && (
        <div className="space-y-2">
          {completedTodos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No completed todos yet.
            </p>
          ) : (
            completedTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onDelete={deleteTodo}
                deleting={deletingIds.has(todo.id!)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
