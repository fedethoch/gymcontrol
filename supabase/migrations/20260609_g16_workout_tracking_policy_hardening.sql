drop policy if exists "workout_sessions_insert_owner_only" on public.workout_sessions;
create policy "workout_sessions_insert_owner_only"
on public.workout_sessions
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.saved_routines saved_routine
    join public.routine_days routine_day
      on routine_day.id = workout_sessions.routine_day_id
     and routine_day.routine_id = saved_routine.routine_template_id
    where saved_routine.id = workout_sessions.saved_routine_id
      and saved_routine.user_id = (select auth.uid())
  )
);

drop policy if exists "workout_sessions_update_owner_only" on public.workout_sessions;
create policy "workout_sessions_update_owner_only"
on public.workout_sessions
for update
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.saved_routines saved_routine
    join public.routine_days routine_day
      on routine_day.id = workout_sessions.routine_day_id
     and routine_day.routine_id = saved_routine.routine_template_id
    where saved_routine.id = workout_sessions.saved_routine_id
      and saved_routine.user_id = (select auth.uid())
  )
);

drop policy if exists "workout_session_items_insert_owner_only" on public.workout_session_items;
create policy "workout_session_items_insert_owner_only"
on public.workout_session_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.workout_sessions workout_session
    join public.routine_items routine_item
      on routine_item.id = workout_session_items.routine_item_id
     and routine_item.routine_day_id = workout_session.routine_day_id
    where workout_session.id = workout_session_items.workout_session_id
      and workout_session.user_id = (select auth.uid())
  )
);

drop policy if exists "workout_session_items_update_owner_only" on public.workout_session_items;
create policy "workout_session_items_update_owner_only"
on public.workout_session_items
for update
to authenticated
using (
  exists (
    select 1
    from public.workout_sessions workout_session
    where workout_session.id = workout_session_items.workout_session_id
      and workout_session.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.workout_sessions workout_session
    join public.routine_items routine_item
      on routine_item.id = workout_session_items.routine_item_id
     and routine_item.routine_day_id = workout_session.routine_day_id
    where workout_session.id = workout_session_items.workout_session_id
      and workout_session.user_id = (select auth.uid())
  )
);
