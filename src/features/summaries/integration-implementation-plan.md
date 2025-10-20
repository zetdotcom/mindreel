# AI Weekly Summary Generation Integration Plan

## Summary
Implement client-side integration for manual weekly AI summary generation using the existing Supabase Edge Function `generate_weekly_summary`. The `SummaryCard` Generate button will trigger a flow that (only after the week has passed) gathers that week's entries, calls the edge function with the required payload and auth token, persists the returned summary into local SQLite via existing summaries repository, and updates UI state (success / failed / unauthorized). Quota and error reasoning remain server‑side; UI shows only generic success/failure.

## Goals
- Invoke edge function from renderer with correct payload & auth token
- Respect product rule: generation allowed only for completed weeks (weekPassed)
- Keep repositories DB‑focused; isolate network logic in a small generation module
- Reuse existing week start/end dates from `WeekGroupViewModel`
- Use default language `en` (configurable later without refactor)
- Provide minimal but structured logging for debugging failures
- Map all edge function errors to a single failed state (or unauthorized) per current UX requirement
- Keep implementation simple & aligned with Feature-Sliced architecture

## Non-Goals
- Displaying quota or detailed error codes in UI
- Implementing cancellation UI (AbortController wiring only for future)
- Automatic weekly scheduled generation (manual trigger only here)
- Multi-language selection or settings UI
- Optimistic quota or summary state management

## Architecture Placement
- New module: `src/features/summaries/model/aiGeneration.ts` (or `weeklySummaryGeneration.ts`) exporting a single `generateWeeklySummaryForWeek(week: WeekGroupViewModel): Promise<Summary>` and a lower-level `buildWeeklySummaryRequest(week, entries)` helper.
- Edge function invocation will use existing `EdgeFunctionClient` from `src/supabase/api` (ensure single instance or create ephemeral one via `EdgeFunctionClient.fromEnv`).
- Authentication token retrieved via existing Supabase renderer client: `supabaseRendererClient.auth.getSession()`.
- Entries for the target week obtained via existing history/week data source (already materialized in `WeekGroupViewModel.days[*].items`). If raw Entry objects needed, derive them from loaded week structure (fall back to IPC if necessary later).
- Persistence via `summariesRepository.createForCurrentWeekWithContent(summaryContent)` (requires current week context; for arbitrary past week create a new repository method if needed). For now we assume generating only the week currently represented by that week group and that repository provides necessary insert with provided week metadata—if not, add a dedicated `createSummaryForIsoWeek(isoYear, weekOfYear, start_date, end_date, content)` IPC handler.

## Data Flow (Manual Generation)
1. User clicks Generate on `SummaryCard` for a past (completed) week.
2. `SummaryCard.onGenerate` calls new hook/function passing `weekIdentifier` (iso_year + week_of_year).
3. Generation orchestrator gathers week model (start_date, end_date, entries) ensuring Monday→Sunday range.
4. Build `WeeklySummaryRequest` (week_start, week_end, entries: [{ timestamp, text }]). Default `language: 'en'`.
5. Fetch current Supabase session; if missing → throw auth error → UI sets `unauthorized` state.
6. Invoke `client.generateWeeklySummary(request, accessToken)` with abort controller.
7. On success: receive `summary` string → persist via repository (new iso-week aware create method if necessary) → return domain `Summary`.
8. Update week model: attach summary + set `summaryState='success'`.
9. On error: log mapped details (`reason`, `message`, request size) → set `summaryState='failed'` or `unauthorized`.

## Implementation Steps

### Section A: Repository & IPC Adjustments (Only if Needed)
- [ ] A1. Verify existing IPC/database handler supports creating summary for arbitrary iso week (with provided dates). If only current week is supported, add handler `createSummaryForIsoWeek({ content, start_date, end_date, week_of_year, iso_year })` in `ipc/databaseHandlers.ts` and expose via preload.
- [ ] A2. Extend `SummariesDbApi` interface in `features/summaries/model/repository.ts` with new method if required: `createSummaryForIsoWeek(...)`.
- [ ] A3. Add corresponding implementation wrapper `createForIsoWeek(weekInfo, content)` inside repository; keep existing methods unchanged.
- [ ] A4. Ensure backward compatibility (do not break existing current-week summary creation path).

### Section B: Edge Function Generation Module
- [ ] B1. Create `aiGeneration.ts` under `features/summaries/model/` exporting orchestration functions.
- [ ] B2. Implement `buildWeeklySummaryRequest(week: WeekGroupViewModel): WeeklySummaryRequest` (derive entries: flatten day.items → filter actual entries → map to `{ timestamp: entry.created_at OR entry.timestamp, text: entry.content }`).
- [ ] B3. Implement `generateWeeklySummaryForWeek(week: WeekGroupViewModel, options?: { abortSignal?: AbortSignal })` performing: validation (weekPassed, entries length >0), session retrieval, request building, edge function call, persistence, returning updated `Summary`.
- [ ] B4. Add lightweight internal logger (`debugWeeklySummary(message, meta?)`) gated by `import.meta.env.DEV` to avoid noisy production logs.
- [ ] B5. Handle errors: detect `EdgeFunctionError.reason==='auth_error'` → throw custom `UnauthorizedGenerationError`; others → throw `SummaryGenerationError` with original reason for internal logs.

