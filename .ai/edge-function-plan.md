# Edge Function & Quota Implementation Plan (MindReel MVP)

Status: Approved directions incorporated (manual re-generation not exposed, user-selectable summary language, no UI for quota, ignore `api_version` client-side).

---

## 1. Scope

Implement a single Supabase Edge Function `generate_weekly_summary` that:
1. Authenticates the user (Supabase JWT).
2. Validates a weekly payload (Mon–Sun).
3. Resets or evaluates rolling 28‑day quota (limit 5 successful summaries).
4. Normalizes & compacts entries.
5. Builds a structured prompt (language = user choice or fallback heuristic).
6. Calls OpenRouter with server-side key.
7. On success: increments quota (concurrency-safe) and returns summary + remaining quota + cycle end timestamp.
8. On provider failure: returns a retryable error without consuming quota.
9. Does not persist raw entries or summary server-side.

Out of scope: paid tiers, multi-week arbitrary summaries, manual regeneration UI, metrics storage, fallback model chain.

---

## 2. Design Decisions (Confirmed)

| Aspect | Decision |
|--------|----------|
| Quota visibility | Not shown in UI (still returned for potential logging/debug) |
| Language selection | Explicit `language: 'pl' | 'en'` from client settings; if absent, heuristic fallback |
| `week_of_year` | Removed from payload; server derives internally |
| Cycle start | First successful summary triggers (row created if missing) OR first attempt if row needs creation for quota evaluation (count 0) |
| Concurrency control | Optimistic row-level guard using conditional `UPDATE ... WHERE ai_summaries_count = <previous>` |
| `api_version` | Not consumed by client; can still include internally for forward evolution (optional) |
| Transactions | Avoid full custom transaction layer; rely on conditional update pattern for safe increment |
| RLS | Enabled with read policy optional; Edge Function uses service role key so unaffected |
| Logging | Minimal structured logs (user_id, outcome, chars, counts). No full entry text persisted |

---

## 3. Request / Response (Final MVP Contract)

### Request JSON
```/dev/null/request.json#L1-20
{
  "week_start": "2025-02-10",            // Monday (YYYY-MM-DD)
  "week_end": "2025-02-16",              // Sunday (YYYY-MM-DD)
  "entries": [
    { "timestamp": "2025-02-10T09:12:00.000Z", "text": "Refactor auth logic" },
    { "timestamp": "2025-02-10T11:40:00.000Z", "text": "Fix Electron auto-update issue" }
  ],
  "language": "pl",                      // Optional; 'pl' | 'en'; if missing -> heuristic
  "client_meta": {                       // Optional
    "app_version": "0.2.0",
    "timezone": "Europe/Warsaw",
    "locale": "pl-PL"
  }
}
```

### Success Response
```/dev/null/response_success.json#L1-12
{
  "ok": true,
  "summary": "- Refaktoryzacja modułu uwierzytelniania...\n- Naprawiono mechanizm autoaktualizacji...",
  "remaining": 3,
  "cycle_end": "2025-03-05T12:34:56.000Z"
}
```

### Error Responses
```/dev/null/response_errors.json#L1-40
{ "ok": false, "reason": "auth_error", "message": "Invalid or expired token" }
{ "ok": false, "reason": "validation_error", "message": "Week range must be exactly 7 days (Mon–Sun)" }
{ "ok": false, "reason": "validation_error", "message": "Entry timestamp outside supplied range" }
{ "ok": false, "reason": "quota_exceeded", "remaining": 0, "cycle_end": "2025-03-05T12:34:56.000Z" }
{ "ok": false, "reason": "provider_error", "retryable": true, "message": "Upstream timeout" }
{ "ok": false, "reason": "other_error", "message": "Unexpected internal failure; retry later" }
```

---

## 4. Data Model

