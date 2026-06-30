# Todo Feature Implementation Plan

## Goal

Add a todo list feature to MindReel that integrates with existing navigation, capture popup, and history views.

## Requirements

### Functional

1. **Main view navigation** — "To Do" nav item in sidebar (same pattern as History/Settings)
2. **Todo view** — Two tabs: "Current" (active todos) and "Done" (completed todos)
3. **Current tab** — Lists active todos ordered by creation date (newest first), each with a checkbox to mark as done
4. **Done tab** — Lists completed todos with completion date displayed
5. **Capture window integration** — Add tab system (Entry | Todo) toggled with `Option+Space`
6. **Capture todo tab** — Text field to add new todo + list of current todos with checkboxes
7. **Tab toggle** — `Option+Space` toggles between Entry and Todo tabs in capture window; visual indicator shows active tab and shortcut hint
8. **Completed todos in history** — When a todo is marked as done, it appears in the entries/history list for that date as `✓ [todo text]`, behaving identically to a regular entry
9. **Delete** — Todos can be permanently deleted from both current and done lists
10. **Cross-window sync** — Todo changes in capture window propagate to main window in real-time via IPC events (same pattern as `entry:created`)

### Data Model

- `content`: plain text (string)
- `created_at`: ISO 8601 timestamp
- `completed_at`: ISO 8601 timestamp (null while active)
- `date`: YYYY-MM-DD (date created, for grouping)

### Out of Scope

- Reminders, notifications, due dates
- Priority levels, tags, categories
- Drag-to-reorder
- Rich text / markdown formatting

---

## Implementation Phases

### Phase 1: Database Layer

**Files to create/modify:**

- `src/sqlite/types.ts` — Add `Todo`, `CreateTodoInput` interfaces
- `src/sqlite/migrations.ts` — Add migration #6: create `todos` table
- `src/sqlite/repositories/todosRepository.ts` — New repository

**Schema:**

```sql
CREATE TABLE IF NOT EXISTS todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  date TEXT NOT NULL,
  week_of_year INTEGER NOT NULL,
  iso_year INTEGER NOT NULL,
  completed_at TEXT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed_at);
CREATE INDEX IF NOT EXISTS idx_todos_date ON todos(date);
```

**Repository methods:**

- `createTodo(content: string): Promise<Todo>`
- `getTodos(completed?: boolean): Promise<Todo[]>` — ordered by `created_at DESC`
- `getActiveTodos(): Promise<Todo[]>`
- `getCompletedTodos(): Promise<Todo[]>`
- `completeTodo(id: number): Promise<Todo>` — sets `completed_at` to now
- `deleteTodo(id: number): Promise<void>`
- `getTodoById(id: number): Promise<Todo | null>`

**Verification:**

- Unit test the repository against an in-memory SQLite instance
- Verify migration applies cleanly on fresh DB and on existing DB

---

### Phase 2: IPC Layer

**Files to modify:**

- `src/ipc/` — Add todo IPC handlers (follow existing pattern from entries handlers)
- `src/preload.ts` — Expose todo API methods on `window.appApi.db`
- `src/global.d.ts` — Update `AppApi` type definition

**IPC channels:**

- `db:createTodo` → `todosRepository.createTodo`
- `db:getActiveTodos` → `todosRepository.getActiveTodos`
- `db:getCompletedTodos` → `todosRepository.getCompletedTodos`
- `db:completeTodo` → `todosRepository.completeTodo`
- `db:deleteTodo` → `todosRepository.deleteTodo`

**IPC events (renderer → renderer via main):**

- `todo:created` — emitted after creating a todo
- `todo:completed` — emitted after marking a todo done
- `todo:deleted` — emitted after deleting a todo

**Event listeners in preload:**

- `onTodoCreated(callback)`
- `onTodoCompleted(callback)`
- `onTodoDeleted(callback)`

**Verification:**

- Invoke each IPC channel from renderer, confirm round-trip works
- Confirm events fire and reach other windows

---

