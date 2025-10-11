-- migration: create_user_ai_quota_system
-- purpose: establish the ai summary quota tracking system for users
-- affected tables: user_ai_quota (new table)
-- special considerations: implements row-level security and atomic quota management function

-- create the user_ai_quota table to track ai summary usage per user
create table public.user_ai_quota (
  -- primary key and foreign key to auth.users
  user_id uuid primary key references auth.users(id) on delete cascade,

  -- counter for ai summaries generated in current cycle
  ai_summaries_count integer not null default 0,

  -- timestamp when the current 28-day quota cycle began
  cycle_start_at timestamptz not null,

  -- timestamp when the row was last modified
  updated_at timestamptz not null default now()
);

-- enable row level security on the user_ai_quota table
-- this ensures users can only access their own quota information
alter table public.user_ai_quota enable row level security;

-- create rls policy: allow authenticated users to select their own quota data
create policy "allow authenticated user select own quota"
on public.user_ai_quota
for select
to authenticated
using (auth.uid() = user_id);

-- create rls policy: allow anonymous users to select their own quota data
-- (in case anonymous users need to check quota before signing up)
create policy "allow anonymous user select own quota"
on public.user_ai_quota
for select
to anon
using (auth.uid() = user_id);

-- note: no insert/update/delete policies are created intentionally
-- all mutations will be handled exclusively by the security definer function
-- this prevents users from tampering with their quota directly

-- create atomic function to handle quota checking and incrementing
-- this function uses security definer to bypass rls for safe mutations
create or replace function public.increment_ai_summary_count()
returns json
language plpgsql
security definer
as $$
declare
  current_user_id uuid := auth.uid();
  quota_limit int := 5;
  cycle_interval interval := '28 days';
  current_cycle_start timestamptz;
  new_summary_count int;
begin
  -- validate that user is authenticated
  if current_user_id is null then
    return json_build_object('status', 'unauthorized', 'count', 0);
  end if;

  -- upsert the quota row for the user if it doesn't exist (lazy initialization)
  -- this creates a record only when the user first attempts to use ai summaries
  insert into public.user_ai_quota (user_id, ai_summaries_count, cycle_start_at)
  values (current_user_id, 0, now())
  on conflict (user_id) do nothing;

  -- retrieve the current cycle start and count for atomic operations
  select cycle_start_at, ai_summaries_count
  into current_cycle_start, new_summary_count
  from public.user_ai_quota
  where user_id = current_user_id;

  -- check if the 28-day cycle needs to be reset
  if now() >= current_cycle_start + cycle_interval then
    -- reset the cycle: set count to 0 and update cycle start time
    update public.user_ai_quota
    set
      ai_summaries_count = 0,
      cycle_start_at = now(),
      updated_at = now()
    where user_id = current_user_id
    returning cycle_start_at into current_cycle_start;

    -- after reset, count is 0
    new_summary_count := 0;
  end if;

  -- check if the user has reached the quota limit (5 summaries per 28 days)
  if new_summary_count >= quota_limit then
    return json_build_object(
      'status', 'limit_reached',
      'count', new_summary_count,
      'limit', quota_limit,
      'cycle_start', current_cycle_start
    );
  end if;

  -- increment the count and update the timestamp atomically
  update public.user_ai_quota
  set
    ai_summaries_count = ai_summaries_count + 1,
    updated_at = now()
  where user_id = current_user_id
  returning ai_summaries_count into new_summary_count;

  -- return success status with updated count
  return json_build_object(
    'status', 'incremented',
    'count', new_summary_count,
    'limit', quota_limit,
    'cycle_start', current_cycle_start
  );
end;
$$;

-- add comment to the function explaining its purpose and security model
comment on function public.increment_ai_summary_count() is
'atomically checks, resets (if needed), and increments ai summary quota for authenticated user. uses security definer to bypass rls for safe mutations while preventing direct user tampering with quota data.';

-- add comments to the table and columns for documentation
comment on table public.user_ai_quota is
'tracks ai-generated summary usage per user within rolling 28-day cycles. supports mvp quota system with lazy initialization.';

comment on column public.user_ai_quota.user_id is
'foreign key to auth.users, serves as primary key for one-to-one relationship';

comment on column public.user_ai_quota.ai_summaries_count is
'number of ai summaries generated in current 28-day cycle, max 5 for mvp';

comment on column public.user_ai_quota.cycle_start_at is
'timestamp when current 28-day quota cycle began, used for cycle reset logic';

comment on column public.user_ai_quota.updated_at is
'timestamp of last modification, automatically updated on changes';
