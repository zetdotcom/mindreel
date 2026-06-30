import { useCallback, useEffect, useRef, useState } from "react";
import type { Todo } from "../../../sqlite/types";
import { todosRepository } from "./repository";

interface UseTodosReturn {
  activeTodos: Todo[];
  completedTodos: Todo[];
  initialLoading: boolean;
  error: string | null;
  creating: boolean;
  completingIds: Set<number>;
  deletingIds: Set<number>;
  createTodo: (content: string) => Promise<Todo | null>;
  completeTodo: (id: number) => Promise<boolean>;
  deleteTodo: (id: number) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useTodos(): UseTodosReturn {
  const [activeTodos, setActiveTodos] = useState<Todo[]>([]);
  const [completedTodos, setCompletedTodos] = useState<Todo[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [completingIds, setCompletingIds] = useState<Set<number>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  // Refs to detect duplicate events from the same window's own mutations.
  // When we patch state locally after a mutation, an event from main will also
  // arrive for this window. We use these sets to skip the redundant event.
  const pendingCreatedIds = useRef<Set<number>>(new Set());
  const pendingCompletedIds = useRef<Set<number>>(new Set());
  const pendingDeletedIds = useRef<Set<number>>(new Set());

  const refresh = useCallback(async () => {
    try {
      const [active, completed] = await Promise.all([
        todosRepository.listActive(),
        todosRepository.listCompleted(),
      ]);
      setActiveTodos(active);
      setCompletedTodos(completed);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load todos");
    }
  }, []);

  // Initial load
  useEffect(() => {
    refresh().finally(() => setInitialLoading(false));
  }, [refresh]);

  // Cross-window event listeners
  useEffect(() => {
    const unsubCreate = window.appApi.events.onTodoCreated((todo) => {
      if (todo.id !== undefined && pendingCreatedIds.current.has(todo.id)) {
        // This window issued the create - state already patched; skip.
        pendingCreatedIds.current.delete(todo.id);
        return;
      }
      setActiveTodos((prev) => {
        if (prev.some((t) => t.id === todo.id)) return prev;
        return [todo, ...prev];
      });
    });

    const unsubComplete = window.appApi.events.onTodoCompleted((todo) => {
      if (todo.id !== undefined && pendingCompletedIds.current.has(todo.id)) {
        pendingCompletedIds.current.delete(todo.id);
        return;
      }
      setActiveTodos((prev) => prev.filter((t) => t.id !== todo.id));
      setCompletedTodos((prev) => {
        if (prev.some((t) => t.id === todo.id)) return prev;
        return [todo, ...prev];
      });
    });

    const unsubDelete = window.appApi.events.onTodoDeleted(({ id }) => {
      if (pendingDeletedIds.current.has(id)) {
        pendingDeletedIds.current.delete(id);
        return;
      }
      setActiveTodos((prev) => prev.filter((t) => t.id !== id));
      setCompletedTodos((prev) => prev.filter((t) => t.id !== id));
    });

    return () => {
      unsubCreate();
      unsubComplete();
      unsubDelete();
    };
  }, []);

  const createTodo = useCallback(
    async (content: string): Promise<Todo | null> => {
      setCreating(true);
      try {
        const todo = await todosRepository.create(content);
        // The broadcast event (todo:created) arrives at this window before the
        // invoke response resolves, so the todo may already be in state by the
        // time we get here.  Mark the id so the event handler skips it on
        // future arrivals, but guard the local patch against duplicates too.
        if (todo.id !== undefined) {
          pendingCreatedIds.current.add(todo.id);
        }
        setActiveTodos((prev) => {
          if (prev.some((t) => t.id === todo.id)) return prev;
          return [todo, ...prev];
        });
        return todo;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create todo");
        return null;
      } finally {
        setCreating(false);
      }
    },
    [],
  );

  const completeTodo = useCallback(async (id: number): Promise<boolean> => {
    setCompletingIds((prev) => new Set(prev).add(id));
    try {
      const result = await todosRepository.complete(id);
      if (!result) return false;

      pendingCompletedIds.current.add(id);
      setActiveTodos((prev) => prev.filter((t) => t.id !== id));
      setCompletedTodos((prev) => {
        if (prev.some((t) => t.id === id)) return prev;
        return [result.todo, ...prev];
      });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete todo");
      return false;
    } finally {
      setCompletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, []);

  const deleteTodo = useCallback(async (id: number): Promise<boolean> => {
    setDeletingIds((prev) => new Set(prev).add(id));
    try {
      const deleted = await todosRepository.remove(id);
      if (!deleted) return false;

      pendingDeletedIds.current.add(id);
      setActiveTodos((prev) => prev.filter((t) => t.id !== id));
      setCompletedTodos((prev) => prev.filter((t) => t.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete todo");
      return false;
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, []);

  return {
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
    refresh,
  };
}