### Phase 3: Entry Creation on Todo Completion

**Logic:**

When `completeTodo(id)` is called:
1. Set `completed_at` on the todo
2. Create a new entry with content `✓ [original todo content]` and the current date
3. Emit both `todo:completed` and `entry:created` events

This should happen atomically in the main process handler (not renderer) to ensure consistency.

**Files to modify:**

- IPC handler for `db:completeTodo` — orchestrate both operations

**Verification:**

- Complete a todo → confirm entry appears in `getEntriesForDate(today)`
- Confirm entry content is `✓ [todo text]`
- Confirm both events fire

---

### Phase 4: Todo Feature Module (UI State)

**Files to create:**

- `src/features/todos/index.ts` — Public barrel export
- `src/features/todos/model/types.ts` — UI-specific types (if needed beyond DB types)
- `src/features/todos/model/useTodos.ts` — Hook managing todo state (fetch, create, complete, delete)
- `src/features/todos/model/repository.ts` — Thin wrapper around `window.appApi.db.*` todo methods

**Hook API (`useTodos`):**

```ts
interface UseTodosReturn {
  activeTodos: Todo[];
  completedTodos: Todo[];
  loading: boolean;
  createTodo: (content: string) => Promise<void>;
  completeTodo: (id: number) => Promise<void>;
  deleteTodo: (id: number) => Promise<void>;
  refresh: () => Promise<void>;
}
```

- Subscribes to IPC events (`todo:created`, `todo:completed`, `todo:deleted`) to refresh state
- Initial load fetches both active and completed

**Verification:**

- Hook returns correct state after CRUD operations
- State updates when IPC events arrive from other windows

---

### Phase 5: Todo Main View

**Files to create:**

- `src/features/todos/ui/TodoView.tsx` — Main todo view with Current/Done tabs
- `src/features/todos/ui/TodoItem.tsx` — Single todo row (checkbox + text + delete button)
- `src/features/todos/ui/TodoList.tsx` — List of todo items
- `src/views/Todos/TodosPageView.tsx` — Route-level view (thin wrapper)

**UI structure:**

```
TodosPageView
└── TodoView
    ├── Tab bar: [Current] [Done]
    ├── Current tab:
    │   └── TodoList (active todos)
    │       └── TodoItem (checkbox, content, delete button)
    └── Done tab:
        └── TodoList (completed todos)
            └── TodoItem (checked, content, completed_at date, delete button)
```

**Behavior:**

- Current tab: checkbox click → `completeTodo(id)` → item moves to Done tab
- Done tab: shows `completed_at` date formatted (e.g., "Jun 25, 2026")
- Delete: confirmation not required (simple delete button with icon)
- Empty state: message when no todos in either tab

**Verification:**

- Render view, create a todo → appears in Current tab
- Check a todo → disappears from Current, appears in Done with date
- Delete a todo → removed from list
- Switch between tabs → correct items shown

---

### Phase 6: Navigation & Routing

**Files to modify:**

- `src/views/Main/Main.tsx` — Add todo item to `NAV_ITEMS` array
- `src/routes.tsx` — Add `/todos` route with lazy-loaded `TodosPageView`

**Nav item:**

```ts
{ to: "/todos", label: "To Do", icon: <ListTodo className="h-5 w-5" /> }
```

Position: after History, before Settings.

**Verification:**

- Click "To Do" in sidebar → navigates to `/todos`
- Active state styling applies correctly
- Back/forward browser navigation works

---

### Phase 7: Capture Window — Tab System

**Files to modify:**

- `src/features/capture/ui/CapturePopup.tsx` — Refactor to support tabs
- `src/features/capture/ui/CaptureEntryTab.tsx` — Extract existing entry capture logic
- `src/features/capture/ui/CaptureTodoTab.tsx` — New todo tab

**Tab system:**

- State: `activeTab: 'entry' | 'todo'` (default: `'entry'`)
- `Option+Space` toggles between tabs
- Visual tab indicator at top of popup showing both tabs + shortcut hint

