# AI Weekly Summary Generation Integration Plan

## Status Summary (2025-10-21)
Core generation module (`aiGeneration.ts`) exists and calls the `generate_weekly_summary` edge function via a direct `fetch` with auth bearer token. Payload building, logging, and basic error state mapping (unauthorized / quota / failed) are implemented. Repository adds a `createForIsoWeek` wrapper that currently only persists when the target week is the current week (backend limitation). UI (WeekGroup / SummaryCard) integration, weekPassed enforcement, custom error classes, abort support, arbitrary past‑week persistence, and returning a full persisted Summary object remain outstanding.

## Summary
Implement client-side integration for manual weekly AI summary generation using the existing Supabase Edge Function `generate_weekly_summary`. The `SummaryCard` Generate button will trigger a flow that (only after the week has passed) gathers that week's entries, calls the edge function with the required payload and auth token, persists the returned summary into local SQLite via existing (now extended) summaries repository, and updates UI state (success / failed / unauthorized / limitReached / unsupported). Quota and detailed error reasoning remain server‑side; UI shows only generic success/failure plus unauthorized or limit reached.

## Goals
- [x] Invoke edge function from renderer with correct payload & auth token
- [ ] Respect product rule: generation allowed only for completed weeks (weekPassed)
- [x] Keep repositories DB‑focused; isolate network logic in a small generation module
- [x] Reuse existing week start/end dates from `WeekGroupViewModel`
- [x] Use default language `en` (configurable later without refactor)
- [x] Provide minimal but structured logging for debugging failures
- [ ] Map all edge function errors to a single failed state (or unauthorized) per current UX requirement (currently returns distinct states)
- [x] Keep implementation simple & aligned with Feature-Sliced architecture
- [ ] Persist summaries for any completed ISO week (not just current week)

## Non-Goals
- Displaying quota or detailed error codes in UI
- Implementing cancellation UI (AbortController wiring only for future)
- Automatic weekly scheduled generation (manual trigger only here)
- Multi-language selection or settings UI
- Optimistic quota or summary state management

## Architecture Placement
- [x] New module: `src/features/summaries/model/aiGeneration.ts` exporting orchestration (named `generateWeeklySummary` instead of `generateWeeklySummaryForWeek` but equivalent intent)
- [x] Edge function invocation uses direct `fetch` (divergence from original `EdgeFunctionClient` idea; revisit if more functions added)
- [x] Authentication token retrieved via existing Supabase renderer client: `supabaseClient.auth.getSession()`
- [x] Entries for the target week obtained via IPC (`getEntriesForIsoWeek`); future: derive from loaded WeekGroup VM if already present
- [ ] Persistence via new IPC handler `createSummaryForIsoWeek` (to be added) for arbitrary week creation (currently limited to current week fallback)

## Data Flow (Manual Generation)
1. User clicks Generate on `SummaryCard` for a past (completed) week. (UI hook-up pending)
2. `SummaryCard.onGenerate` calls orchestrator passing week meta (iso_year, week_of_year, start_date, end_date).
3. Orchestrator gathers entries for that ISO week (via IPC or from in-memory VM) and validates Monday→Sunday range & completion.
4. [x] Build request payload `{ week_start, week_end, entries: [{ timestamp, text }], language: 'en' }`.
5. [x] Fetch current Supabase session; if missing → unauthorized state.
6. [x] Invoke edge function with auth token (Abort support pending).
7. [ ] On success: persist summary via `createSummaryForIsoWeek` IPC handler (supports arbitrary past weeks) and receive persisted `Summary`.
8. [ ] Update week model / UI state with returned `Summary` (`summaryState='success'`).
9. [x] On error: log details (dev) → map to unauthorized / limitReached / failed / unsupported.

## Implementation Steps

### Section A: Repository & IPC Adjustments (Only if Needed)
- [x] A1. Verify existing IPC/database handler supports creating summary for arbitrary iso week (it does not yet)
- [ ] A2. Extend `SummariesDbApi` interface in `features/summaries/model/repository.ts` with new method: `createSummaryForIsoWeek(args)`
- [ ] A3. Update repository `createForIsoWeek` to always call new IPC method (remove current-week guard); throw distinct error if handler absent
- [x] A4. Ensure backward compatibility (retain current-week methods)
- [ ] A5. Add IPC handler `createSummaryForIsoWeek({ iso_year, week_of_year, start_date, end_date, content })` in `ipc/databaseHandlers.ts` and expose via preload
- [ ] A6. Confirm DB schema includes (iso_year, week_of_year, start_date, end_date); add migration if `iso_year` or uniqueness constraint absent
- [ ] A7. Add unique index on `(iso_year, week_of_year)` to prevent duplicates & accelerate lookups

### Section B: Edge Function Generation Module
- [x] B1. Create `aiGeneration.ts` under `features/summaries/model/`
- [x] B2. Implement payload builder (implemented inline as `buildEdgePayload`)
- [x] B3. Implement `generateWeeklySummaryForWeek` (named `generateWeeklySummary`; needs enhancement: weekPassed validation + return persisted Summary object)
- [x] B4. Add lightweight internal logger (`logDebug` gated by env)
- [ ] B5. Handle errors with custom error classes (`UnauthorizedGenerationError`, `QuotaExceededError`, `SummaryGenerationError`, `UnsupportedIsoWeekPersistenceError`)
- [ ] B6. Validate week completion before invoking edge function (`end_date < now`)

