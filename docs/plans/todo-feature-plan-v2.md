# Todo Feature Implementation Plan v2

## Goal

Add todo feature to MindReel that works in both main window and capture popup, syncs across windows, and integrates with history without fighting current codebase architecture.

## What Changed From v1

- Move completion orchestration out of IPC handler body and into `src/sqlite/databaseService.ts`
- Keep todo schema minimal; do not add `date`, `week_of_year`, or `iso_year` to `todos`
- Add create affordance to main `/todos` view, not only capture popup
- Keep history sync on existing `entry:created` flow; do not add `todo:completed` listener to history
- Define explicit semantics for generated history entries and todo deletion
- Trim extra files and API surface that are not needed for v1 shipping

## Requirements

### Functional

1. Add `To Do` nav item to sidebar, after History and before Settings.
2. Add `/todos` route.
3. Main todo screen has two tabs: `Current` and `Done`.
4. `Current` tab shows active todos ordered by `created_at DESC`.
5. `Done` tab shows completed todos ordered by `completed_at DESC`.
6. Main todo screen includes inline create form in `Current` tab.
7. Capture popup gets `Entry | Todo` tabs.
8. Capture popup defaults to `Entry` tab.
9. ~~`Option+Space` toggles capture tabs.~~ **`Ctrl+Space` toggles capture tabs** (Phase 0 spike confirmed `Option+Space` inserts NBSP on macOS and cannot be reliably intercepted via `preventDefault`).
10. Capture `Todo` tab has input for new todo plus active todo checklist.
11. Completing todo creates history entry with content `✓ [todo text]` at completion time.
12. Todo create, complete, and delete actions sync between main window and capture popup.
13. Todos can be deleted from both `Current` and `Done` lists.

### Validation

- Todo content is trimmed before save.
- Empty or whitespace-only todos are rejected.
- Max length: `500` characters, same as capture entry limit.

### Explicit Semantics

- Completing todo is one-way in v1: todo becomes done and history entry is created.
- Deleting completed todo does not delete generated history entry.
- Editing or deleting generated history entry does not reopen or mutate todo.
- Generated completion entries are included in history and summary generation.
- Generated completion entries are excluded from capture "recent activities" suggestions to avoid noise.
- No undo/reopen flow in v1.

### Out of Scope

- Reminders, notifications, due dates
- Priority levels, tags, categories
- Drag-to-reorder
- Rich text / markdown formatting
- Bulk actions
- Undo / reopen completed todos

---

## Architecture Decisions

1. Follow existing main-process flow:

```text
SQLite Repository -> DatabaseService -> ipc/databaseHandlers.ts -> preload.ts -> renderer feature hook
```

2. Keep todo IPC inside existing centralized `src/ipc/databaseHandlers.ts`.

3. Put cross-entity logic in `src/sqlite/databaseService.ts`, not in renderer and not directly in IPC handler callbacks.

4. Keep todo renderer state inside `src/features/todos`.

5. Reuse shared DB types from `src/sqlite/types.ts`. Do not create `src/features/todos/model/types.ts` unless renderer-only types appear later.

6. Use simple local segmented buttons for tabs. Do not introduce generic tabs abstraction for one feature.

7. Use event payloads to patch todo state in renderers. Do not refetch both lists on every event by default.

8. Keep history on existing `entry:created` subscription. Do not add todo-specific history listener.

---

## Data Model

### `src/sqlite/types.ts`

Add:

```ts
export interface Todo {
  id?: number;
  content: string;
  created_at: string;
  completed_at: string | null;
  completed_entry_id: number | null;
}

export interface CreateTodoInput {
  content: string;
}
```

### Database Schema

```sql
CREATE TABLE IF NOT EXISTS todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  completed_at TEXT NULL,
  completed_entry_id INTEGER NULL
);

CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at);
CREATE INDEX IF NOT EXISTS idx_todos_completed_at ON todos(completed_at);
CREATE INDEX IF NOT EXISTS idx_todos_completed_entry_id ON todos(completed_entry_id);
```

Notes:

- No `date`, `week_of_year`, or `iso_year` columns on `todos`.
- `completed_entry_id` is application-level linkage only in v1. Do not widen scope by enabling global SQLite foreign-key enforcement in this feature.

---

## Implementation Phases

### Phase 0: Preflight Checks — DONE

Before larger UI work:

1. ~~Verify `Option+Space` is reliably delivered inside Electron popup input/textarea on macOS.~~ **DONE — FAILED.** `keydown` fires but macOS IME inserts NBSP via `insertText:` at OS level, bypassing `e.preventDefault()`. Not fixable in renderer.
2. ~~If unreliable, stop and resolve shortcut fallback before finishing capture tab work.~~ **DONE — fallback is `Ctrl+Space`.**
3. ~~Confirm event-driven history refresh should be silent to avoid success-toast spam.~~ **DONE — confirmed. `refreshWeeks()` in `useHistoryState.ts` always showed toast; Phase 8 adds `{ silent?: boolean }` option.**

