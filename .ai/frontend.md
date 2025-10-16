# Frontend Architecture Documentation

## Overview

MindReel uses a **Feature-Sliced Design (FSD)** inspired architecture for the renderer process (React-based UI). This architecture provides clear boundaries, scalable organization, and maintainable code as the application grows.

## Core Principles

1. **Vertical slicing by domain**: Features are organized by business capability, not technical layer
2. **Unidirectional dependencies**: Higher layers depend on lower layers, never the reverse
3. **Explicit public APIs**: Features expose only stable, intended surfaces via barrel exports
4. **Separation of concerns**: UI, business logic, and data access are clearly separated
5. **Local-first**: All user data stored locally (SQLite); cloud only for AI features

## Architecture Layers

The frontend follows a simplified 3-layer structure:

```
src/
├── shared/       # Cross-cutting utilities & primitives (lowest layer)
├── features/     # Domain capabilities & user interactions (middle layer)
└── views/        # Screen compositions & layouts (top layer)
```

### Layer Dependency Rules

- `views/` → MAY import from `features/`, `shared/`
- `features/` → MAY import from other `features/` (public API only), `shared/`
- `shared/` → MUST NOT import from `features/` or `views/`

**Enforced via**: ESLint/Biome import rules (to be configured)

## Detailed Layer Descriptions

### 1. `src/shared/` (Foundation Layer)

**Purpose**: Generic, reusable utilities with NO domain coupling.

**Contains**:
- `ui/` - Generic presentational components (ErrorDisplay, LoadingSpinner)
- `lib/` - Pure utility functions (date formatters, string helpers)
- `api/` - API clients (IPC wrappers, Supabase client, Edge Function callers)
- `hooks/` - Generic React hooks (useDebounce, useInterval)
- `types/` - Cross-cutting type utilities (Result<T>, Branded types)
- `config/` - App-wide configuration (feature flags, env vars)

**Key rule**: If it knows about "Entry" or "Summary", it doesn't belong here.

**Note**: `src/lib/utils.ts` (shadcn convention) stays at root level for compatibility.

### 2. `src/features/` (Domain Layer)

**Purpose**: Self-contained vertical slices representing user capabilities.

**Current features**:
- `entries/` - CRUD for daily work log entries
- `summaries/` - Weekly summary generation and display
- `onboarding/` - First-run user experience

**Feature slice structure**:
```
features/<feature-name>/
├── model/              # Business logic & state
│   ├── use*.ts        # React hooks (stateful)
│   ├── repository.ts  # Data access (IPC/API calls)
│   ├── types.ts       # Feature-specific types
│   └── lib/           # Pure domain functions
├── ui/                # React components
│   └── *.tsx
└── index.ts           # Public API barrel (REQUIRED)
```

**Key patterns**:
- **Repositories**: Thin wrappers over IPC (`window.appApi.*`) with validation
- **Hooks**: Manage loading/error states, call repositories, provide mutations
- **UI Components**: Presentational; delegate logic to hooks or accept via props
- **Public API**: Only export stable interfaces via `index.ts`

**Cross-feature communication**: Import other features ONLY via their barrel (`features/*/index.ts`), never internal paths.

### 3. `src/views/` (Composition Layer)

**Purpose**: Route-level screens that orchestrate features into complete UIs.

**Current views**:
- `History/` - Primary application history view (weekly groups, capture action via header)
- `Settings/` - Configuration placeholder (future capture shortcuts, data/export)
- `Profile/` - User identity & activity placeholder

**View structure**:
```
views/<ViewName>/
├── <ViewName>View.tsx    # Main component
├── components/            # View-specific helpers (optional)
└── index.ts              # Re-export (optional)
```

**Responsibilities**:
- Compose multiple features
- Handle initial data loading coordination
- Manage global error states
- Provide layout and spacing
- Route-level concerns (when routing is added)

**Key rule**: Views should be "thin". No direct IPC calls, no business logic. Delegate to features.

## Infrastructure (Outside FSD Layers)

### `src/components/ui/`
**shadcn UI primitives** - Auto-generated components from shadcn/ui library. Keep as-is per shadcn conventions.

