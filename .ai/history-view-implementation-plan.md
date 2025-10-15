# View Implementation Plan – History View (ISO Week-Year Safe)

This updated plan incorporates ISO week-year handling to avoid collisions when the same `week_of_year` recurs in a new year. All logic that previously keyed or grouped by plain `week_of_year` now uses `(iso_year, week_of_year)` with a composite `weekKey = '${iso_year}-W${week_of_year.toString().padStart(2,"0")}'`.

---

## 1. Overview
The History View is a reverse chronological archive of user work entries grouped by ISO week (Monday–Sunday) and day. It supports:
- Week & day hierarchical navigation
- Consecutive duplicate entry collapsing
- Inline entry edit/delete (with confirmation modal for delete)
- Weekly AI Summary card (multi-state & non-deletable)
- Incremental pagination (2 weeks per load)
- Adding new entries (launch capture flow)
- ISO week-year correctness across year boundaries
- Accessibility semantics & keyboard interactions

Enhancement: All week-related operations now store and reference ISO week-year (`iso_year`) explicitly to prevent data conflation across calendar years.

---

## 2. View Routing
- Path: `/history`
- Component: `HistoryView`
- Displays initial latest 2 ISO weeks (composite aware)
- Allows manual pagination to older weeks with correct rollover from Week 01 to last week of prior ISO year (52 or 53)

---

## 3. Component Structure
```
<HistoryView>
  <HistoryHeader>
    <AddEntryButton />
    (Future) <FiltersBar />
  </HistoryHeader>
  <WeeksContainer>
    WeekGroup*(descending by (iso_year, week_of_year))
      <WeekHeader h2>
      DayGroup*(Mon→Sun, only with items)
        <DayHeader h3>
        <ol>
          (EntryRow | DuplicateGroup)+
      <SummaryCard />
  </WeeksContainer>
  <PaginationControl />
  <GlobalPortals>
    <DeleteConfirmationModal />
    <ToastArea />
  </GlobalPortals>
</HistoryView>
```

---

## 4. Component Details

### HistoryView
Responsible for:
- Initial composite week load
- Pagination using previous ISO week calculation
- Aggregating entries into week/day view models with duplicate grouping
- Integrating summaries with state machine
- Managing modals/toasts

Key ISO changes:
- Uses `currentIsoWeekInfo()` returning `{ iso_year, week_of_year }`
- Maintains `loadedWeekKeys: WeekKey[]`
- Pagination uses `getPreviousIsoWeek({ iso_year, week_of_year })`

### HistoryHeader
- Inline AddEntryButton
- Future filter region (date range, search)
- No ISO-specific logic (delegated upstream)

### AddEntryButton
- Click triggers capture pop-up
- After successful create: derive entry’s `iso_year` from its `date`, update/inject correct week (create new week group if not present)

### WeekGroup
- Displays header: `Week NN (iso_year) – start_date – end_date`
- Uses `weekKey` as React key and internal identity
- Collapse state stored keyed by `weekKey`
- Provides summary anchor at bottom

### DayGroup
- Requirements unchanged; each entry includes `iso_year` implicitly via membership in a week

### EntryRow
- Inline edit & delete; unchanged semantically
- When saving edited content, no week relocation occurs (week_of_year & iso_year immutable unless date changed—date change is out of scope)

### DuplicateGroup
- Group consecutive identical content
- Each underlying entry retains its week context implicitly
- Group ID: `dup:${weekKey}:${firstEntryId}` to avoid cross-week collision

### SummaryCard
- Bound to `weekKey`
- Summary model now includes `iso_year`
- State computation uses `weekKey` membership lists (`generatingWeekKeys`, `failedWeekKeys`)

### PaginationControl
- Click triggers `loadPreviousTwoWeeks()` which internally calls `getPreviousIsoWeek` twice from current earliest loaded

### DeleteConfirmationModal / ToastArea
- No ISO-specific adjustments beyond receiving `weekKey` for potential rollback logic if needed

### FiltersBar (Future)
- Will filter across composite weeks; baseline architecture anticipates `iso_year` presence

---

## 5. Types (Updated with iso_year & weekKey)