Table: `public.user_ai_quota`
- `user_id uuid primary key references auth.users (id) on delete cascade`
- `ai_summaries_count int not null default 0`
- `cycle_start_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Rolling cycle: 28 days from `cycle_start_at`. Reset when `now() >= cycle_start_at + interval '28 days'`.

---

## 5. Environment Variables (Edge Function)

| Variable | Required | Notes |
|----------|----------|-------|
| `OPENROUTER_API_KEY` | Yes | Kept secret in Edge runtime |
| `OPENROUTER_MODEL` | Yes | e.g. `openai/gpt-4o-mini` |
| `MAX_PROMPT_CHARS` | Yes | e.g. `10000` |
| `ENTRY_TRUNCATION_LIMIT` | Yes | e.g. `500` |
| `SUPABASE_URL` | Yes | Provided by Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | For server-side mutations (do not expose client) |
| `LOG_LEVEL` | No | `info` (default) / `debug` |

---

## 6. Phased Implementation Plan

### Phase 1: Schema & Configuration ✅ COMPLETED
1. ✅ Write SQL migration for `user_ai_quota`.
2. ✅ Enable RLS + `select_own_quota` (optional; safe even if unused).
3. 🔄 Deploy migration to staging then production.
4. 🔄 Store environment variables in Supabase project settings.
5. ✅ Document rotation procedure (already defined).

### Phase 2: Edge Function Scaffolding ✅ COMPLETED
1. ✅ Create directory `supabase/functions/generate_weekly_summary/`.
2. ✅ Initialize `index.ts` with:
   - ✅ Input parsing
   - ✅ Auth verification (`Authorization: Bearer <token>`)
   - ✅ Basic 400/401/500 helpers
3. ✅ Define TypeScript types: `RequestPayload`, `Entry`, `ErrorResponse`, `SuccessResponse`, `QuotaState`.

### Phase 3: Validation Layer ✅ COMPLETED
1. ✅ Validate presence & format of `week_start`, `week_end`.
2. ✅ Parse as UTC (treat day boundaries at 00:00:00).
3. ✅ Ensure:
   - ✅ `week_start` is Monday
   - ✅ `week_end` is Sunday
   - ✅ Difference = 6 days
   - ✅ `week_start <= all entry timestamps <= week_end + 23:59:59`
   - ✅ `week_start` not more than 1 day in the future vs server `now()`
4. ✅ Reject empty `entries`.
5. ✅ Enforce payload size guard: `entries.length` approx * average length ≤ aggregated char cap pre-normalization (fast fail if absurd).
6. ✅ Accumulate validation errors; return first failing reason (MVP simplicity).

### Phase 4: Quota Read & Reset Logic (Pre-LLM) ✅ COMPLETED
1. ✅ Fetch existing row: `select * from user_ai_quota where user_id = :id`.
2. ✅ If missing: insert row (`ai_summaries_count=0, cycle_start_at=now()`).
3. ✅ If expired: update reset (`ai_summaries_count=0, cycle_start_at=now()`).
4. ✅ Compute:
   - ✅ `limit = 5`
   - ✅ `remaining = max(0, limit - ai_summaries_count)`
   - ✅ `cycle_end = cycle_start_at + 28 days`
5. ✅ If `ai_summaries_count >= limit` → return `quota_exceeded`.

### Phase 5: Entry Normalization & Prompt ✅ COMPLETED
1. ✅ Sort entries chronologically (UTC).
2. ✅ Collapse consecutive identical `text` values:
   - ✅ Maintain buffer; output `"TEXT (xN)"` when count > 1.
3. ✅ Per-entry truncation at `ENTRY_TRUNCATION_LIMIT` -> append `… [truncated]`.
4. ✅ Aggregate text lines; if exceeds `MAX_PROMPT_CHARS`:
   - ✅ Keep earliest block until ~50% budget
   - ✅ Keep newest block until fill budget
   - ✅ Insert marker line `"[... N entries omitted for length]"`.
5. ✅ Detect language fallback if `language` missing:
   - ✅ Count Polish diacritics vs ASCII letters; threshold > 3% diacritics -> `pl`, else `en`.
6. ✅ Build system prompt (language-specific phrasing).
7. ✅ Build user content as newline-separated normalized lines.

### Phase 6: OpenRouter Call ✅ COMPLETED
1. ✅ Prepare JSON:
   - ✅ `model: OPENROUTER_MODEL`
   - ✅ `messages: [{role:'system', content:systemPrompt}, {role:'user', content:userContent}]`
   - ✅ Consider temperature modest (0.5) for balance.
2. ✅ Headers: `Authorization: Bearer ${OPENROUTER_API_KEY}`, plus `HTTP-Referer` / `X-Title` if recommended by provider (optional).
3. ✅ Timeout (e.g., 25s) using `AbortController`.
4. ✅ Handle non-2xx:
   - ✅ Map 408/429/500+ to `provider_error retryable=true`.
5. ✅ Parse response; extract `summaryText`.
6. ✅ Enforce final bullet format (optional post-clean pass):
   - ✅ Split lines; ensure each starts with `- `; if not, add prefix.
   - ✅ Trim leading/trailing whitespace.

### Phase 7: Concurrency-Safe Quota Increment (Post-Success) ✅ COMPLETED
1. ✅ Perform conditional update:
```/dev/null/sql_example.sql#L1-6
update user_ai_quota
set ai_summaries_count = ai_summaries_count + 1,
    updated_at = now()
