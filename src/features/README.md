# src/features

**Purpose**: Domain-specific capabilities organized as self-contained slices. Each feature represents a distinct user-facing capability or business domain.

## What is a Feature?

A **feature** is a vertical slice containing everything needed to implement a specific user capability:
- User interactions (UI components)
- Business logic (hooks, state management)
- Data access (repositories calling IPC/API)
- Domain-specific utilities

## Structure of a Feature Slice

```
features/
└── <feature-name>/
    ├── model/              # Business logic & data layer
    │   ├── use*.ts        # React hooks (stateful logic)
    │   ├── repository.ts  # Data access abstraction (IPC/API calls)
    │   ├── types.ts       # Feature-specific types (optional)
    │   └── lib/           # Pure domain functions
    ├── ui/                # React components
    │   ├── *.tsx          # Components specific to this feature
    │   └── index.ts       # (optional) ui barrel
    ├── lib/               # (optional) Feature-specific pure utilities
    └── index.ts           # Public API barrel (REQUIRED)
```

## Current Features

### `entries/`
**Purpose**: CRUD operations for daily work log entries.
- **Model**: `useEntries` hook, `entriesRepository`
- **UI**: `EntryForm`, `EntryList`
- **Responsibilities**: Create, read, update, delete entries; today's entries view

### `summaries/`
**Purpose**: Weekly summary generation and display.
- **Model**: `useCurrentWeekSummary` hook, `summariesRepository`
- **UI**: `CurrentWeekSummarySection`
- **Responsibilities**: Fetch/create/display weekly summaries; content building logic

### `onboarding/`
**Purpose**: First-run user experience.
- **Model**: `onboardingState` (localStorage persistence helpers)
- **UI**: `OnboardingModal`
- **Responsibilities**: Show intro modal on first launch; track onboarding completion

## Guidelines

### ✅ DO

1. **Keep features independent**: A feature should NOT directly import from another feature's internals
2. **Use the public barrel**: Import other features only via their `index.ts`
   ```typescript
   // ✅ Good
   import { useEntries } from '@features/entries';
   
   // ❌ Bad
   import { useEntries } from '@features/entries/model/useEntries';
   ```
3. **Encapsulate domain logic**: Business rules live in `model/`, NOT in UI components
4. **Keep UI presentational**: Components should receive data via props or feature hooks
5. **Create a public API**: Export only stable, intended APIs via `index.ts`

### ❌ DON'T

1. **Mix multiple domains in one feature**: If a slice handles both "entries" and "summaries", split it
2. **Put generic utilities here**: Cross-cutting helpers belong in `shared/`
3. **Import from views or processes**: Features are a lower layer
4. **Export internal implementation details**: Keep refactor freedom by hiding internals

## Dependency Rules

**Features MAY import from:**
- `shared/*` (generic utilities, UI primitives)
- `entities/*` (when introduced, for stable domain types)
- Other `features/*/index.ts` (public API only)
- `src/components/ui/*` (shadcn primitives)
- `sqlite/types`, `supabase/types` (for typing only)

**Features MUST NOT import from:**
- Other features' internal paths (only via `index.ts`)
- `views/*` (upper layer)
- `processes/*` (orchestration layer)

## When to Create a New Feature

Create a new feature slice when:
- You have a distinct user-facing capability (e.g., "settings management")
- The logic doesn't fit cleanly into existing features
- You need to coordinate multiple operations around a single domain concept
- The slice would have at least one UI component OR one stateful hook

**Examples of future features:**
- `features/settings/` - popup interval, global shortcut configuration
- `features/auth/` - login, register, session management
- `features/capture/` - popup capture window logic
- `features/export/` - export entries to file

## Model Layer (`model/`)

The model layer contains:

### Hooks (`use*.ts`)
Stateful React hooks managing:
- Data fetching/mutations
- Loading/error states
- Optimistic updates
- Local UI state related to domain operations

### Repositories (`repository.ts`)
Thin data access abstractions:
- Wrap IPC calls (`window.appApi.*`)
- Normalize/validate payloads
- Map DTOs to domain types
- Provide test seams (dependency injection)

### Pure Functions (`lib/*.ts`)
Domain-specific utilities:
- Data transformations (e.g., grouping consecutive duplicates)
- Validators specific to the domain
- Formatters with domain semantics
- Calculation/derivation logic

## UI Layer (`ui/`)

Presentational React components:
- Accept data via props or call feature hooks internally
- Minimal business logic (delegate to model)
- Reusable within the feature (and potentially across views)
- Accessible, semantic HTML

## Public API Barrel (`index.ts`)

**Required** for every feature. Exports:
- Main hooks (e.g., `useEntries`)
- UI components (e.g., `EntryForm`)
- Repositories (if consumers need direct access)
- Types (domain models, hook options/results)

**Do NOT export:**
- Internal helpers
- Intermediate/experimental APIs
- Implementation details

## Example: Creating a New Feature

```typescript
// features/settings/model/repository.ts
export const settingsRepository = {
  async get() { return window.appApi.db.getSettings(); },
  async update(input) { return window.appApi.db.updateSettings(input); }
};

// features/settings/model/useSettings.ts
export function useSettings() {
  const [settings, setSettings] = useState(null);
  const load = useCallback(async () => {
    const s = await settingsRepository.get();
    setSettings(s);
  }, []);
  return { settings, load };
}

// features/settings/ui/SettingsForm.tsx
export function SettingsForm({ onSave }) {
  const { settings, load } = useSettings();
  // ... UI implementation
}

// features/settings/index.ts
export { useSettings } from './model/useSettings';
export { SettingsForm } from './ui/SettingsForm';
export { settingsRepository } from './model/repository';
```

## Evolution Path

When a feature grows large (>10 files in `model/`):
1. Consider splitting into multiple features by sub-domain
2. Or extract stable domain logic to `entities/<domain>/`
3. Keep the feature's `index.ts` as a facade re-exporting entity APIs

## Testing

- **Unit tests**: Pure functions in `lib/`, repository validation logic
- **Hook tests**: React Testing Library for hooks in `model/`
- **Component tests**: Shallow rendering for `ui/` components
- **Integration tests**: Full feature slice flows (optional)

## Common Pitfalls

1. **God feature**: Feature growing to handle too many concerns → split it
2. **Cross-feature coupling**: Direct imports between feature internals → use barrels
3. **Logic in components**: Business rules in UI → move to `model/`
4. **Shared code in feature**: Generic utility in a feature → move to `shared/`

## Questions?

- **"My feature needs data from another feature"** → Import the other feature's hook via its `index.ts`
- **"Two features share a type"** → Consider creating `entities/<domain>/types.ts` (future)
- **"My feature coordinates multiple features"** → Consider creating a `processes/` orchestrator (future)
- **"Generic UI component used in 2+ features"** → Move to `shared/ui/` or `widgets/` (future)