---

### Phase 1: SQLite Types, Schema, Repository — DONE

**Files created:**

- `src/sqlite/repositories/todosRepository.ts` ✓
- `src/sqlite/repositories/todosRepository.test.ts` ✓ (16 tests passing)

**Files modified:**

- `src/sqlite/types.ts` ✓ — added `Todo`, `CreateTodoInput`
- `src/sqlite/database.ts` ✓ — added `todos` table + indexes to base schema
- `src/sqlite/migrations.ts` ✓ — added migration 006 (`add_todos_table`)

**Also modified:**

- `src/tests/fixtures/testDatabase.ts` ✓ — added `todos` reset in `reset()`, added `createTestTodo()` helper

**Repository shape implemented:**

- `createTodo(input: CreateTodoInput): Promise<Todo>`
- `getActiveTodos(): Promise<Todo[]>`
- `getCompletedTodos(): Promise<Todo[]>`
- `getTodoById(id: number): Promise<Todo | null>`
- `markTodoCompleted(id: number, completedAt: string, completedEntryId: number): Promise<Todo | null>`
- `deleteTodo(id: number): Promise<boolean>`

---

### Phase 2: Service-Layer Completion Flow — DONE

**Files modified:**

- `src/sqlite/databaseService.ts` ✓

**Service methods added:**

- `createTodo(input: CreateTodoInput): Promise<Todo>`
- `getActiveTodos(): Promise<Todo[]>`
- `getCompletedTodos(): Promise<Todo[]>`
- `deleteTodo(id: number): Promise<boolean>`
- `completeTodo(id: number): Promise<{ todo: Todo; entry: Entry } | null>`

**Integration tests:**

- `src/tests/unit/todos.integration.test.ts` ✓ (8 tests passing)

**Notes:**

- `completeTodo()` uses `BEGIN IMMEDIATE` transaction via raw `db.getDatabase()`. Transaction wraps `getTodoById` + `createEntry` + `markTodoCompleted` in one atomic unit.
- `ensureInitialized()` guard updated to include `todosRepo`.

---

### Phase 3: IPC, Preload, Global Types — DONE

**Files modified:**

- `src/ipc/databaseHandlers.ts` ✓ — added `registerTodoHandlers()` called from `registerDatabaseHandlers()`
- `src/preload.ts` ✓ — added todo DB API methods + `onTodoCreated/onTodoCompleted/onTodoDeleted` event listeners
- `src/global.d.ts` ✓ — added todo types to `AppApi`

**IPC channels registered:**

- `db:createTodo` — validates, saves, emits `todo:created` to all windows
- `db:getActiveTodos`
- `db:getCompletedTodos`
- `db:completeTodo` — calls `completeTodo()` service, emits `todo:completed` + `entry:created` on success
- `db:deleteTodo` — emits `todo:deleted` on success

---

### Phase 4: Renderer Todo Data Layer — DONE

**Files created:**

- `src/features/todos/index.ts` ✓
- `src/features/todos/model/repository.ts` ✓
- `src/features/todos/model/useTodos.ts` ✓

**Notes:**

- Idempotency implemented via `pendingCreatedIds/pendingCompletedIds/pendingDeletedIds` refs — same-window mutations skip the redundant broadcast event.
- Initial load fetches active + completed in parallel.
- `completingIds` and `deletingIds` are `Set<number>` for per-row loading state.

---

### Phase 5: Main Todo View — DONE

**Files created:**

- `src/features/todos/ui/TodosView.tsx` ✓
- `src/features/todos/ui/TodoItem.tsx` ✓
- `src/views/Todos/TodosPageView.tsx` ✓

---

### Phase 6: Navigation and Routing — DONE

**Files modified:**

- `src/views/Main/Main.tsx` ✓ — added `To Do` nav item with `ListTodo` icon between History and Settings
- `src/routes.tsx` ✓ — added lazy `/todos` route

---

### Phase 7: Capture Popup Tabs — DONE

**Files created:**

- `src/features/capture/ui/CaptureEntryTab.tsx` ✓
- `src/features/capture/ui/CaptureTodoTab.tsx` ✓

**Files modified:**

- `src/features/capture/ui/CapturePopup.tsx` ✓ — refactored into tab shell; `Ctrl+Space` toggles tabs; `ESC` closes from either tab
- `src/views/CaptureWindow/CaptureWindowView.tsx` — no changes needed; existing `onSave` prop contract already correct

**Notes:**

- Tab toggle shortcut is `Ctrl+Space` (not `Option+Space` per Phase 0 finding).
- `CaptureTodoTab` uses `useTodos()` directly — todo state stays in `src/features/todos`, not in capture feature.
- Popup todo tab shows active todos only.

---

### Phase 8: Cross-Window Sync and History Integration — DONE

**Files modified:**