where user_id = :id
  and ai_summaries_count = :previousCount
returning ai_summaries_count, cycle_start_at;
```
2. ✅ If affected rows = 0:
   - ✅ Fetch fresh row (another concurrent success incremented first).
   - ✅ Recompute `remaining` from refreshed state.
   - ✅ Still return success (no need to re-run LLM).
3. ✅ Compute new `remaining` and `cycle_end`.

### Phase 8: Client Integration ✅ COMPLETED
1. ✅ Created comprehensive TypeScript client SDK with EdgeFunctionClient class
2. ✅ Built React hooks for easy component integration (useWeeklySummary, useQuotaInfo, etc.)
3. ✅ Implemented robust retry logic with exponential backoff
4. ✅ Added comprehensive request/response validation helpers
5. ✅ Created offline queue support for future enhancement
6. ✅ Built date utilities for week range management
7. ✅ Added comprehensive error handling with structured error types
8. ✅ Created extensive documentation and usage examples
9. ✅ Implemented type-safe API with full TypeScript support

### Phase 9: Production Deployment & Testing (NEXT)
1. Scheduler (main process):
   - Checks if current time >= last Sunday 23:00 local OR missed window on launch.
   - Gathers entries (Mon–Sun).
   - Sends request with `language` from settings.
2. Backoff for `provider_error`:
   - e.g. 15m, 30m, 60m, then give up for that week.
3. On success:
   - Persist summary locally.
4. On `quota_exceeded`:
   - Insert local “limit card” with `cycle_end` to suppress further attempts until renewal.
5. No UI exposure of exact remaining count.

### Phase 10: Testing Checklist
| Test | Method | Expected |
|------|--------|----------|
| Valid first summary | Real call (staging) | remaining=4 |
| Quota exhaustion | Loop 5 successes (mock LLM) | 6th => quota_exceeded |
| Cycle reset | Manipulate `cycle_start_at` (SQL) beyond 28d | Count resets |
| Concurrent requests | Launch N parallel mock successes | Count increments once per success; no skip |
| Validation failures | Malformed dates, out-of-range entries | validation_error |
| Future date abuse | week_start > now()+1d | validation_error |
| Oversized entries | Large texts | Truncation markers present |
| Aggregate overflow | > MAX_PROMPT_CHARS | Omission marker inserted |
| Provider timeout | Simulate 504 | provider_error retryable=true |
| Conditional increment race | Force delay before update | Only one row update succeeds first try |

### Phase 11: Deployment
1. Deploy function to staging: `supabase functions deploy generate_weekly_summary --project-ref ...`
2. Run test harness (script performing synthetic validations).
3. Add production secrets (never commit).
4. Deploy to production.
5. Monitor logs first week for provider errors & latency.

### Phase 12: Operational Playbook
| Scenario | Action |
|----------|--------|
| Elevated provider errors | Inspect logs, raise timeout, optionally reduce prompt size |
| Key compromise suspicion | Rotate `OPENROUTER_API_KEY` immediately, invalidate old |
| User reports missing summary & quota not exhausted | Re-run function with same payload manually (admin script) |
| Latency spikes > 15s | Profile normalization step size, reduce char cap |

---

## 7. TypeScript Structural Outline

```/dev/null/index_structure.ts#L1-120
// Pseudocode / structure outline (not final production code)

