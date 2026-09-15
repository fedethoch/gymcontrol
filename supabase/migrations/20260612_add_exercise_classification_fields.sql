-- Versión remota 20260612191019. Ya aplicada en Supabase; versionada desde supabase_migrations.schema_migrations.
alter table public.exercises
  add column muscle_group text check (muscle_group is null or muscle_group = any (array['Pecho','Espalda','Piernas','Hombros','Biceps','Triceps','Core'])),
  add column equipment text check (equipment is null or equipment = any (array['Barra','Mancuernas','Maquina','Polea','Peso corporal','Kettlebell'])),
  add column video_url text;
