-- Cron de avisos push (docs/DATABASE.md "Avisos push", app/api/push/cron/route.ts).
-- Se aplica DESPUÉS del deploy que agrega /api/push/cron: antes, el cron llamaría a una ruta que no existe.
-- Necesita dos secretos en Vault, creados a mano por SQL (nunca en archivos del repo):
--   push_cron_base_url → URL de producción (https://gymcontrol-lake.vercel.app)
--   push_cron_secret   → el mismo valor que CRON_SECRET en Vercel
-- Jobs: push-rest-tick cada 5 s (solo llama si hay un descanso por vencer), push-reminders-tick cada 5 min
-- y push-maintenance diario (el job de 5 s deja ~17 mil filas por día en cron.job_run_details).

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

create or replace function private.push_cron_post(task text)
returns void
language plpgsql
set search_path = ''
as $$
declare
  base_url text;
  secret text;
begin
  select decrypted_secret into base_url from vault.decrypted_secrets where name = 'push_cron_base_url';
  select decrypted_secret into secret from vault.decrypted_secrets where name = 'push_cron_secret';

  if base_url is null or secret is null then
    raise warning 'push cron: faltan push_cron_base_url o push_cron_secret en Vault';
    return;
  end if;

  perform net.http_post(
    url := base_url || '/api/push/cron?task=' || task,
    body := '{}'::jsonb,
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || secret),
    timeout_milliseconds := 8000
  );
end;
$$;

-- Misma ventana que REST_PUSH_CLAIM_WINDOW_MS (app/lib/rest-push.ts) y que claim_due_rest_pushes.
create or replace function private.push_rest_tick()
returns void
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.rest_push_jobs
    where sent_at is null
      and cancelled_at is null
      and send_at <= now() + interval '12 seconds'
      and (claimed_at is null or claimed_at < now() - interval '10 seconds')
  ) then
    perform private.push_cron_post('rest');
  end if;
end;
$$;

create or replace function private.push_maintenance()
returns void
language plpgsql
set search_path = ''
as $$
begin
  delete from cron.job_run_details where end_time < now() - interval '2 days';
  delete from public.push_deliveries
  where local_date < (now() at time zone 'America/Argentina/Buenos_Aires')::date - 60;
end;
$$;

revoke all on function private.push_cron_post(text) from public;
revoke all on function private.push_rest_tick() from public;
revoke all on function private.push_maintenance() from public;

-- cron.schedule con el mismo nombre reemplaza el job: la migración se puede volver a correr.
select cron.schedule('push-rest-tick', '5 seconds', 'select private.push_rest_tick()');
select cron.schedule('push-reminders-tick', '*/5 * * * *', $cmd$select private.push_cron_post('reminders')$cmd$);
select cron.schedule('push-maintenance', '23 7 * * *', 'select private.push_maintenance()');
