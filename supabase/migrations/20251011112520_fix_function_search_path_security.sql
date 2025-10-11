-- migration: fix_function_search_path_security
-- purpose: fix security vulnerability in increment_ai_summary_count function by setting search_path to empty string
-- affected functions: public.increment_ai_summary_count (security update)
-- special considerations: prevents search path injection attacks by securing function search_path

-- drop and recreate the function with secure search_path setting
-- this is necessary because postgresql doesn't allow altering search_path on existing functions
drop function if exists public.increment_ai_summary_count();

-- recreate the function with secure search_path configuration
-- setting search_path to empty string prevents search path injection attacks
create or replace function public.increment_ai_summary_count()
returns json
language plpgsql
security definer
set search_path = ''
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
'atomically checks, resets (if needed), and increments ai summary quota for authenticated user. uses security definer with empty search_path to prevent injection attacks while bypassing rls for safe mutations.';
