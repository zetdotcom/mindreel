# Supabase Integration & Edge Function Architecture (MindReel MVP)

## Purpose

MindReel uses Supabase ONLY for:

- User authentication (email/password)
- Enforcing AI summary quota (5 summaries per rolling 28‑day cycle)
- Secure proxying of weekly entries to OpenRouter (hiding the OpenRouter API key)
- (Optional future) lightweight, non-sensitive usage metrics (no raw text)

All user entries and generated summaries are stored **locally** in SQLite within the Electron app. Only the weekly batch of entries for the selected week (and only when generating a summary) is sent transiently to the Edge Function.

---

## High-Level Data Flow

```
User Entries (local SQLite)
        |
        | (Sunday 23:00 local time trigger or catch-up on next launch)
        v
Renderer gathers week entries
        |
        | HTTPS (Bearer <Supabase access token>)
        v
Supabase Edge Function (generate_weekly_summary)
  1. Auth check
  2. Quota validation / reset if cycle expired
  3. (If quota OK) Build prompt & call OpenRouter with server-side key
  4. On success: increment usage count & return summary
        |
        v
Renderer stores summary locally (SQLite 'summaries')
```

No raw entries or summaries are persisted in Supabase—only quota counters.

---

## Components Overview

| Component | Responsibility | Persistent Data? |
|----------|----------------|------------------|
| Electron Renderer | UI, local CRUD of entries & summaries | Local SQLite |
| Electron Main | Scheduling (Sunday 23:00), IPC | Local SQLite |
| Supabase Auth | User identities (email/password) | Yes (Supabase-managed) |
| Table: `user_ai_quota` | Quota count & cycle start timestamp | Yes |
| Edge Function: `generate_weekly_summary` | Auth, quota enforcement, LLM proxy | No (ephemeral request processing) |
| OpenRouter API | LLM inference | External provider |

---

## Schema: `public.user_ai_quota`

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | uuid (PK) | References `auth.users.id` |
| `ai_summaries_count` | int | Successful summaries in current 28‑day cycle |
| `cycle_start_at` | timestamptz | Start of current rolling cycle |
| `updated_at` | timestamptz | Last quota state mutation |

### Rolling Cycle Logic

1. On each access, if `now() >= cycle_start_at + 28 days` → reset:
   - `ai_summaries_count = 0`
   - `cycle_start_at = now()`
2. Limit: **5** successful summaries per cycle.
3. Quota increments **only after** a successful OpenRouter response.
4. Failed LLM attempts (network/provider errors) do **not** consume quota.

Primary key on `user_id` is sufficient for MVP (no extra indexes needed).

---

## Edge Function: `generate_weekly_summary`

### Responsibilities

1. Verify Supabase JWT (via `Authorization: Bearer <access_token>`).
2. Validate payload:
   - `week_start` (YYYY-MM-DD, Monday)
   - `week_end` (YYYY-MM-DD, Sunday)
   - `week_of_year` (ISO week number)
   - `entries[]`: `{ timestamp: ISO8601, text: string }`
   - Sanity: date span = 7 days inclusive; all entries within range.
3. Reset quota if cycle expired.
4. If quota exhausted → return limit response (no OpenRouter call).
5. Compact/clean entries (collapse consecutive duplicates, truncate oversized lines).
6. Construct a controlled prompt and call OpenRouter using server-side `OPENROUTER_API_KEY`.
7. On success:
   - Increment `ai_summaries_count`.
   - Return summary + remaining quota.
8. On provider failure → return error; do not increment quota.
9. Optionally (future) log anonymized usage metrics (e.g., token counts, chars).

### Request JSON (Draft)

```json
{
  "week_start": "2025-02-10",
  "week_end": "2025-02-16",
  "week_of_year": 7,
  "entries": [
    { "timestamp": "2025-02-10T09:12:00.000Z", "text": "Refactor auth logic" },
    { "timestamp": "2025-02-10T11:40:00.000Z", "text": "Fix Electron auto-update issue" }
  ],
  "client_meta": {
    "app_version": "0.1.0",
    "locale": "pl-PL"
  }
}
```

### Success Response

```json
{
  "ok": true,
  "summary": "- Refaktoryzacja logiki uwierzytelniania...\n- Naprawiono problem z automatycznymi aktualizacjami...",
  "remaining": 3,
  "cycle_end": "2025-03-05T12:34:56.000Z",
  "api_version": "1"
}
```

### Limit Reached

```json
{
  "ok": false,
  "reason": "quota_exceeded",
  "remaining": 0,
  "cycle_end": "2025-03-05T12:34:56.000Z",
  "api_version": "1"
}
```

### Provider Error (Retryable)

```json
{
  "ok": false,
  "reason": "provider_error",
  "retryable": true,
  "message": "OpenRouter upstream timeout",
  "api_version": "1"
}
```

