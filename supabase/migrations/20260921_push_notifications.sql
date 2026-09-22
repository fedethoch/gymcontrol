-- Avisos push (DESIGN.md §6.4, app/lib/notifications.ts, app/lib/push/).
-- Fase "expand": solo agrega tablas y funciones. El código desplegado antes de este cambio las ignora.
-- push_subscriptions: un dispositivo suscripto. El alta y la reasignación entre cuentas las hace el
--   route handler con service role (un mismo celu puede cambiar de cuenta).
-- notification_preferences: qué avisos quiere cada usuario y a qué hora (hora argentina, APP_TIME_ZONE).
-- push_deliveries: un recordatorio por usuario, tipo y día (dedupe + motivo si no salió). Solo service role.
-- rest_push_jobs: el aviso de fin del descanso pendiente de cada usuario (una fila por usuario). Solo service role.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique check (endpoint ~ '^https://' and char_length(endpoint) <= 1024),
  p256dh text not null check (char_length(p256dh) between 80 and 100),
  auth text not null check (char_length(auth) between 16 and 32),
  origin text not null check (origin ~ '^https?://[^/]+$' and char_length(origin) <= 200),
  user_agent text check (char_length(user_agent) <= 400),
  last_success_at timestamptz,
  last_test_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  training_enabled boolean not null default true,
  training_time time not null default '09:00',
  meal_desayuno_enabled boolean not null default true,
  meal_desayuno_time time not null default '10:00',
  meal_almuerzo_enabled boolean not null default true,
  meal_almuerzo_time time not null default '14:30',
  meal_merienda_enabled boolean not null default true,
  meal_merienda_time time not null default '18:30',
  meal_cena_enabled boolean not null default true,
  meal_cena_time time not null default '22:30',
  weekly_enabled boolean not null default true,
  weekly_iso_day smallint not null default 7 check (weekly_iso_day between 1 and 7),
  weekly_time time not null default '20:00',
  rest_end_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.push_deliveries (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (
    kind in ('training', 'meal_desayuno', 'meal_almuerzo', 'meal_merienda', 'meal_cena', 'weekly')
  ),
  local_date date not null,
  status text not null check (status in ('sending', 'sent', 'skipped', 'failed')),
  detail text check (char_length(detail) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, kind, local_date)
);

create index if not exists push_deliveries_local_date_idx on public.push_deliveries (local_date);

