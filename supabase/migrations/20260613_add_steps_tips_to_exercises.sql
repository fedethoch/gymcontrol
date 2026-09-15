-- Versión remota 20260613160249. Ya aplicada en Supabase; versionada desde supabase_migrations.schema_migrations.
ALTER TABLE public.exercises
  ADD COLUMN steps text[] NOT NULL DEFAULT '{}',
  ADD COLUMN tips text[] NOT NULL DEFAULT '{}';