```ts
// Utility
type WeekKey = `${number}-W${string}`; // e.g. "2025-W01"

interface IsoWeekIdentifier {
  iso_year: number;
  week_of_year: number;
}

// DB (augment existing Entry / Summary at type boundary if not already):
interface Entry {
  id?: number;
  content: string;
  date: string;        // YYYY-MM-DD
  week_of_year: number;
  iso_year: number;    // NEW (migration required)
  created_at: string;
}

interface Summary {
  id?: number;
  content: string;
  start_date: string;
  end_date: string;
  week_of_year: number;
  iso_year: number;    // NEW
  created_at: string;
}

// View Models
interface EntryViewModel extends Entry {
  isEditing: boolean;
  isSaving: boolean;
  draftContent?: string;
  dayKey: string; // YYYY-MM-DD
  duplicateGroupId?: string;
}

interface DuplicateGroupViewModel {
  id: string; // 'dup:<weekKey>:<firstEntryId>'
  weekKey: WeekKey;
  content: string;
  count: number;
  entryIds: number[];
  firstEntry: EntryViewModel;
  expanded: boolean;
}

interface DayGroupViewModel {
  date: string;
  weekdayLabel: string;
  headerLabel: string;
  items: (EntryViewModel | DuplicateGroupViewModel)[];
  totalEntries: number;
  weekKey: WeekKey;
}

type SummaryCardState =
  | 'unauthorized'
  | 'limitReached'
  | 'pending'
  | 'generating'
  | 'success'
  | 'failed';

interface SummaryViewModel extends Summary {
  isEditing: boolean;
  isSaving: boolean;
  draftContent?: string;
  state: SummaryCardState;
  weekKey: WeekKey;
}

interface WeekGroupViewModel extends IsoWeekIdentifier {
  weekKey: WeekKey;
  start_date: string;
  end_date: string;
  headerLabel: string;
  days: DayGroupViewModel[];
  summary?: SummaryViewModel;
  summaryState: SummaryCardState;
  collapsed: boolean;
  totalEntries: number;
  orderIndex: number; // purely positional after sort
}

interface PaginationState {
  loading: boolean;
  loadedWeekKeys: WeekKey[];
  hasMore: boolean;
  earliestLoaded?: IsoWeekIdentifier;
}

interface AuthState {
  authenticated: boolean;
  hasAIAccessConsent: boolean;
  summaryQuotaRemaining?: number;
  quotaRenewalDate?: string;
  generatingWeekKeys: WeekKey[];
  failedWeekKeys: WeekKey[];
}

interface HistoryState {
  weeks: WeekGroupViewModel[];
  loadingInitial: boolean;
  error?: string;
  pagination: PaginationState;
  deleteModal: { open: boolean; entryId?: number };
  toasts: ToastMessage[];
}

interface ToastMessage {
  id: string;
  type: 'error' | 'success' | 'info';
  text: string;
}

interface RawWeekData extends IsoWeekIdentifier {
  weekKey: WeekKey;
  start_date: string;
  end_date: string;
  entries: Entry[];
  summary?: Summary;
}

interface LoadWeeksResult {
  rawWeeks: RawWeekData[];
  hasMore: boolean;
}

interface DuplicateDetectionResult {
  items: (EntryViewModel | DuplicateGroupViewModel)[];
}

const PAGE_WEEK_COUNT = 2;
const MAX_ENTRY_LENGTH = 500;
```

---

## 6. State Management (ISO Enhancements)

Custom Hooks:
1. `useHistoryTimeline()`  
   - Tracks weeks keyed by `weekKey`.
   - Functions: `loadInitial()`, `loadMore()`, `insertEntry`, `updateEntry`, `removeEntry`, `setWeekCollapsed(weekKey, collapsed)`, `integrateSummary(weekKey, summary)`.

2. `useEntryMutations()`  
   - Accepts/returns `weekKey` where needed for rollback efficiency.

3. `useSummaryStates()`  
   - Consumes `AuthState` and existing summaries; derives `summaryState` keyed by `weekKey`.

4. `useIsoWeekNavigation()`  
   - Provides `getPreviousIsoWeek(id: IsoWeekIdentifier): IsoWeekIdentifier`
   - Provides `compareIsoWeeks(a,b)` for consistent ordering:
     ```
     function compareIsoWeeks(a, b) {
       if (a.iso_year !== b.iso_year) return b.iso_year - a.iso_year;
       return b.week_of_year - a.week_of_year;
     }
     ```

5. `useCollapsedWeekPersistence()`  
   - Persists collapsed state keyed by `weekKey` with versioned namespace.

