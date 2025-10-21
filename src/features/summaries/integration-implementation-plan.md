# AI Weekly Summary Generation Integration Plan

## Status Summary (2025-10-21 – Updated)
Generation orchestrator (`aiGeneration.ts`) implemented with:
- Week completion (weekPassed) validation.
- Auth token retrieval & edge function invocation via `fetch`.
- Payload construction + dev-only logging.
- Duplicate detection (returns `alreadyExists`).
- Distinct UI states mapped: `unauthorized`, `limitReached`, `failed`, `unsupported`, `alreadyExists`, `success`.
- Persistence of arbitrary ISO week summaries via existing IPC `createSummary` (guard only when handler absent).
- Returns full persisted `Summary` object (not just content).
- UI wired (WeekGroup → SummaryCard) including weekPassed gating and new states.

Not yet done:
- Dedicated IPC handler rename (`createSummaryForIsoWeek`) / uniqueness DB index.
- Formal custom error classes (currently removed for simplicity; direct state mapping used instead).
- Tooltip UX for unsupported; currently simple message block.
- Additional validation (weekday alignment) & AbortController.
- Docs/tests & DB uniqueness constraint.

## Summary
Client-side manual AI weekly summary generation integrated. Users can generate after a week completes; orchestrator gathers entries, calls Supabase Edge Function, persists result, and updates UI state. Duplicate and unsupported persistence scenarios surfaced via explicit states.

## Goals
- [x] Invoke edge function from renderer with correct payload & auth token
- [x] Respect product rule: generation allowed only for completed weeks (weekPassed)
- [x] Keep repositories DB‑focused; isolate network logic in a small generation module
- [x] Reuse existing week start/end dates from `WeekGroupViewModel`
- [x] Use default language `en` (configurable later without refactor)
- [x] Provide minimal but structured logging for debugging failures
- [~] Map all edge function errors to a single failed state (intentionally kept distinct states: unauthorized, limitReached, failed, unsupported)
- [x] Keep implementation simple & aligned with Feature-Sliced architecture
- [x] Persist summaries for any completed ISO week (via existing `createSummary`) 

(Use [~] to denote decision change from original plan.)

## Non-Goals
Unchanged from original (quota UI, cancellation UI, scheduling, multi-language selector, optimistic quota display).

## Architecture Placement
- [x] Module: `src/features/summaries/model/aiGeneration.ts` exporting `generateWeeklySummary`
- [x] Direct `fetch` acceptable for single function; abstraction deferred
- [x] Auth via `supabaseClient.auth.getSession()`
- [x] Entries via IPC (`getEntriesForIsoWeek`)
- [x] Persistence via existing `createSummary` (renamed handler optional future) – returns full Summary

## Data Flow (Manual Generation)
1. User clicks Generate on `SummaryCard` for a completed week.
2. WeekGroup `onGenerate` calls orchestrator with iso meta.
3. Orchestrator fetches entries & validates completed week window.
4. [x] Build request payload `{ week_start, week_end, entries: [...], language }`.
5. [x] Retrieve auth session → unauthorized if absent.
6. [x] Invoke edge function.
7. [x] On success: persist via repository `createForIsoWeek` (uses `createSummary`).
8. [x] Update in-memory week model with returned `Summary` + state `success`.
9. [x] Map error outcomes to UI states (`unauthorized`, `limitReached`, `failed`, `unsupported`, `alreadyExists`).

## Implementation Steps (Reconciled)

### Section A: Repository & IPC Adjustments
- [x] A1. Verify existing handler supports arbitrary iso week (current `createSummary` does)
- [x] A2. (Adjusted) Reuse existing `createSummary`; defer dedicated `createSummaryForIsoWeek`
- [x] A3. Repository `createForIsoWeek` now directly calls handler (throws if absent)
- [x] A4. Backward compatibility retained
- [ ] A5. Add explicit `createSummaryForIsoWeek` IPC alias (optional)
- [ ] A6. Confirm / add DB uniqueness migration for `(iso_year, week_of_year)`
- [ ] A7. Add unique index enforcement & duplicate error surface (currently handled pre-call)

### Section B: Edge Function Generation Module
- [x] B1–B4 Implemented
- [x] B5 (Dropped) Custom error classes removed (simplified state mapping)
- [x] B6 Week completion validation implemented

### Section C: UI Integration
- [x] C1 Hooked orchestrator in `WeekGroup.tsx`
- [x] C2 Error state mapping via result union (no thrown custom errors)
- [x] C3 Removed noisy console logs (pending final sweep) – summary debug removed, week log to remove
- [x] C4 WeekPassed gating (button hidden/disabled until complete & entries exist)
- [x] C5 Unsupported state message (no tooltip yet)

### Section D: Supabase Client Usage
- [x] D1–D2 Implemented
- [ ] D3 Optional abstraction (deferred)
- [ ] D4 Optional singleton helper (deferred)

### Section E: Types & Validation
- [ ] E1 Reuse server/shared request type (still local payload structure)
- [x] E2 Entries shape conforms
- [x] E3 Using provided start/end
- [x] E4 Introduced shared `CreateIsoWeekSummaryArgs` (repository imports)
- [ ] E5 Monday/Sunday structural validation (not yet implemented)

### Section F: Error Handling & Logging
- [ ] F1–F2 Custom error classes (intentionally skipped)
- [x] F3 Dev-only logging
- [x] F4 Generic user messaging
- [x] F5 Distinguish `unsupported` vs `failed`

### Section G: Persistence & State Update
- [x] G1 Arbitrary ISO week persistence
- [x] G2 Store content verbatim
- [x] G3 Return full persisted `Summary`
- [x] G4 Update in-memory state immediately

### Section H: Abort & Future-Proofing
- [ ] H1 AbortController parameter
- [ ] H2 Cancel UI (still deferred)

### Section I: Manual Verification (Pending)
- [ ] I1 Completed past week generation
- [ ] I2 Unauthorized
- [ ] I3 Edge/network failure
- [ ] I4 In-progress week blocked
- [ ] I5 Multiple past weeks
- [ ] I6 Duplicate generation (currently yields `alreadyExists` state)
- [ ] I7 Unsupported persistence simulation

### Section J: Cleanup / Refactors
- [x] J1 Remove TEST-only logging (partial – verify WeekGroup console removal)
- [x] J2 Remove `defaultProps` hack for `weekPassed`
- [ ] J3 Final pass for unused imports
- [ ] J4 Remove commentary referring to future current-week limitation
- [ ] J5 Update any docs still claiming “current week only” limit

## Open Follow-Ups / Next Steps
1. Add DB unique index migration for `(iso_year, week_of_year)`.
2. Replace pre-existence check + state with optimistic attempt + DB unique error mapping (optional improvement).
3. Introduce weekday alignment assertion (dev-only) for start/end dates.
4. Add AbortController support for future cancellation features.
5. Add test suite covering success, unauthorized, limitReached, duplicate, unsupported, week-incomplete.
6. Optional: unify edge function invocation behind shared client abstraction if more functions added.
7. Final cleanup of any leftover console logs and unused imports once validated.

## Risks & Mitigations (Updated)
- Duplicate summaries: mitigated by pre-check; strengthen with DB unique index.
- Week boundary timezone issues: current UTC comparison acceptable; add explicit normalization later.
- Unsupported handler scenario: explicit `unsupported` state already present.
- Rapid clicks: guarded by `generating` state disabling button.

## Future Enhancements (Unchanged)
- Scheduling, multi-language, quota display, cancellation UI, improved formatting.

---
Document updated to reflect current implementation and adjusted scope decisions.
