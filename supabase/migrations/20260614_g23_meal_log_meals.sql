create table public.meal_log_meals (
  id uuid primary key default gen_random_uuid(),
  meal_log_id uuid not null references public.meal_logs(id) on delete cascade,
  name text not null,
  position integer not null default 1,
  created_at timestamptz not null default now()
);

create index meal_log_meals_meal_log_id_idx on public.meal_log_meals (meal_log_id);

alter table public.meal_log_meals enable row level security;
revoke all on table public.meal_log_meals from anon, authenticated;
grant select, insert, update, delete on table public.meal_log_meals to authenticated;

create policy "meal_log_meals_select_owner_only"
on public.meal_log_meals
for select
to authenticated
using (
  exists (
    select 1 from public.meal_logs meal_log
    where meal_log.id = meal_log_meals.meal_log_id
      and meal_log.user_id = (select auth.uid())
  )
);

create policy "meal_log_meals_insert_owner_only"
on public.meal_log_meals
for insert
to authenticated
with check (
  exists (
    select 1 from public.meal_logs meal_log
    where meal_log.id = meal_log_meals.meal_log_id
      and meal_log.user_id = (select auth.uid())
  )
);

create policy "meal_log_meals_update_owner_only"
on public.meal_log_meals
for update
to authenticated
using (
  exists (
    select 1 from public.meal_logs meal_log
    where meal_log.id = meal_log_meals.meal_log_id
      and meal_log.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.meal_logs meal_log
    where meal_log.id = meal_log_meals.meal_log_id
      and meal_log.user_id = (select auth.uid())
  )
);

create policy "meal_log_meals_delete_owner_only"
on public.meal_log_meals
for delete
to authenticated
using (
  exists (
    select 1 from public.meal_logs meal_log
    where meal_log.id = meal_log_meals.meal_log_id
      and meal_log.user_id = (select auth.uid())
  )
);

-- replace meal_order with meal_id on meal_log_items
delete from public.meal_log_items;
alter table public.meal_log_items drop column meal_order;
alter table public.meal_log_items add column meal_id uuid not null references public.meal_log_meals(id) on delete cascade;
create index meal_log_items_meal_id_idx on public.meal_log_items (meal_id);
