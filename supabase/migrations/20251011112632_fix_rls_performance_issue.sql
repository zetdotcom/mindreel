-- migration: fix_rls_performance_issue
-- purpose: optimize rls policies to prevent unnecessary re-evaluation of auth.uid() for each row
-- affected tables: public.user_ai_quota (policy updates)
-- special considerations: improves query performance at scale by using subquery pattern for auth functions

-- drop existing rls policies that have performance issues
-- these policies re-evaluate auth.uid() for each row which is inefficient
drop policy if exists "allow authenticated user select own quota" on public.user_ai_quota;
drop policy if exists "allow anonymous user select own quota" on public.user_ai_quota;

-- create optimized rls policy for authenticated users to select their own quota data
-- using (select auth.uid()) prevents re-evaluation of auth.uid() for each row
create policy "allow authenticated user select own quota"
on public.user_ai_quota
for select
to authenticated
using ((select auth.uid()) = user_id);

-- create optimized rls policy for anonymous users to select their own quota data
-- using (select auth.uid()) prevents re-evaluation of auth.uid() for each row
create policy "allow anonymous user select own quota"
on public.user_ai_quota
for select
to anon
using ((select auth.uid()) = user_id);

-- note: no insert/update/delete policies are created intentionally
-- all mutations are handled exclusively by the security definer function
-- this prevents users from tampering with their quota directly while maintaining security
