create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select p.id
  from public.profiles p
  where p.user_id = (select auth.uid())
  limit 1;
$$;

create or replace function private.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(
    (
      select p.type_rol = 'admin'
      from public.profiles p
      where p.user_id = (select auth.uid())
      limit 1
    ),
    false
  );
$$;

create or replace function private.can_update_own_profile(
  target_profile_id uuid,
  target_user_id uuid,
  target_role text
)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = target_profile_id
      and p.user_id = target_user_id
      and p.user_id = (select auth.uid())
      and p.type_rol = target_role
  );
$$;

revoke all on function private.current_profile_id() from public;
revoke all on function private.is_current_user_admin() from public;
revoke all on function private.can_update_own_profile(uuid, uuid, text) from public;

grant execute on function private.current_profile_id() to authenticated;
grant execute on function private.is_current_user_admin() to authenticated;
grant execute on function private.can_update_own_profile(uuid, uuid, text) to authenticated;

alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.routine_templates enable row level security;
alter table public.routine_days enable row level security;
alter table public.routine_items enable row level security;
alter table public.saved_routines enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.exercises from anon, authenticated;
revoke all on table public.routine_templates from anon, authenticated;
revoke all on table public.routine_days from anon, authenticated;
revoke all on table public.routine_items from anon, authenticated;
revoke all on table public.saved_routines from anon, authenticated;

grant select on table public.exercises to anon, authenticated;
grant select on table public.routine_templates to anon, authenticated;
grant select on table public.routine_days to anon, authenticated;
grant select on table public.routine_items to anon, authenticated;

grant select, insert, update, delete on table public.exercises to authenticated;
grant select, insert, update, delete on table public.routine_templates to authenticated;
grant select, insert, update, delete on table public.routine_days to authenticated;
grant select, insert, update, delete on table public.routine_items to authenticated;

grant select, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.saved_routines to authenticated;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (
  (select auth.uid()) = user_id
  or (select private.is_current_user_admin())
);

drop policy if exists "profiles_update_own_without_role_change" on public.profiles;
create policy "profiles_update_own_without_role_change"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (
    select private.can_update_own_profile(id, user_id, type_rol)
  )
);

drop policy if exists "exercises_select_public_catalog" on public.exercises;
create policy "exercises_select_public_catalog"
on public.exercises
for select
to anon, authenticated
using (true);

drop policy if exists "exercises_insert_admin_only" on public.exercises;
create policy "exercises_insert_admin_only"
on public.exercises
for insert
to authenticated
with check (
  (select private.is_current_user_admin())
  and created_by = (select private.current_profile_id())
);

drop policy if exists "exercises_update_admin_only" on public.exercises;
create policy "exercises_update_admin_only"
on public.exercises
for update
to authenticated
using ((select private.is_current_user_admin()))
with check ((select private.is_current_user_admin()));

drop policy if exists "exercises_delete_admin_only" on public.exercises;
create policy "exercises_delete_admin_only"
on public.exercises
for delete
to authenticated
using ((select private.is_current_user_admin()));

drop policy if exists "routine_templates_select_public_catalog" on public.routine_templates;
create policy "routine_templates_select_public_catalog"
on public.routine_templates
for select
to anon, authenticated
using (true);

drop policy if exists "routine_templates_insert_admin_only" on public.routine_templates;
create policy "routine_templates_insert_admin_only"
on public.routine_templates
for insert
to authenticated
with check (
  (select private.is_current_user_admin())
  and created_by = (select private.current_profile_id())
);

drop policy if exists "routine_templates_update_admin_only" on public.routine_templates;
create policy "routine_templates_update_admin_only"
on public.routine_templates
for update
to authenticated
using ((select private.is_current_user_admin()))
with check ((select private.is_current_user_admin()));

drop policy if exists "routine_templates_delete_admin_only" on public.routine_templates;
create policy "routine_templates_delete_admin_only"
on public.routine_templates
for delete
to authenticated
using ((select private.is_current_user_admin()));

drop policy if exists "routine_days_select_public_catalog" on public.routine_days;
create policy "routine_days_select_public_catalog"
on public.routine_days
for select
to anon, authenticated
using (true);

drop policy if exists "routine_days_insert_admin_only" on public.routine_days;
create policy "routine_days_insert_admin_only"
on public.routine_days
for insert
to authenticated
with check ((select private.is_current_user_admin()));

drop policy if exists "routine_days_update_admin_only" on public.routine_days;
create policy "routine_days_update_admin_only"
on public.routine_days
for update
to authenticated
using ((select private.is_current_user_admin()))
with check ((select private.is_current_user_admin()));

drop policy if exists "routine_days_delete_admin_only" on public.routine_days;
create policy "routine_days_delete_admin_only"
on public.routine_days
for delete
to authenticated
using ((select private.is_current_user_admin()));

drop policy if exists "routine_items_select_public_catalog" on public.routine_items;
create policy "routine_items_select_public_catalog"
on public.routine_items
for select
to anon, authenticated
using (true);

drop policy if exists "routine_items_insert_admin_only" on public.routine_items;
create policy "routine_items_insert_admin_only"
on public.routine_items
for insert
to authenticated
with check ((select private.is_current_user_admin()));

drop policy if exists "routine_items_update_admin_only" on public.routine_items;
create policy "routine_items_update_admin_only"
on public.routine_items
for update
to authenticated
using ((select private.is_current_user_admin()))
with check ((select private.is_current_user_admin()));

drop policy if exists "routine_items_delete_admin_only" on public.routine_items;
create policy "routine_items_delete_admin_only"
on public.routine_items
for delete
to authenticated
using ((select private.is_current_user_admin()));

drop policy if exists "saved_routines_select_owner_only" on public.saved_routines;
create policy "saved_routines_select_owner_only"
on public.saved_routines
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "saved_routines_insert_owner_only" on public.saved_routines;
create policy "saved_routines_insert_owner_only"
on public.saved_routines
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "saved_routines_update_owner_only" on public.saved_routines;
create policy "saved_routines_update_owner_only"
on public.saved_routines
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "saved_routines_delete_owner_only" on public.saved_routines;
create policy "saved_routines_delete_owner_only"
on public.saved_routines
for delete
to authenticated
using ((select auth.uid()) = user_id);
