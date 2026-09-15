-- Versión remota 20260613032117. Ya aplicada en Supabase; versionada desde supabase_migrations.schema_migrations.
alter table public.workout_session_items
  drop constraint workout_session_items_performed_reps_check,
  drop constraint workout_session_items_used_weight_check;

alter table public.workout_session_items
  alter column performed_reps type text using performed_reps::text,
  alter column used_weight type text using used_weight::text;