### Section C: UI Integration (SummaryCard / WeekGroup)
- [ ] C1. Replace temporary `onGenerate={(x) => console.log(...)}` in `WeekGroup.tsx` with call to new orchestrator (`generateWeeklySummaryForWeek(week)`), passed via a prop binding.
- [ ] C2. Wrap generation call in try/catch inside `WeekGroup` handler to translate thrown custom errors into `summaryState` updates (`unauthorized` or `failed`). Maintain existing state transitions (`generating` → success/failed).
- [ ] C3. Ensure `SummaryCard` `handleGenerate` logic remains unchanged except expecting `onGenerate` to throw on failure (already supported). Remove console noise after integration.
- [ ] C4. Confirm weekPassed logic correctness (week.end_date < now). If necessary, adjust comparison to use end_date 23:59:59 or add one-day grace; for MVP keep strict `now > end_date`.

### Section D: Supabase Client Usage
- [ ] D1. Reuse renderer client: import `supabaseRendererClient` for session retrieval (`auth.getSession()`). Avoid creating additional supabase instances.
- [ ] D2. Access token: `const accessToken = session?.access_token`; validate presence.
- [ ] D3. Instantiate `EdgeFunctionClient` once (cache per module). Use env vars `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- [ ] D4. Optional: expose a `getEdgeFunctionClient()` singleton in `aiGeneration.ts` to avoid multi-instantiation.

### Section E: Types & Validation
- [ ] E1. Reuse existing `WeeklySummaryRequest` & entry types from `supabase/api/types.ts`; avoid duplicating.
- [ ] E2. Ensure entries conform to edge function expected shape (`timestamp`, `text`). Map local `Entry.content` → `text`.
- [ ] E3. Confirm week_start (Monday) and week_end (Sunday) strings already in `WeekGroupViewModel`; use them directly without recomputation.

### Section F: Error Handling & Logging
- [ ] F1. Implement error class wrappers for UI distinction (`UnauthorizedGenerationError`, `SummaryGenerationError`).
- [ ] F2. In UI catch block: if `instanceof UnauthorizedGenerationError` → set `summaryState='unauthorized'`; else → `summaryState='failed'`.
- [ ] F3. Log detailed debug info (reason, message, counts) only in dev mode.
- [ ] F4. Avoid user-facing error detail; keep generic message already in `SummaryCard` failed state.

### Section G: Persistence & State Update
- [ ] G1. After successful edge function response, call repository create method; update week model (`week.summary`, `week.summaryState='success'`).
- [ ] G2. Ensure summary content stored verbatim.
- [ ] G3. Provide returned `Summary` to caller so parent state can reconcile (immutable update pattern in history feature state management).

### Section H: Abort & Future-Proofing
- [ ] H1. Provide optional `AbortController` support in orchestrator; return controller or accept `abortSignal`.
- [ ] H2. For MVP do not expose Cancel UI; simply ensure that module cleans up on component unmount if needed (defer if complexity high).

### Section I: Testing & Verification (Developer Manual Checks)
- [ ] I1. Manual test: Generate summary for a completed week with entries while authenticated; verify summary inserted in SQLite and displayed.
- [ ] I2. Manual test: Click Generate while logged out; verify unauthorized state.
- [ ] I3. Manual test: Force edge failure (disconnect network) → failed state logged.
- [ ] I4. Manual test: Attempt generation for in-progress current week (should be blocked pre-request with an error -> either remain pending or show a dev log). Decide: keep button hidden until weekPassed ensures no action.

### Section J: Cleanup / Refactors
- [ ] J1. Remove TEST-only logging (`console.log("xxxx week summary" ...)`) from `SummaryCard` after integration.
- [ ] J2. Remove `defaultProps` injection hack for `weekPassed` in `WeekGroup.tsx`; pass prop directly (already done) and delete hack lines (44–47) once stable.
- [ ] J3. Ensure no unused imports remain.

## Rollout Considerations
- Perform behind a small internal feature flag if desired (`ENABLE_AI_SUMMARY=true`) by gating the Generate button; skip for MVP if unnecessary.
- Monitor edge function logs for validation errors to adjust payload construction.

## Risks & Mitigations
- Risk: Repository may lack iso-week explicit create method → Mitigation: add targeted IPC handler without broad schema change.
- Risk: Large entry payload size → Mitigation: rely on edge validation; optionally truncate extremely long texts client-side later.
- Risk: Multiple rapid clicks → Mitigation: UI state sets `generating` and disables button (already present via `disabled={!onGenerate}` + state check).

## Future Enhancements (Out of Scope Now)
- Scheduled automatic generation (Sunday 23:00) via local process or server push.
- Multi-language user selection.
- Display quota usage and cycle reset countdown.
- Cancel generation mid-request; offline queue for retries.
- Improved formatting (markdown → rich list rendering) in SummaryCard.

---
Prepared for implementation. Follow numbered sections sequentially; Section A can be skipped if existing DB handler already supports arbitrary week creation.
