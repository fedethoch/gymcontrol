create table public.saved_diets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  diet_template_id uuid not null references public.diet_templates(id) on delete cascade,
  is_active boolean not null default false,
  saved_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, diet_template_id)
);

create table public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create table public.meal_log_items (
  id uuid primary key default gen_random_uuid(),
  meal_log_id uuid not null references public.meal_logs(id) on delete cascade,
  food_id uuid not null references public.foods(id) on delete restrict,
  meal_order integer not null check (meal_order > 0),
  grams numeric(7,1) not null check (grams > 0),
  created_at timestamptz not null default now()
);

create index saved_diets_user_id_idx on public.saved_diets (user_id);
create index meal_logs_user_id_idx on public.meal_logs (user_id);
create index meal_logs_log_date_idx on public.meal_logs (log_date);
create index meal_log_items_meal_log_id_idx on public.meal_log_items (meal_log_id);
create index meal_log_items_food_id_idx on public.meal_log_items (food_id);

create trigger set_saved_diets_updated_at
before update on public.saved_diets
for each row execute function public.set_updated_at();

create trigger set_meal_logs_updated_at
before update on public.meal_logs
for each row execute function public.set_updated_at();

alter table public.saved_diets enable row level security;
alter table public.meal_logs enable row level security;
alter table public.meal_log_items enable row level security;

revoke all on table public.saved_diets from anon, authenticated;
revoke all on table public.meal_logs from anon, authenticated;
revoke all on table public.meal_log_items from anon, authenticated;

grant select, insert, update, delete on table public.saved_diets to authenticated;
grant select, insert, update, delete on table public.meal_logs to authenticated;
grant select, insert, update, delete on table public.meal_log_items to authenticated;

drop policy if exists "saved_diets_select_owner_only" on public.saved_diets;
create policy "saved_diets_select_owner_only"
on public.saved_diets
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "saved_diets_insert_owner_only" on public.saved_diets;
create policy "saved_diets_insert_owner_only"
on public.saved_diets
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "saved_diets_update_owner_only" on public.saved_diets;
create policy "saved_diets_update_owner_only"
on public.saved_diets
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "saved_diets_delete_owner_only" on public.saved_diets;
create policy "saved_diets_delete_owner_only"
on public.saved_diets
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "meal_logs_select_owner_only" on public.meal_logs;
create policy "meal_logs_select_owner_only"
on public.meal_logs
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "meal_logs_insert_owner_only" on public.meal_logs;
create policy "meal_logs_insert_owner_only"
on public.meal_logs
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "meal_logs_update_owner_only" on public.meal_logs;
create policy "meal_logs_update_owner_only"
on public.meal_logs
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "meal_logs_delete_owner_only" on public.meal_logs;
create policy "meal_logs_delete_owner_only"
on public.meal_logs
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "meal_log_items_select_owner_only" on public.meal_log_items;
create policy "meal_log_items_select_owner_only"
on public.meal_log_items
for select
to authenticated
using (
  exists (
    select 1
    from public.meal_logs meal_log
    where meal_log.id = meal_log_items.meal_log_id
      and meal_log.user_id = (select auth.uid())
  )
);

drop policy if exists "meal_log_items_insert_owner_only" on public.meal_log_items;
create policy "meal_log_items_insert_owner_only"
on public.meal_log_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.meal_logs meal_log
    where meal_log.id = meal_log_items.meal_log_id
      and meal_log.user_id = (select auth.uid())
  )
);

drop policy if exists "meal_log_items_update_owner_only" on public.meal_log_items;
create policy "meal_log_items_update_owner_only"
on public.meal_log_items
for update
to authenticated
using (
  exists (
    select 1
    from public.meal_logs meal_log
    where meal_log.id = meal_log_items.meal_log_id
      and meal_log.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.meal_logs meal_log
    where meal_log.id = meal_log_items.meal_log_id
      and meal_log.user_id = (select auth.uid())
  )
);

drop policy if exists "meal_log_items_delete_owner_only" on public.meal_log_items;
create policy "meal_log_items_delete_owner_only"
on public.meal_log_items
for delete
to authenticated
using (
  exists (
    select 1
    from public.meal_logs meal_log
    where meal_log.id = meal_log_items.meal_log_id
      and meal_log.user_id = (select auth.uid())
  )
);
