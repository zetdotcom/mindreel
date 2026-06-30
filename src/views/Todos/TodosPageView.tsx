import { TodosView } from "@/features/todos/ui/TodosView";

export function TodosPageView() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">To Do</h1>
        <p className="text-sm text-muted-foreground mt-1">Track and complete your tasks.</p>
      </div>
      <TodosView />
    </div>
  );
}