All in-memory maps keyed by `weekKey`:
- `weekMap: Record<WeekKey, WeekGroupViewModel>`
- `summaryMap: Record<WeekKey, SummaryViewModel>`
- `collapsedSet: Set<WeekKey>`

---

## 7. API Integration (Adjusted for iso_year)

Existing IPC functions (assumed):
- `getEntriesForWeek(week_of_year)` – NOT sufficient cross-year.
- Migration Path:
  1. Add `iso_year` column (backend/main process migration).
  2. Introduce new IPC: `getEntriesForIsoWeek(iso_year: number, week_of_year: number)`.
  3. Deprecate old call (wrapper still available but used only for backward fallback until migration complete).
  4. For large fetch efficiency, optionally add `getEntriesForIsoWeeks(pairs: { iso_year: number; week_of_year: number }[])`.

Summary retrieval:
- Add `iso_year` field to Summary storage layer (migration).
- Provide `getSummaryForIsoWeek(iso_year, week_of_year)` OR fetch all & map by composite.

Entry creation:
- Main process computes `iso_year` (trusted) from `date` and returns it.

Summary editing:
- (If added) `updateSummary(id, content)` ensures `iso_year` retained.

---

## 8. User Interactions (Unchanged Behavior, Composite Safe)
All previously listed interactions remain; internal implementation references `weekKey` instead of bare week number:
- Pagination now computes prior ISO week seamlessly at year boundary.
- Deleting last entry in a week removes week group using `weekKey`.
- Duplicate group IDs stable across year transitions.

---

## 9. Conditions & Validation (Updated)

Condition | Enforcement
----------|------------
Unique week identity | Must use `weekKey` for React keys & maps
Composite sort order | `compareIsoWeeks` tuple-based descending
Collapsed persistence isolation per year | Keyed by `weekKey`
Summary ↔ Week association | Validate `summary.iso_year` & `week_of_year` match group
Entry insertion correct group | Insert using returned `iso_year` & `week_of_year`
Pagination rollover | `getPreviousIsoWeek` handles crossing into prior iso_year

---

## 10. Error Handling (Additional ISO Considerations)

Scenario | Handling
---------|---------
Legacy IPC still used without iso_year | Wrapper logs warning; triggers fallback to date-range fetch (start/end of ISO week) until migration
Missing `iso_year` in entry (legacy record) | Compute on the fly & schedule silent DB backfill task (optional)
Mismatch: entry.iso_year != group.iso_year | Log dev warning, reassign entry to correct week group dynamically
Pagination stale after year boundary | Detect negative or invalid `week_of_year` (0) and apply rollover logic

---

## 11. Implementation Steps (Adjusted)

Step | Action
-----|-------
1 | DB Migration: add `iso_year INTEGER` to `entries`, `summaries`
2 | Backfill script: for all rows compute iso year from `date` / `start_date`
3 | IPC layer: add `getEntriesForIsoWeek`, `getSummaryForIsoWeek`
4 | Deprecate old week-only methods or adapt them to derive current iso_year (temporary)
5 | Update TypeScript definitions for `Entry` & `Summary` to include `iso_year`
6 | Introduce `WeekKey` utilities: `makeWeekKey({iso_year, week_of_year})`
7 | Replace all arrays/maps keyed by numeric week to use `weekKey`
8 | Implement `useIsoWeekNavigation` helper
9 | Update grouping transformation to assign `weekKey`
10 | Adjust pagination logic to call new IPC with `(iso_year, week_of_year)`
11 | Update summary integration mapping by `weekKey`
12 | Modify components to receive/display `(Week NN – iso_year)` if needed or keep iso_year implicit (decide: show only if year differs from context)
13 | Refactor collapsed persistence to `collapsedWeeks.v2.{weekKey}`
14 | Update tests: add year boundary test cases (Week 52/53 → Week 01)
15 | Add fallback code path for legacy entries without `iso_year`
16 | Remove fallback after confirmed migration
17 | Final audit for any `.week_of_year`-only comparisons → replace with comparator
18 | Performance pass (unchanged complexity)
19 | Documentation update (this file)
20 | Ship

---

## 12. API Calls & Frontend Actions Mapping (Revised)

