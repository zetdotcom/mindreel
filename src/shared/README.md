# src/shared

**Purpose**: Cross-cutting utilities, UI primitives, and generic helpers that are domain-agnostic and reusable across all features and views.

## What belongs here

### ✅ Include

- **Generic UI components** (`shared/ui/`)
  - Error displays, loading spinners, empty states
  - Components with NO domain logic (e.g., `ErrorDisplay`, `LoadingSpinner`)
  - NOT shadcn components (those live in `src/components/ui/`)

- **Pure utility functions** (`shared/lib/`)
  - Date/time formatters (if generic, not domain-specific)
  - String manipulation helpers
  - Generic data transformation utilities
  - Re-exported from `src/lib/utils.ts` if needed for compatibility

- **API clients & adapters** (`shared/api/`)
  - IPC client wrappers (thin abstractions over `window.appApi`)
  - Supabase client initialization
  - HTTP fetch utilities
  - Edge Function callers (generic request/response handling)

- **Generic hooks** (`shared/hooks/`)
  - `useDebounce`, `useInterval`, `useLocalStorage`
  - NO domain-specific hooks (those go in `features/*/model/`)

- **Cross-cutting types** (`shared/types/`)
  - Generic type utilities (`Result<T>`, `Branded<T>`, etc.)
  - Global type declarations (if not in root-level `.d.ts`)

- **Configuration** (`shared/config/`)
  - Feature flags
  - Environment variable normalization
  - Build-time constants

- **Global styles** (`shared/styles/`)
  - Tailwind entry point (if moved from root)
  - CSS resets, global utilities

### ❌ Exclude

- **Domain logic** → goes to `features/*/model/` or `entities/*/lib/`
- **Feature-specific components** → goes to `features/*/ui/`
- **Business workflows** → goes to `features/*/model/` or `processes/`
- **Route-level compositions** → goes to `views/`
- **shadcn UI components** → stay in `src/components/ui/` (per project convention)

## Dependency Rules

- **MUST NOT** import from `features/`, `views/`, or `processes/`
- **MAY** import from other `shared/*` submodules
- **MAY** import from `src/components/ui/` (shadcn primitives)
- **MAY** import from infrastructure (`sqlite/`, `supabase/`) BUT only for typing/interfaces, not for direct usage

## Structure

```
shared/
├── ui/              # Generic presentational components
├── lib/             # Pure utility functions
├── api/             # API clients, IPC wrappers
├── hooks/           # Generic React hooks
├── types/           # Cross-cutting type definitions
├── config/          # App-wide configuration
├── styles/          # Global styles (optional)
└── index.ts         # Public barrel export (keep minimal)
```

## Guidelines

1. **Keep it minimal**: Only export truly generic, stable APIs
2. **No domain coupling**: If a helper knows about "Entry" or "Summary", it doesn't belong here
3. **Single responsibility**: Each file should do one thing well
4. **Explicit exports**: Prefer named exports over `export *` in barrel files
5. **Test coverage**: Pure utilities here should have unit tests

## Migration Path

When a helper starts gaining domain knowledge:
1. Move it to the appropriate `features/*/lib/` or create `entities/*/lib/`
2. Update imports across the codebase
3. Remove from `shared/index.ts` if exported there

## Examples

**Good** (belongs in shared):
```typescript
// shared/lib/formatDate.ts
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}
```

**Bad** (domain-specific, belongs in features/entries):
```typescript
// ❌ DON'T put this in shared/lib/
export function formatEntryTimestamp(entry: Entry): string {
  return new Date(entry.created_at).toLocaleTimeString();
}
```

## Current Exports

See `shared/index.ts` for the current public API surface.