### Reason / Error Codes

| reason | Meaning | Client Action |
|--------|---------|---------------|
| `quota_exceeded` | No remaining summaries this cycle | Show limit card until after `cycle_end` |
| `provider_error` | Upstream LLM failed | Retry with backoff if `retryable` |
| `validation_error` | Payload invalid | Log & abort; dev fix |
| `auth_error` | Invalid or expired token | Re-auth user |
| `other_error` | Unexpected internal issue | Log; optional retry |
| (absence, ok=true) | Success | Persist summary locally |

---

## Prompt Construction Guidelines

1. Chronologically sort entries.
2. Collapse **consecutive identical** entries into `"<text> (xN)"`.
3. Truncate any single entry > 500 chars with suffix `… [truncated]`.
4. Hard cap total aggregated prompt characters (e.g. 10,000). If exceeding:
   - Keep earliest and most recent entries; drop middle; insert marker `"[... N entries omitted for length]"`.
5. System Prompt (example):

   ```
   You generate concise weekly professional accomplishment summaries.
   Output: 5–12 bullet points.
   Focus: outcomes, impact, technologies, noteworthy collaboration.
   Language: Polish if majority of entries are Polish, otherwise English.
   Avoid repetition, no salutations, no generic filler.
   ```

6. User content: prepared, newline-separated bullet candidates.

---

## Security Considerations

| Concern | Mitigation |
|---------|------------|
| OpenRouter key theft | Key stored only as Edge Function secret (never bundled) |
| Quota circumvention via local DB edit | Quota stored remotely; local tampering irrelevant |
| Multi-week bundling exploit | Server validates 7-day window + entry timestamp range |
| Duplicate generation for same week | Optional: hash normalized entries; if unchanged, return previous summary (future enhancement) |
| Oversized prompt cost spike | Enforce server-side char cap + truncation |
| Race double increment | Single atomic update (row lock) or condition in function logic |

---

## Optional Postgres Function (If Centralizing Quota Logic)

If you choose to move quota increment into a SECURITY DEFINER function:

```sql
create or replace function increment_ai_summary_usage()
returns table (
  ai_summaries_count int,
  remaining int,
  cycle_end timestamptz,
  cycle_start_at timestamptz
)
language plpgsql
security definer
as $$
declare
  v_limit constant int := 5;
  v_cycle_len interval := interval '28 days';
  r record;
begin
  select * into r from user_ai_quota where user_id = auth.uid() for update;

  if not found then
    insert into user_ai_quota(user_id, ai_summaries_count, cycle_start_at, updated_at)
      values (auth.uid(), 0, now(), now())
      returning * into r;
  end if;

  if now() >= r.cycle_start_at + v_cycle_len then
    update user_ai_quota
      set ai_summaries_count = 0,
          cycle_start_at = now(),
          updated_at = now()
      where user_id = auth.uid()
      returning * into r;
  end if;

  if r.ai_summaries_count >= v_limit then
    ai_summaries_count := r.ai_summaries_count;
    remaining := 0;
    cycle_start_at := r.cycle_start_at;
    cycle_end := r.cycle_start_at + v_cycle_len;
    return;
  end if;

  update user_ai_quota
    set ai_summaries_count = ai_summaries_count + 1,
        updated_at = now()
    where user_id = auth.uid()
    returning * into r;

  ai_summaries_count := r.ai_summaries_count;
  remaining := v_limit - r.ai_summaries_count;
  cycle_start_at := r.cycle_start_at;
  cycle_end := r.cycle_start_at + v_cycle_len;
  return;
end;
$$;
```

For MVP simplicity you can keep the logic inline in the Edge Function instead of introducing this function.

---

## Row Level Security (RLS)

If you allow client-side (read-only) inspection of remaining quota:

```sql
alter table user_ai_quota enable row level security;

create policy "select_own_quota"
  on user_ai_quota
  for select
  using (auth.uid() = user_id);

revoke insert, update, delete on user_ai_quota from anon, authenticated;
```

All mutation flows through Edge Function logic (with service role or SECURITY DEFINER if used). If you do not expose quota reads directly, you can omit RLS (still recommended best practice to enable it).

---

## Environment Variables (Edge Function)

| Variable | Purpose |
|----------|---------|
| `OPENROUTER_API_KEY` | Provider key (secret) |
| `OPENROUTER_MODEL` | Model ID (e.g. `openai/gpt-4o-mini`) |
| `MAX_PROMPT_CHARS` | Aggregate char ceiling (e.g. 10000) |
| `ENTRY_TRUNCATION_LIMIT` | Per-entry char cap (e.g. 500) |
| `API_VERSION` | Response version stamp (default "1") |
| `LOG_TOKEN_USAGE` | If `true`, log usage metrics (later enhancement) |

