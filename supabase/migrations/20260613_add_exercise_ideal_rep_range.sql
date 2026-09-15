-- Versión remota 20260613024039. Ya aplicada en Supabase; versionada desde supabase_migrations.schema_migrations.
alter table public.exercises
  add column min_reps integer,
  add column max_reps integer;

alter table public.exercises
  add constraint exercises_rep_range_check
  check (
    (min_reps is null and max_reps is null)
    or (min_reps is not null and max_reps is not null and min_reps >= 1 and min_reps <= max_reps)
  );