import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface Entry { timestamp: string; text: string; }
interface RequestPayload {
  week_start: string;
  week_end: string;
  entries: Entry[];
  language?: "pl" | "en";
  client_meta?: Record<string, unknown>;
}
interface SuccessResponse {
  ok: true;
  summary: string;
  remaining: number;
  cycle_end: string;
}
interface ErrorResponse {
  ok: false;
  reason: "auth_error" | "validation_error" | "quota_exceeded" |
          "provider_error" | "other_error";
  message?: string;
  remaining?: number;
  cycle_end?: string;
  retryable?: boolean;
}

const LIMIT = 5;
const CYCLE_DAYS = 28;

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return json({ ok: false, reason: "auth_error", message: "Missing token" }, 401);

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return json({ ok: false, reason: "auth_error", message: "Invalid token" }, 401);

  let payload: RequestPayload;
  try { payload = await req.json(); } catch {
    return json({ ok: false, reason: "validation_error", message: "Invalid JSON" }, 400);
  }

  const vErr = validatePayload(payload, new Date());
  if (vErr) return json(vErr, 400);

  // Quota fetch & possible reset
  const quota = await getOrInitQuota(supabase, user.id);
  const refreshed = await resetIfExpired(supabase, user.id, quota);
  if (refreshed.ai_summaries_count >= LIMIT) {
    return json({
      ok: false,
      reason: "quota_exceeded",
      remaining: 0,
      cycle_end: cycleEndISO(refreshed.cycle_start_at)
    });
  }

  // Normalize entries
  const norm = normalizeEntries(payload.entries);
  const language = payload.language || detectLanguage(norm);
  const prompt = buildPrompt(norm, language);

  // OpenRouter call
  const llm = await callOpenRouter(prompt.system, prompt.user);
  if (!llm.ok) {
    return json({
      ok: false,
      reason: "provider_error",
      retryable: true,
      message: llm.error
    }, 502);
  }

  // Conditional increment
  const incremented = await conditionalIncrement(supabase, user.id, refreshed.ai_summaries_count);
  const finalQuota = incremented ?? await fetchQuota(supabase, user.id);
  const remaining = Math.max(0, LIMIT - finalQuota.ai_summaries_count);

  return json({
    ok: true,
    summary: formatSummary(llm.summary, language),
    remaining,
    cycle_end: cycleEndISO(finalQuota.cycle_start_at)
  });
});

