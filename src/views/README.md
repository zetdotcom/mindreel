# src/views

**Purpose**: Route-level screen compositions that orchestrate features and present complete user interfaces. Views are the top layer of the application architecture.

## What is a View?

A **view** is a page or screen that:
- Composes multiple features into a cohesive interface
- Handles route-level concerns (if routing is added)
- Manages high-level orchestration and layout
- Contains minimal business logic (delegates to features)

## Structure

```
views/
└── <ViewName>/
    ├── <ViewName>View.tsx    # Main view component
    ├── components/            # View-specific helper components (optional)
    │   ├── SectionCard.tsx
    │   └── LayoutWrapper.tsx
    └── index.ts              # Re-export (optional)
```

## Current Views

### `Dashboard/`
**Purpose**: Main application screen showing entries, summaries, and onboarding.
- **Composes**: `entries`, `summaries`, `onboarding` features
- **Responsibilities**: 
  - Initial data loading coordination
  - Global error handling
  - Layout and section arrangement
  - Onboarding flow trigger

## Guidelines

### ✅ DO

1. **Compose features**: Use feature hooks and components via their public APIs
   ```typescript
   import { useEntries, EntryForm, EntryList } from '@features/entries';
   import { CurrentWeekSummarySection } from '@features/summaries';
   ```

2. **Handle high-level orchestration**: Coordinate initial loads, global errors, layout
3. **Keep views thin**: Business logic stays in features, not in views
4. **Use view-specific components**: Small helper components can live in `components/` subdirectory
5. **Provide layout structure**: Arrange features spatially, handle responsive design

### ❌ DON'T

1. **Put domain logic in views**: No direct IPC calls, no data transformations
2. **Import feature internals**: Only use feature public APIs (`features/*/index.ts`)
3. **Share view components**: If a component is used in multiple views, move it to `widgets/` or `shared/ui/`
4. **Create heavy view-specific state**: Delegate to features or create a new feature

## Dependency Rules

**Views MAY import from:**
- `features/*` (via public `index.ts` only)
- `widgets/*` (when introduced)
- `shared/*`
- `src/components/ui/*` (shadcn primitives)

**Views MUST NOT import from:**
- Feature internals (only public APIs)
- Other views (views are peers, not hierarchical)
- `processes/*` directly (processes run independently or are triggered by views)

## Typical View Patterns

### Pattern 1: Simple Composition
```typescript
export function DashboardView() {
  const { entries, createEntry } = useEntries();
  const { summary } = useCurrentWeekSummary();
  
  return (
    <main>
      <EntryForm onSubmit={createEntry} />
      <EntryList entries={entries} />
      <CurrentWeekSummarySection />
    </main>
  );
}
```

### Pattern 2: Coordinated Loading
```typescript
export function DashboardView() {
  const [globalError, setGlobalError] = useState(null);
  const entries = useEntries();
  const summaries = useCurrentWeekSummary();
  
  useEffect(() => {
    Promise.all([
      entries.loadToday(),
      summaries.load()
    ]).catch(e => setGlobalError(e.message));
  }, []);
  
  return (
    <main>
      {globalError && <ErrorDisplay error={globalError} />}
      {/* ... feature compositions */}
    </main>
  );
}
```

### Pattern 3: View-Specific Layout Helpers
```typescript
// components/SectionCard.tsx (view-specific helper)
function SectionCard({ title, children }) {
  return (
    <section className="bg-neutral-900 rounded-lg p-6">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

// DashboardView.tsx
export function DashboardView() {
  return (
    <main>
      <SectionCard title="Today's Work">
        <EntryList {...} />
      </SectionCard>
      <SectionCard title="This Week">
        <CurrentWeekSummarySection />
      </SectionCard>
    </main>
  );
}
```

## When to Create a New View

Create a new view when:
- You need a distinct screen/route (e.g., Settings page, Export page)
- The composition differs significantly from existing views
- You're implementing a new navigation destination

**Future view examples:**
- `views/Settings/` - dedicated settings configuration screen
- `views/History/` - full history browser with date filtering
- `views/Export/` - export wizard interface
- `views/Capture/` - popup capture window (if separate from main window)

## View-Specific Components (`components/`)

Small helper components used ONLY within a single view can live in that view's `components/` subdirectory:

```
views/
└── Dashboard/
    ├── DashboardView.tsx
    └── components/
        ├── DayGroupCard.tsx      # Used only in Dashboard
        └── SummaryWeekSlot.tsx   # Used only in Dashboard
```

**When to promote to higher level:**
- **Used in 2+ views** → Move to `widgets/` (create this layer)
- **Generic, no domain** → Move to `shared/ui/`
- **Domain-heavy** → Consider moving to feature's `ui/` and importing

## Routing (Future)

When React Router or similar is introduced:
```typescript
// App.tsx or router/index.tsx
<Routes>
  <Route path="/" element={<DashboardView />} />
  <Route path="/settings" element={<SettingsView />} />
  <Route path="/history" element={<HistoryView />} />
</Routes>
```

Views remain composition layers; routing config lives in `app/routing/` or similar.

## Testing

- **Integration tests**: Test how features work together in view context
- **Snapshot tests**: Visual regression for layout
- **Minimal unit tests**: Views have little testable logic (business logic is in features)

## Common Responsibilities

Views typically handle:
- **Initial orchestration**: Trigger parallel loads on mount
- **Global error boundaries**: Catch and display cross-feature errors
- **Layout & spacing**: Arrange features visually
- **Meta concerns**: Page titles, analytics events, scroll restoration
- **View-level modals**: Overlays that span multiple features (use sparingly)

## Common Pitfalls

1. **Fat views**: Too much logic in view → extract to feature or create new feature
2. **Direct IPC calls**: View calling `window.appApi.*` → use feature repositories
3. **Shared view components without promotion**: Copy-pasted components → move to `widgets/` or `shared/ui/`
4. **Tight coupling to global state**: View depending on implicit context → pass data explicitly or use feature hooks

## Questions?

- **"My view needs custom data logic"** → Create a new feature or extend existing one
- **"I have a component used in 2 views"** → Move it to `widgets/` (create layer if needed) or `shared/ui/` if generic
- **"View is getting too complex"** → Split features, or break into sub-views with a parent router
- **"Need to share state between features in a view"** → Consider a coordinating hook or a `processes/` orchestrator (future)

## Current Exports

See individual view directories for their exports. Views are typically imported directly by the app root or router configuration.