### Section C: UI Integration (SummaryCard / WeekGroup)
- [ ] C1. Replace temporary `onGenerate` in `WeekGroup.tsx` with orchestrator call passing full week meta
- [ ] C2. Wrap generation call in try/catch to translate custom errors into `summaryState` (unauthorized / limitReached / failed / unsupported)
- [ ] C3. Ensure `SummaryCard` expects throw-on-failure (or state union) and remove console noise
- [ ] C4. Enforce weekPassed logic (hide/disable Generate button if week incomplete)
- [ ] C5. Show tooltip / disabled state if persistence unsupported (unsupported error)

### Section D: Supabase Client Usage
- [x] D1. Reuse renderer client for session retrieval
- [x] D2. Access token extraction implemented
- [ ] D3. (Optional) Abstract edge function invocation behind shared client if more functions added
- [ ] D4. Provide optional singleton helper if abstraction introduced

### Section E: Types & Validation
- [ ] E1. Reuse existing `WeeklySummaryRequest` & entry types from `supabase/api/types.ts` instead of ad-hoc local type
- [x] E2. Ensure entries conform to expected shape (`timestamp`, `text`)
- [x] E3. Use provided `start_date` / `end_date` directly
- [ ] E4. Introduce `CreateIsoWeekSummaryArgs` shared between IPC handler, repository, and orchestrator
- [ ] E5. Assert (dev) that `start_date` is Monday and `end_date` is Sunday; warn if mismatch

### Section F: Error Handling & Logging
- [ ] F1. Implement error class wrappers (`UnauthorizedGenerationError`, `QuotaExceededError`, `SummaryGenerationError`, `UnsupportedIsoWeekPersistenceError`)
- [ ] F2. UI catch block: map error classes to `summaryState`
- [x] F3. Log detailed debug info only in dev mode
- [x] F4. Avoid user-facing detailed error; keep generic messaging
- [ ] F5. Distinguish `unsupported` (infra gap) from generic `failed` to guide UI disabling

### Section G: Persistence & State Update
- [x] G1. Persist summary via repository wrapper (current implementation limited to current week; to be updated for arbitrary week)
- [x] G2. Store summary content verbatim
- [ ] G3. Return full persisted `Summary` object from orchestrator (currently only returns content)
- [ ] G4. Update in-memory week model / context store immediately with returned `Summary`

### Section H: Abort & Future-Proofing
- [ ] H1. Provide optional `AbortController` / `abortSignal` parameter & pass to fetch
- [ ] H2. (Still out of scope) Cancel UI; just ensure safe cleanup

### Section I: Testing & Verification (Developer Manual Checks)
- [ ] I1. Manual test: completed past week generation (authenticated)
- [ ] I2. Manual test: unauthorized state while logged out
- [ ] I3. Manual test: forced edge failure (network disconnect)
- [ ] I4. Manual test: attempt generation for in-progress current week (should be blocked)
- [ ] I5. Manual test: generate summaries for multiple distinct past weeks (persist each separately)
- [ ] I6. Manual test: duplicate generation same week (decide behavior: prevent duplicate vs overwrite)
- [ ] I7. Manual test: unsupported persistence path (simulate missing handler) → `unsupported` state surfaced

### Section J: Cleanup / Refactors
- [ ] J1. Remove TEST-only logging in `SummaryCard` after integration
- [ ] J2. Remove `defaultProps` injection hack for `weekPassed` in `WeekGroup.tsx` (verify then delete)
- [ ] J3. Ensure no unused imports remain
- [ ] J4. Remove temporary current-week guard logic in repository once arbitrary handler added
- [ ] J5. Update docs referencing "current week only" limitation

## Rollout Considerations
- Perform behind internal feature flag (`ENABLE_AI_SUMMARY=true`) if desired (optional)
- Monitor edge function logs for validation errors to adjust payload construction

## Risks & Mitigations
- Risk: Repository lacks arbitrary iso-week create → Mitigation: implement IPC handler (A5) + unique index (A7)
- Risk: Duplicate summaries for same week → Mitigation: DB unique constraint + pre-existence check
- Risk: Large entry payload size → Mitigation: rely on edge validation; optional client truncation later
- Risk: Multiple rapid clicks → Mitigation: UI `generating` state disables button
- Risk: Timezone boundary misclassifies completion → Mitigation: normalize week end check to UTC
- Risk: Unsupported handler leads to confusing failures → Mitigation: explicit `unsupported` error class & UI messaging

## Future Enhancements (Out of Scope Now)
- Scheduled automatic generation (Sunday 23:00) via local process or server push
- Multi-language user selection
- Display quota usage and cycle reset countdown
- Cancel generation mid-request; offline queue for retries
- Improved formatting (markdown → rich list rendering) in SummaryCard

---
Prepared for continued implementation. Updated with new tasks for arbitrary week persistence and refined error handling while retaining original plan context.