### `src/sqlite/`
**Local database layer** - SQLite connection, repositories, migrations, date utilities. Accessed ONLY from main process or via IPC from renderer.

### `src/supabase/`
**Cloud services layer** - Supabase client, auth, Edge Function API client. Used for AI features and quota management.

### `src/ipc/`
**IPC handlers** - Electron main process handlers. Register channels for database operations. (Consider moving to `electron/ipc/` in future)

## Data Flow Patterns

### Pattern 1: Basic CRUD (Entries)
```
User Action (UI)
  → Feature Hook (useEntries)
    → Repository (entriesRepository.create)
      → IPC Call (window.appApi.db.createEntry)
        → Main Process Handler
          → SQLite Repository
            → Database
```

### Pattern 2: AI Summary Generation
```
User Clicks "Generate"
  → Feature Hook (useCurrentWeekSummary.create)
    → Repository (summariesRepository.createForCurrentWeek)
      → IPC (get week entries) + Edge Function (AI generation)
        → Main: SQLite / Renderer: Supabase Edge Function
          → Returns summary content
            → Repository saves via IPC
              → Hook updates local state
```

### Pattern 3: Onboarding
```
App Mount
  → View (HistoryPageView)
    → Feature State (hasSeenOnboarding from localStorage)
      → Show Modal (OnboardingModal)
        → User Confirms
          → Feature State (setOnboardingSeen)
            → Modal Closes
```

## Type Safety Strategy

1. **Database types**: Defined in `sqlite/types.ts`
2. **Feature types**: Re-exported from sqlite or defined locally in `features/*/model/types.ts`
3. **IPC contracts**: Typed interfaces for request/response (see `ipc/databaseHandlers.ts` for implicit contracts)
4. **Supabase types**: Generated via `supabase gen types` in `supabase/db.types.ts`

**Future improvement**: Centralize IPC type contracts in `shared/types/ipc.ts`

## State Management

- **Local component state**: `useState` for simple UI state
- **Feature state**: Custom hooks (`useEntries`, `useCurrentWeekSummary`)
- **Persistent state**: localStorage (onboarding flag), SQLite (entries, summaries, settings)
- **No global state library**: React hooks + local storage sufficient for current scope
- **Future**: Consider React Query / TanStack Query for caching and synchronization

## File Naming Conventions

- **Components**: PascalCase (`EntryForm.tsx`, `HistoryPageView.tsx`)
- **Hooks**: camelCase with `use` prefix (`useEntries.ts`, `useCurrentWeekSummary.ts`)
- **Utilities**: camelCase (`repository.ts`, `onboardingState.ts`)
- **Types**: camelCase (`types.ts`)
- **Barrel exports**: `index.ts`

## Import Path Aliases

Configured in `tsconfig.json`:
- `@/` - Root src directory
- `@features/*` - `src/features/*` (to be added)
- `@shared/*` - `src/shared/*` (to be added)
- `@views/*` - `src/views/*` (to be added)

**Current usage**: Primarily `@/` for compatibility with shadcn.

## Testing Strategy (Future)

- **Unit tests**: Pure functions in `features/*/lib/` and `shared/lib/`
- **Hook tests**: React Testing Library for stateful hooks
- **Component tests**: Shallow rendering for UI components
- **Integration tests**: View-level flows testing feature composition
- **E2E tests**: Playwright for critical user journeys

## Evolution Guidelines

### When to create a new feature:
- Distinct user-facing capability emerges
- Existing feature grows beyond ~10 files in `model/`
- Logic doesn't fit cleanly into current features

**Example future features**:
- `features/settings/` - Popup interval, global shortcut configuration
- `features/auth/` - Login, registration, session management
- `features/capture/` - Popup capture window logic
- `features/export/` - Export entries to file

### When to introduce new layers:

**`entities/`** (domain models):
- When types/logic are shared across 3+ features
- Stable domain concepts (Entry, Summary, User)
- Pure domain functions with no UI coupling

**`widgets/`** (composite UI):
- Component used in 2+ views
- Composes multiple features
- Has own isolated responsibility