**CaptureEntryTab:**

- Extract current CapturePopup content (textarea + save + recent entries) into this component
- No behavioral changes

**CaptureTodoTab:**

- Text input field + "Add" button (or Enter to add)
- Below input: list of current (active) todos with checkboxes
- Checking a todo → calls `completeTodo` → IPC event propagates
- Subscribes to `todo:created`/`todo:completed`/`todo:deleted` events for real-time sync

**Keyboard shortcuts (within capture window):**

- `Option+Space` — toggle tabs
- `ESC` — close window (unchanged)
- `Cmd+Enter` — save entry (only on entry tab)
- `Enter` — add todo (only on todo tab, when input focused)

**Verification:**

- Open capture window → shows Entry tab by default
- Press `Option+Space` → switches to Todo tab
- Press `Option+Space` again → back to Entry tab
- Add todo in capture → appears in main window's todo view
- Complete todo in capture → appears in main window's history

---

### Phase 8: Cross-Window Sync

**Files to modify:**

- `src/preload.ts` — Add event listeners for todo events
- Main process IPC handlers — Broadcast events to all windows
- `src/features/history/model/useHistoryState.ts` — Subscribe to `todo:completed` (triggers entry refresh since a new entry is created)

**Event flow:**

1. Capture window: user completes a todo
2. → IPC invoke `db:completeTodo` → main process
3. → Main process: completes todo + creates entry
4. → Main process emits `todo:completed` + `entry:created` to all renderer windows
5. → Main window: history refreshes (new entry), todo view refreshes (todo moved to done)
6. → Capture window: todo list refreshes (todo removed from active list)

**Verification:**

- Open both main window and capture popup
- Create todo in capture → appears in main window todo view
- Complete todo in capture → entry appears in main window history
- Delete todo in main window → disappears from capture popup's list

---

## File Summary

### New files:

| Path | Purpose |
|------|---------|
| `src/sqlite/repositories/todosRepository.ts` | DB access layer |
| `src/features/todos/index.ts` | Feature barrel |
| `src/features/todos/model/types.ts` | Types |
| `src/features/todos/model/useTodos.ts` | State hook |
| `src/features/todos/model/repository.ts` | Renderer-side API wrapper |
| `src/features/todos/ui/TodoView.tsx` | Main view |
| `src/features/todos/ui/TodoItem.tsx` | List item |
| `src/features/todos/ui/TodoList.tsx` | List container |
| `src/views/Todos/TodosPageView.tsx` | Route page |
| `src/features/capture/ui/CaptureEntryTab.tsx` | Extracted entry tab |
| `src/features/capture/ui/CaptureTodoTab.tsx` | New todo tab |

### Modified files:

| Path | Change |
|------|--------|
| `src/sqlite/types.ts` | Add `Todo`, `CreateTodoInput` |
| `src/sqlite/migrations.ts` | Add migration #6 |
| `src/ipc/` (handlers) | Add todo IPC handlers |
| `src/preload.ts` | Expose todo DB API + event listeners |
| `src/global.d.ts` | Update `AppApi` type |
| `src/views/Main/Main.tsx` | Add nav item |
| `src/routes.tsx` | Add `/todos` route |
| `src/features/capture/ui/CapturePopup.tsx` | Refactor to tab system |
| `src/features/history/model/useHistoryState.ts` | Subscribe to `todo:completed` |

---

## Phase Execution Order

Phases 1–3 must be sequential (each depends on the previous).
Phases 4, 5, 6 can be done in parallel after Phase 3.
Phase 7 depends on Phase 4 (needs `useTodos` hook).
Phase 8 depends on Phases 4 and 7.

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 ─┬→ Phase 5 → Phase 6
                                          └→ Phase 7 → Phase 8
```

## Testing Strategy

- **Unit tests:** Repository methods (in-memory SQLite)
- **Integration:** IPC round-trip for each channel
- **Component:** TodoView, TodoItem render states, tab switching
- **E2E (Playwright):** Full flow — create todo via capture → complete → verify in history