create table if not exists public.rest_push_jobs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  subscription_id uuid not null references public.push_subscriptions(id) on delete cascade,
  token uuid not null unique,
  send_at timestamptz not null,
  payload jsonb not null check (octet_length(payload::text) <= 3072),
  claimed_at timestamptz,
  sent_at timestamptz,
  cancelled_at timestamptz,
  recent_deltas_ms integer[] not null default '{}' check (cardinality(recent_deltas_ms) <= 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rest_push_jobs_due_idx
  on public.rest_push_jobs (send_at)
  where sent_at is null and cancelled_at is null;
create index if not exists rest_push_jobs_subscription_id_idx on public.rest_push_jobs (subscription_id);

drop trigger if exists set_push_subscriptions_updated_at on public.push_subscriptions;
create trigger set_push_subscriptions_updated_at
before update on public.push_subscriptions
for each row execute function public.set_updated_at();

drop trigger if exists set_notification_preferences_updated_at on public.notification_preferences;
create trigger set_notification_preferences_updated_at
before update on public.notification_preferences
for each row execute function public.set_updated_at();

drop trigger if exists set_push_deliveries_updated_at on public.push_deliveries;
create trigger set_push_deliveries_updated_at
before update on public.push_deliveries
for each row execute function public.set_updated_at();

drop trigger if exists set_rest_push_jobs_updated_at on public.rest_push_jobs;
create trigger set_rest_push_jobs_updated_at
before update on public.rest_push_jobs
for each row execute function public.set_updated_at();

alter table public.push_subscriptions enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.push_deliveries enable row level security;
alter table public.rest_push_jobs enable row level security;

revoke all on table public.push_subscriptions from anon, authenticated;
revoke all on table public.notification_preferences from anon, authenticated;
revoke all on table public.push_deliveries from anon, authenticated;
revoke all on table public.rest_push_jobs from anon, authenticated;

grant select, delete on table public.push_subscriptions to authenticated;
grant select, insert, update on table public.notification_preferences to authenticated;
-- push_deliveries y rest_push_jobs: sin grants ni policies para authenticated (solo service role).

drop policy if exists push_subscriptions_select_owner_only on public.push_subscriptions;
create policy push_subscriptions_select_owner_only on public.push_subscriptions
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists push_subscriptions_delete_owner_only on public.push_subscriptions;
create policy push_subscriptions_delete_owner_only on public.push_subscriptions
for delete to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists notification_preferences_select_owner_only on public.notification_preferences;
create policy notification_preferences_select_owner_only on public.notification_preferences
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists notification_preferences_insert_owner_only on public.notification_preferences;
create policy notification_preferences_insert_owner_only on public.notification_preferences
for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists notification_preferences_update_owner_only on public.notification_preferences;
create policy notification_preferences_update_owner_only on public.notification_preferences
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- Reclama los avisos de fin de descanso que vencen dentro de `lookahead_ms` (lo llama el cron cada 5 s).
-- Un reclamo colgado se puede volver a tomar a los 10 s. skip locked: dos ticks no se pisan.
create or replace function public.claim_due_rest_pushes(lookahead_ms integer default 12000)
returns table (
  user_id uuid,
  token uuid,
  send_at timestamptz,
  payload jsonb,
  subscription_id uuid,
  endpoint text,
  p256dh text,
  auth text
)
language sql
set search_path = ''
as $$
  with due as (
    update public.rest_push_jobs as j
    set claimed_at = now()
    where j.user_id in (
      select c.user_id
      from public.rest_push_jobs as c
      where c.sent_at is null
        and c.cancelled_at is null
        and c.send_at <= now() + lookahead_ms * interval '1 millisecond'
        and (c.claimed_at is null or c.claimed_at < now() - interval '10 seconds')
      for update skip locked
    )
    returning j.user_id, j.token, j.send_at, j.payload, j.subscription_id
  )
  select due.user_id, due.token, due.send_at, due.payload, due.subscription_id, s.endpoint, s.p256dh, s.auth
  from due
  join public.push_subscriptions as s on s.id = due.subscription_id;
$$;

comment on function public.claim_due_rest_pushes(integer) is
  'Reclama los avisos de fin de descanso que vencen dentro de lookahead_ms. Solo service role (cron de avisos).';

-- Guarda cuánto tardó en llegar el aviso de fin (recibido − fin del timer, reloj del celu). Últimas 20 mediciones.
create or replace function public.record_rest_push_delta(job_token uuid, delta_ms integer)
returns void
language sql
set search_path = ''
as $$
  update public.rest_push_jobs
  set recent_deltas_ms = (recent_deltas_ms || delta_ms)[greatest(1, cardinality(recent_deltas_ms) - 18):]
  where token = job_token and sent_at is not null;
$$;

comment on function public.record_rest_push_delta(uuid, integer) is
  'Agrega la demora medida por el service worker al aviso de fin de descanso (últimas 20). Solo service role.';

revoke all on function public.claim_due_rest_pushes(integer) from public, anon, authenticated;
revoke all on function public.record_rest_push_delta(uuid, integer) from public, anon, authenticated;
grant execute on function public.claim_due_rest_pushes(integer) to service_role;
grant execute on function public.record_rest_push_delta(uuid, integer) to service_role;

comment on table public.push_subscriptions is
  'Dispositivos suscriptos a avisos push. Alta y reasignación por route handler con service role.';
comment on table public.notification_preferences is
  'Qué avisos quiere cada usuario y a qué hora (hora argentina). Sin fila = valores por defecto.';
comment on table public.push_deliveries is
  'Un recordatorio por usuario, tipo y día: dedupe del cron y motivo si no salió. Solo service role.';
comment on table public.rest_push_jobs is
  'Aviso de fin de descanso pendiente de cada usuario (una fila por usuario). Solo service role.';