**`processes/`** (orchestrations):
- Long-running background tasks (popup cycle timer)
- Cross-feature workflows (auto-generate summaries Sunday 23:00)
- Scheduled operations


- Utils → `shared/lib/*` or `features/*/lib/*`

**Old imports still work** for backward compatibility during transition.

## Common Patterns & Recipes

### Creating a New Feature

1. Create directory structure:
```bash
mkdir -p src/features/my-feature/{model,ui,lib}
```

2. Create repository:
```typescript
// features/my-feature/model/repository.ts
export const myFeatureRepository = {
  async get() { return window.appApi.db.getMyData(); },
  async create(data) { return window.appApi.db.createMyData(data); }
};
```

3. Create hook:
```typescript
// features/my-feature/model/useMyFeature.ts
export function useMyFeature() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await myFeatureRepository.get();
    setData(result);
    setLoading(false);
  }, []);

  return { data, loading, load };
}
```

4. Create UI component:
```typescript
// features/my-feature/ui/MyFeatureView.tsx
export function MyFeatureView() {
  const { data, loading, load } = useMyFeature();
  // ... render logic
}
```

5. Export public API:
```typescript
// features/my-feature/index.ts
export { useMyFeature } from './model/useMyFeature';
export { MyFeatureView } from './ui/MyFeatureView';
export { myFeatureRepository } from './model/repository';
```

### Using a Feature in a View

```typescript
import { useMyFeature, MyFeatureView } from '@features/my-feature';
import { useOtherFeature } from '@features/other-feature';

export function MyView() {
  const myFeature = useMyFeature();
  const otherFeature = useOtherFeature();

  useEffect(() => {
    Promise.all([
      myFeature.load(),
      otherFeature.load()
    ]);
  }, []);

  return (
    <main>
      <MyFeatureView />
      {/* compose other features */}
    </main>
  );
}
```

## Debugging & Development

- **Component tree**: React DevTools
- **State inspection**: Console log in feature hooks (or React DevTools Profiler)
- **IPC debugging**: Main process console (`console.log` in `ipc/databaseHandlers.ts`)
- **Database inspection**: Use `window.appApi.db.getDatabasePath()` + SQLite browser

## Performance Considerations

- **Avoid premature optimization**: Current architecture favors clarity over performance
- **Memoization**: Use `useMemo`/`useCallback` sparingly (only when profiling shows issues)
- **List virtualization**: Consider when entry/summary lists exceed 100 items
- **Code splitting**: Route-based splitting when views grow (use React.lazy)

## Security Notes

- **IPC validation**: All inputs validated in preload bridge (basic length/type checks)
- **No nodeIntegration**: Renderer has NO direct Node.js/Electron API access
- **Context isolation**: Enabled; preload exposes only `window.appApi`
- **Supabase keys**: Anon key in renderer is safe (RLS policies protect data)
- **OpenRouter API key**: NEVER in renderer; Edge Function proxies requests

## Resources & References

- [Feature-Sliced Design](https://feature-sliced.design/) - Original FSD methodology
- [Electron Security](https://www.electronjs.org/docs/latest/tutorial/security) - Best practices
- [React Hooks Patterns](https://kentcdodds.com/blog/how-to-use-react-context-effectively) - State management

## Questions & Decisions Log

**Q**: Why not use Redux/Zustand/Jotai?
**A**: Current scope doesn't justify global state complexity. Feature hooks + local state sufficient. Revisit if cross-feature state sharing becomes painful.

**Q**: Why keep `src/lib/utils.ts` at root instead of `shared/lib/`?
**A**: shadcn convention; auto-generated imports expect this path. Keep for compatibility.

**Q**: When to introduce `entities/`?
**A**: When we have stable domain models reused across 3+ features with significant shared logic (not just types).

**Q**: Why no routing yet?
**A**: Single-window app for MVP. Add React Router when Settings or History views are implemented as separate routes.

---

**Last Updated**: 2025-01-XX (initial documentation)
**Maintained By**: Architecture decisions tracked here as codebase evolves
