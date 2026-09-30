-- Suplementos (DESIGN.md §6.4, §10.1, §15.2 S8; app/lib/supplements.ts).
-- Fase "expand": el código desplegado antes de este cambio no lee las tablas nuevas, ignora
-- notification_preferences.supplements_enabled (tiene default) y nunca escribe push_deliveries 'supplements_*'.
-- user_supplements: qué toma cada usuario y su recordatorio (hora argentina). Los comunes viven en código
--   (SUPPLEMENT_PRESETS): la fila se crea al marcar uno.
-- supplement_intakes: un tilde por suplemento y día (fecha argentina, como log_date).

create table if not exists public.user_supplements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  preset_key text check (preset_key ~ '^[a-z0-9_]{1,32}$'),
  name text not null check (char_length(name) between 1 and 40 and name = btrim(name)),
  active boolean not null default true,
  reminder_enabled boolean not null default true,
  reminder_time time not null default '09:00',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create unique index if not exists user_supplements_user_preset_key
  on public.user_supplements (user_id, preset_key)
  where preset_key is not null;
create unique index if not exists user_supplements_user_name_key
  on public.user_supplements (user_id, lower(name));

create table if not exists public.supplement_intakes (
  supplement_id uuid not null,
  user_id uuid not null,
  local_date date not null,
  taken_at timestamptz not null default now(),
  primary key (supplement_id, local_date),
  -- Solo se puede tildar un suplemento propio.
  foreign key (supplement_id, user_id) references public.user_supplements (id, user_id) on delete cascade
);

create index if not exists supplement_intakes_user_date_idx on public.supplement_intakes (user_id, local_date);

drop trigger if exists set_user_supplements_updated_at on public.user_supplements;
create trigger set_user_supplements_updated_at
before update on public.user_supplements
for each row execute function public.set_updated_at();

alter table public.notification_preferences
  add column if not exists supplements_enabled boolean not null default true;

-- Una fila por tanda de suplementos: 'supplements_HHMM' (hora argentina del tick).
alter table public.push_deliveries drop constraint if exists push_deliveries_kind_check;
alter table public.push_deliveries add constraint push_deliveries_kind_check check (
  kind in ('training', 'meal_desayuno', 'meal_almuerzo', 'meal_merienda', 'meal_cena', 'weekly')
  or kind ~ '^supplements_([01][0-9]|2[0-3])[0-5][0-9]$'
);

alter table public.user_supplements enable row level security;
alter table public.supplement_intakes enable row level security;

revoke all on table public.user_supplements from anon, authenticated;
revoke all on table public.supplement_intakes from anon, authenticated;

grant select, insert, update, delete on table public.user_supplements to authenticated;
grant select, insert, delete on table public.supplement_intakes to authenticated;

drop policy if exists user_supplements_select_owner_only on public.user_supplements;
create policy user_supplements_select_owner_only on public.user_supplements
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists user_supplements_insert_owner_only on public.user_supplements;
create policy user_supplements_insert_owner_only on public.user_supplements
for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists user_supplements_update_owner_only on public.user_supplements;
create policy user_supplements_update_owner_only on public.user_supplements
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists user_supplements_delete_owner_only on public.user_supplements;
create policy user_supplements_delete_owner_only on public.user_supplements
for delete to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists supplement_intakes_select_owner_only on public.supplement_intakes;
create policy supplement_intakes_select_owner_only on public.supplement_intakes
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists supplement_intakes_insert_owner_only on public.supplement_intakes;
create policy supplement_intakes_insert_owner_only on public.supplement_intakes
for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists supplement_intakes_delete_owner_only on public.supplement_intakes;
create policy supplement_intakes_delete_owner_only on public.supplement_intakes
for delete to authenticated
using ((select auth.uid()) = user_id);

comment on table public.user_supplements is
  'Suplementos de cada usuario (comunes por preset_key o propios) con su recordatorio en hora argentina.';
comment on table public.supplement_intakes is
  'Un tilde por suplemento y día (fecha argentina). Destildar borra la fila.';
comment on column public.notification_preferences.supplements_enabled is
  'Maestro de los recordatorios de suplementos (S7).';