Rotation procedure: add new key → deploy → test → remove old key.

---

## Client Integration Flow (Summary)

1. Daily entries are appended locally.
2. On (or after) Sunday 23:00 local time:
   - Determine week range (Mon–Sun).
   - Fetch entries in that date range from SQLite.
   - Invoke Edge Function with session access token + payload.
3. Interpret response:
   - `ok = true`: save summary into `summaries` table.
   - `reason = quota_exceeded`: insert a placeholder “limit card” record locally (or flag).
   - `provider_error`: schedule retry (exponential backoff capped).
4. User may manually edit summary text locally (does not trigger another LLM call, does not affect quota).

---

## Error Handling Matrix

| Scenario | Quota Incremented? | Client Action |
|----------|--------------------|---------------|
| Success | Yes | Show summary |
| Provider failure (network / 5xx) | No | Retry w/ backoff; show temporary status |
| Quota exceeded | No | Show limit message until `cycle_end` |
| Auth expired | No | Force re-login; retry after new token |
| Validation error (client bug) | No | Log dev diagnostic |
| Unexpected internal error | No | Retry or log; alert user gracefully |


---

## Privacy Position

- “All your raw entries and summaries stay on your device.”
- “Only the selected week’s entries are sent transiently for AI generation; we do not store them.”
- “We never store your summary text server-side; the Edge Function forwards to the model and returns the result.”

---

## Testing Strategy (Recommended MVP Set)

| Test | Description |
|------|-------------|
| Auth happy path | Valid token accepted |
| Auth rejection | Missing/expired token → 401/`auth_error` |
| Quota initial | First generation returns remaining=4 |
| Quota full | After 5 successes, 6th returns `quota_exceeded` |
| Cycle reset | After simulated +28d, count resets |
| Validation fail | Week range not 7 days or entry outside range |
| Oversize payload | > MAX_PROMPT_CHARS truncated or rejected |
| Provider error | Mock 502 → `provider_error`, no increment |
| Duplicate identical week | (Optional) returns success again OR deduplicated (future) |
| Race condition | Parallel requests only increment once (simulate concurrency) |

---

## Future Extensions (Out of Scope for MVP)

- On-demand arbitrary date range summaries.
- Multi-device sync (would require storing entries remotely).
- Paid tiers (larger quota / premium models).
- Per-user language preference override.
- PII redaction pipeline before LLM call.
- Model fallback cascade (if primary model fails).
- Usage metrics / token cost dashboards.

---

## Implementation Checklist

1. Create `user_ai_quota` table migration.
2. Add Edge Function secrets (OpenRouter key + model).
3. Implement `generate_weekly_summary`:
   - Auth → validation → quota check/reset → LLM call → success path increment → structured response.
4. Add character truncation + duplication collapse logic.
5. Integrate client scheduler (Sunday 23:00) + catch-up.
6. Add client API wrapper (e.g. `summaryService.generateWeekly()`).
7. Update UI to display quota & limit state.
8. Remove any packaging of service role or secret keys in Electron app.
9. Write tests (local + staging).
10. Document key rotation and deployment steps.

---

## Naming Consistency

| Entity | Name |
|--------|------|
| Table | `user_ai_quota` |
| Function (Edge) | `generate_weekly_summary` |
| Columns | `ai_summaries_count`, `cycle_start_at`, `updated_at` |
| Response field | `remaining` |
| Error reasons | `quota_exceeded`, `provider_error`, `validation_error`, `auth_error`, `other_error` |
| Version field | `api_version` |

Ensure migrations, TypeScript types (`db.types.ts`), and Edge Function code match exactly.

---

## Anti-Patterns to Avoid

| Anti-Pattern | Why |
|--------------|-----|
| Shipping service role key in app | Enables DB compromise |
| Incrementing before success | Penalizes users for upstream failures |
| Not validating date range | Allows multi-week bundling exploit |
| Silent truncation | User confusion / hidden data loss |
| Storing raw entries remotely | Breaks privacy promise |
| Ignoring concurrency | Double increments under simultaneous calls |

---

## Glossary

| Term | Meaning |
|------|--------|
| Cycle | Rolling 28-day window starting at `cycle_start_at` |
| Remaining | How many summaries can still be generated in current cycle |
| Limit Card | UI placeholder shown when quota exhausted |
| Edge Function | Supabase serverless function executed per request |
| LLM | Large Language Model (OpenRouter-proxied) |

---

If you modify quota rules or add paid tiers later, update:
1. Schema (new columns or plan tiers)
2. Edge Function logic & reason codes
3. UI wording and privacy note
4. API version if breaking change (`api_version`)

---

_End of Supabase Integration Documentation_