Action | New/Preferred IPC | Notes
-------|-------------------|------
Initial weeks load | `getEntriesForIsoWeek(iso_year, week)` | Two calls for first page
Pagination | same | Iteratively compute previous iso week
Fetch summaries | `getSummaryForIsoWeek` or `getAllSummaries()` w/ iso_year | Index by `weekKey`
Create entry | `createEntry({ content })` → returns iso_year | Insert into correct week group
Update entry | `updateEntry(id, content)` | Week relocation not supported currently
Delete entry | `deleteEntry(id)` | Remove via weekKey
Update summary (optional) | `updateSummary(id, content)` | iso_year preserved

---

## 13. Duplicate Grouping Algorithm (Unchanged)
Logic remains; simply carry `weekKey` through group & row metadata.

---

## 14. Summary State Determination Logic (Composite Adaptation)

Algorithm now uses `weekKey`:
1. If summaryMap has `weekKey` → `success`
2. Else if !auth → `unauthorized`
3. Else if quota=0 → `limitReached`
4. Else if `weekKey` in generatingWeekKeys → `generating`
5. Else if `weekKey` in failedWeekKeys → `failed`
6. Else if current week and before generation time → `pending`
7. Else if past week missing summary → `failed`
8. Fallback → `pending`

---

## 15. Validation & Business Rules Mapping (Updated)

Rule | Implementation Detail
-----|-----------------------
Distinct week identity | Use `weekKey`; never rely solely on `week_of_year`
Sorting correctness | Sort by `iso_year DESC, week_of_year DESC`
Collapsed state stability | Storage key includes iso_year
Summary association | Validate `summary.iso_year === group.iso_year`
Pagination stop condition | When lowest loaded iso week equals earliest known iso week (queried or inferred) and next previous retrieval yields empty weeks

---

## 16. Error & Edge Cases

Case | Handling
-----|---------
Week 53 exists / not exists | Use dynamic ISO calculation; do not assume max 52
Year boundary (Dec → Jan) | `getPreviousIsoWeek` handles rollover (Week 01 prev => Week 52 or 53 of previous iso_year)
Missing iso_year (legacy row) | Compute, patch VM; optionally enqueue silent migration
Two summaries same week_of_year different year | Distinct `weekKey` prevents collision

---

## 17. Accessibility & Semantics
(Identical structurally)
Enhancement: Optionally append year in header: `Week 01 (2026)` for clarity if multiple years on screen.

---

## 18. Performance Considerations
Minimal overhead: storing small `iso_year` int & string `weekKey`.
Map lookups more reliable and still O(1).
No additional heavy computations; week boundary navigation encapsulated.

---

## 19. Security & Privacy
No changes; iso_year is derived metadata from existing dates.

---

## 20. Future Enhancements
- Add “Jump to Year” quick navigation
- Group weeks under year collapsible parent if dataset grows
- Provide export per year

---

## 21. Acceptance Criteria Mapping (Status)
Original user stories unaffected; iso_year addition is internal consistency upgrade ensuring continuity across years.

---

## 22. Implementation Checklist (Iso-Year Focused)
- [ ] DB migration applied
- [ ] Backfill iso_year
- [ ] Update TS types
- [ ] Add new IPC methods
- [ ] Replace all week-only keys with weekKey
- [ ] Add iso-week helpers & tests
- [ ] Update persistence keys
- [ ] Refactor summary state lists to use weekKey
- [ ] Adjust UI headers (optional year display)
- [ ] Add boundary tests
- [ ] Remove deprecated methods
- [ ] Final QA across Dec/Jan simulated data

---

## 23. Step-by-Step Implementation Guide (Condensed)
1. Write migration script to add `iso_year` columns & backfill.
2. Extend preload/IPC contract to return `iso_year` for entries & summaries.
3. Implement `isoWeekUtils.ts`: `getISOWeekInfo(date)`, `getWeekRange(iso_year, week)`, `getPreviousIsoWeek()`, `makeWeekKey()`.
4. Update domain types & re-export.
5. Refactor data loading in `useHistoryTimeline` to use new IPC & `weekKey`.
6. Update all React keys & maps to rely on `weekKey`.
7. Replace collapsed state localStorage key namespace.
8. Update summary integration & states using `weekKey`.
9. Modify pagination logic to compute prior ISO week robustly.
10. Add tests (week rollover, 53-week years).
11. QA: Add entries on Dec 31 that belong to Week 01 of next iso_year.
12. Document new invariants in code comments.
13. Remove deprecated fallback logic after verification.
14. Final review & merge.

---

This plan supersedes any earlier version that relied on plain `week_of_year` without `iso_year` and establishes a collision-safe, future-proof foundation for historical timeline rendering.