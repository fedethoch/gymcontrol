create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  saved_routine_id uuid not null references public.saved_routines(id) on delete cascade,
  routine_day_id uuid not null references public.routine_days(id) on delete cascade,
  training_date date not null,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, saved_routine_id, routine_day_id, training_date)
);

create table public.workout_session_items (
  id uuid primary key default gen_random_uuid(),
  workout_session_id uuid not null references public.workout_sessions(id) on delete cascade,
  routine_item_id uuid not null references public.routine_items(id) on delete cascade,
  performed_reps integer check (performed_reps is null or performed_reps > 0),
  used_weight numeric(8,2) check (used_weight is null or used_weight > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workout_session_id, routine_item_id)
);

create index workout_sessions_user_id_idx
on public.workout_sessions (user_id);

create index workout_sessions_saved_routine_id_idx
on public.workout_sessions (saved_routine_id);

create index workout_sessions_training_date_idx
on public.workout_sessions (training_date);

create index workout_sessions_routine_day_id_idx
on public.workout_sessions (routine_day_id);

create index workout_session_items_workout_session_id_idx
on public.workout_session_items (workout_session_id);

create index workout_session_items_routine_item_id_idx
on public.workout_session_items (routine_item_id);

create trigger set_workout_sessions_updated_at
before update on public.workout_sessions
for each row execute function public.set_updated_at();

create trigger set_workout_session_items_updated_at
before update on public.workout_session_items
for each row execute function public.set_updated_at();

alter table public.workout_sessions enable row level security;
alter table public.workout_session_items enable row level security;

revoke all on table public.workout_sessions from anon, authenticated;
revoke all on table public.workout_session_items from anon, authenticated;

grant select, insert, update, delete on table public.workout_sessions to authenticated;
grant select, insert, update, delete on table public.workout_session_items to authenticated;

drop policy if exists "workout_sessions_select_owner_only" on public.workout_sessions;
create policy "workout_sessions_select_owner_only"
on public.workout_sessions
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "workout_sessions_insert_owner_only" on public.workout_sessions;
create policy "workout_sessions_insert_owner_only"
on public.workout_sessions
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "workout_sessions_update_owner_only" on public.workout_sessions;
create policy "workout_sessions_update_owner_only"
on public.workout_sessions
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "workout_sessions_delete_owner_only" on public.workout_sessions;
create policy "workout_sessions_delete_owner_only"
on public.workout_sessions
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "workout_session_items_select_owner_only" on public.workout_session_items;
create policy "workout_session_items_select_owner_only"
on public.workout_session_items
for select
to authenticated
using (
  exists (
    select 1
    from public.workout_sessions workout_session
    where workout_session.id = workout_session_items.workout_session_id
      and workout_session.user_id = (select auth.uid())
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
    where workout_session.id = workout_session_items.workout_session_id
      and workout_session.user_id = (select auth.uid())
  )
);

drop policy if exists "workout_session_items_delete_owner_only" on public.workout_session_items;
create policy "workout_session_items_delete_owner_only"
on public.workout_session_items
for delete
to authenticated
using (
  exists (
    select 1
    from public.workout_sessions workout_session
    where workout_session.id = workout_session_items.workout_session_id
      and workout_session.user_id = (select auth.uid())
  )
);
