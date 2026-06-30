import type { CreateTodoInput, Todo } from "../../../sqlite/types";

export interface TodosDbApi {
  createTodo(input: CreateTodoInput): Promise<Todo>;
  getActiveTodos(): Promise<Todo[]>;
  getCompletedTodos(): Promise<Todo[]>;
  completeTodo(id: number): Promise<{ todo: Todo; entry: { id?: number } } | null>;
  deleteTodo(id: number): Promise<boolean>;
}

function getApi(): TodosDbApi {
  if (typeof window === "undefined" || !(window as any)?.appApi?.db) {
    throw new Error("Todos DB API not available. Ensure preload exposes window.appApi.db.");
  }
  return (window as any).appApi.db as TodosDbApi;
}

export const todosRepository = {
  async listActive(): Promise<Todo[]> {
    return getApi().getActiveTodos();
  },

  async listCompleted(): Promise<Todo[]> {
    return getApi().getCompletedTodos();
  },

  async create(content: string): Promise<Todo> {
    const trimmed = content.trim();
    if (!trimmed) throw new Error("TODO_EMPTY_CONTENT");
    if (trimmed.length > 500) throw new Error("TODO_CONTENT_TOO_LONG");
    return getApi().createTodo({ content: trimmed });
  },

  async complete(id: number): Promise<{ todo: Todo; entry: { id?: number } } | null> {
    return getApi().completeTodo(id);
  },

  async remove(id: number): Promise<boolean> {
    return getApi().deleteTodo(id);
  },
};