- `src/features/history/model/useHistoryState.ts` ✓ — `refreshWeeks(options?: { silent?: boolean })` added
- `src/features/history/ui/HistoryView.tsx` ✓ — `onEntryCreated` uses `silent: true`; manual refresh buttons use `handleManualRefresh()` wrapper (shows toast); delete-confirm path uses `silent: true`
- `src/features/capture/model/repository.ts` ✓ — `getRecentUniqueEntries()` now fetches completed todos in parallel and excludes entries matching any `completed_entry_id`

---

### Phase 9: Documentation and Cleanup — PENDING

When feature code ships:

- update relevant docs in `docs/`
- update `README.md` if user-facing behavior changed
- add changelog entry if project is tracking feature changes there

Do not create ADR for this feature unless implementation expands into broader event/schema pattern changes.

---

## File Summary

### New files

| Path | Status | Purpose |
|------|--------|---------|
| `src/sqlite/repositories/todosRepository.ts` | DONE | Todo DB access |
| `src/sqlite/repositories/todosRepository.test.ts` | DONE | Todo repository tests (16 tests) |
| `src/features/todos/index.ts` | DONE | Todo public barrel |
| `src/features/todos/model/repository.ts` | DONE | Renderer-side todo API wrapper |
| `src/features/todos/model/useTodos.ts` | DONE | Shared todo state for main window + popup |
| `src/features/todos/ui/TodosView.tsx` | DONE | Main todo feature view |
| `src/features/todos/ui/TodoItem.tsx` | DONE | Reusable todo row |
| `src/views/Todos/TodosPageView.tsx` | DONE | Route wrapper |
| `src/features/capture/ui/CaptureEntryTab.tsx` | DONE | Extracted entry tab |
| `src/features/capture/ui/CaptureTodoTab.tsx` | DONE | Popup todo tab |
| `src/tests/unit/todos.integration.test.ts` | DONE | Service/integration tests for completion flow (8 tests) |

### Modified files

| Path | Status | Change |
|------|--------|--------|
| `src/sqlite/types.ts` | DONE | Added todo types |
| `src/sqlite/database.ts` | DONE | Added todos to base schema |
| `src/sqlite/migrations.ts` | DONE | Added migration 006 for todo table |
| `src/sqlite/databaseService.ts` | DONE | Added todo service methods and atomic completion flow |
| `src/ipc/databaseHandlers.ts` | DONE | Added todo IPC handlers and events |
| `src/preload.ts` | DONE | Exposed todo DB API + event listeners |
| `src/global.d.ts` | DONE | Updated `AppApi` typing |
| `src/views/Main/Main.tsx` | DONE | Added sidebar nav item |
| `src/routes.tsx` | DONE | Added `/todos` route |
| `src/features/capture/ui/CapturePopup.tsx` | DONE | Converted popup into tab shell |
| `src/views/CaptureWindow/CaptureWindowView.tsx` | NO CHANGE NEEDED | Existing `onSave` prop contract was already correct |
| `src/features/capture/model/repository.ts` | DONE | Filtered generated todo entries from recent suggestions |
| `src/features/history/ui/HistoryView.tsx` | DONE | Used silent background refresh |
| `src/features/history/model/useHistoryState.ts` | DONE | Added silent refresh option |
| `src/tests/fixtures/testDatabase.ts` | DONE | Added todos reset + `createTestTodo()` helper |

---

## Phase Execution Order

```text
Phase 0  DONE
  -> Phase 1  DONE
  -> Phase 2  DONE
  -> Phase 3  DONE
  -> Phase 4  DONE
     -> Phase 5  DONE
     -> Phase 7  DONE
  -> Phase 6  DONE
  -> Phase 8  DONE
  -> Phase 9  PENDING
```

---

## Testing Strategy

### Unit

- `todosRepository` CRUD and ordering — **DONE** (16 tests in `todosRepository.test.ts`)
- validation helpers if extracted

### Integration

- `DatabaseService.completeTodo()` transaction behavior — **DONE** (8 tests in `todos.integration.test.ts`)
- idempotent completion under repeated call — **DONE**
- migration coverage for todo table — **DONE** (migration 006 tested via `TestDatabase` setup)

### Component

- `TodosView` current/done states — PENDING
- main-view create flow — PENDING
- popup tab switching — PENDING

### Electron E2E

1. launch app
2. open capture popup
3. switch to Todo tab
4. create todo in popup
5. verify main window `/todos` updates
6. complete todo in popup
7. verify main window history contains `✓ [todo text]`

Note:

- Current Electron fixture only exposes first window. Update test utilities so popup window can be selected explicitly.
- Do not spend time on exhaustive per-channel IPC round-trip tests unless implementation exposes bug.

---

## Success Criteria

- Todo feature works from both main window and capture popup.
- Completing todo creates exactly one history entry.
- Cross-window sync is reliable.
- Background history sync does not spam success toasts.
- Capture recent suggestions stay useful.
- Implementation fits current repository/service/IPC architecture without broad refactors.
