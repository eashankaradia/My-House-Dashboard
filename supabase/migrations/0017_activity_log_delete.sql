-- Allow household members to permanently delete change-log entries.
-- (The log previously had no delete policy, so rows could never be removed.)

drop policy if exists "activity_delete" on public.activity_log;
create policy "activity_delete" on public.activity_log for delete
  using (auth.uid() = user_id or public.same_household(user_id));