// Helper placeholders...
```

---

## 8. Core Helper Logic (Conceptual)

| Helper | Responsibility |
|--------|----------------|
| `validatePayload()` | Structural & semantic payload checks |
| `getOrInitQuota()` | Upsert-like retrieval (creates zero-count row if absent) |
| `resetIfExpired()` | Lazy reset; returns active quota row |
| `normalizeEntries()` | Sort, collapse consecutive duplicates, per-entry truncation, aggregate cap |
| `detectLanguage()` | Heuristic fallback (count diacritics) |
| `buildPrompt()` | Produce `{ system, user }` strings |
| `callOpenRouter()` | Perform HTTP request with timeout, return structured result |
| `conditionalIncrement()` | Concurrency-safe conditional update |
| `formatSummary()` | Ensure bullet formatting after model output |
| `cycleEndISO()` | Compute cycle end timestamp string |

---

## 9. Concurrency & Race Handling

Problem: Two simultaneous valid requests could both see `ai_summaries_count = 4` and increment to 5 & 6.

Mitigation (optimistic guard):
1. Read current count (e.g., 4).
2. After successful LLM call: `UPDATE ... WHERE user_id = :id AND ai_summaries_count = 4`.
3. If rows affected = 1 → success (now 5).
4. If 0 → Another process updated first; re-fetch row. If row now at limit (5) we still *return the generated summary* (since we already incurred provider cost) but present accurate remaining (0). Do not attempt second increment.

This ensures no overflow beyond limit while not discarding a successful, already-paid response.

---

## 10. Error Mapping Strategy

| Source | Mapping |
|--------|--------|
| Auth missing/invalid | `auth_error` (401) |
| Validation fail | `validation_error` (400) |
| Quota limit | `quota_exceeded` (200) |
| OpenRouter timeout / 429 / >=500 | `provider_error` (502) |
| Unexpected thrown error | `other_error` (500) |

Return consistent JSON; never HTML/plain text.

---

## 11. Security Considerations

- No secret leakage in error messages.
- No echoing of user entry text in logs.
- Rate limiting (future): can later add simple count of provider errors per user in memory / KV if abuse emerges.
- Ensure CORS only allows app origin if relevant (Edge Function defaults acceptable for desktop if direct call).
- Validate `entries.length` upper bound (e.g., cap at 1500 entries/week) to deter spam inflation.

---

## 12. Observability (MVP)

Basic console logs (structured JSON):
```/dev/null/log_example.json#L1-8
{
  "level": "info",
  "event": "summary_success",
  "user_id": "uuid",
  "prompt_chars": 4321,
  "summary_chars": 712,
  "count_after": 2,
  "remaining": 3,
  "latency_ms": 1845
}
```
Errors similar with `"event": "summary_error"` and `reason`.

---

## 13. Rollout Checklist

1. Migrate DB (staging → production).
2. Deploy function (staging).
3. Run manual smoke tests with realistic payload.
4. Simulate quota exhaustion (scripted).
5. Validate concurrency (parallel script).
6. Add client setting for summary language.
7. Release desktop update.
8. Monitor logs first 48h (error rate < 5% provider_error goal).
9. Document any adjustments.

---

## 14. Future Extension Hooks (Non-Implement Now)

| Future Need | Current Hook |
|-------------|--------------|
| Paid plans | Add `plan` column & per-plan limit map |
| Token usage tracking | Add optional capture after OpenRouter response (if provider returns usage) |
| Regeneration with diff | Cache hash of normalized entries; skip LLM if unchanged |
| Multi-language extension | Expand `language` enum & adjust prompt |
| Fallback models | Wrap `callOpenRouter` with retry cascade list |

Design today does not preclude these additions.

---

## 15. Minimal Prompt Example

System (English):
```
You generate concise professional weekly accomplishment summaries.
Output 5–12 bullet points.
Focus on impact, outcomes, notable technologies, collaboration.
Avoid filler, greetings, repetition.
Language: English.
```

System (Polish):
```
Generujesz zwięzłe, profesjonalne podsumowania tygodniowych osiągnięć.
Wypisz 5–12 punktów.
Skup się na rezultatach, wpływie, technologiach, współpracy.
Bez lania wody, bez powitań, bez powtórzeń.
Język: polski.
```

---

## 16. Risk Matrix (Focused)

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Concurrency overshoot | Low | Medium | Conditional update guard |
| Provider latency spikes | Medium | Medium | Timeout + retry client-side |
| Unbounded prompt growth | Medium | High | Truncation strategy |
| Incorrect timezone scheduling (client) | Medium | Low | Future validation augmentation; current minimal guard |
| User clock manipulation | Medium | Low | Reject future weeks (>1 day ahead) |
| Unexpected model output style | Medium | Low | Post-format bullets |

---

## 17. Summary

This plan provides an incremental path to deliver the Edge Function & quota system with privacy, simplicity, and reliability. Each phase builds linearly, reduces risk early (schema + validation first), and isolates complexity (prompt building separate from quota logic).

End of plan.